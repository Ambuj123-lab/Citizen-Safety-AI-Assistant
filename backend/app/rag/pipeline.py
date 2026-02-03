"""
RAG Pipeline - Document Processing, Embeddings, and LLM
"""

# Standard imports
import os
import re
from typing import List, Optional
from datetime import datetime
import logging
import json
import time

# --- CRITICAL FIX: Disable ChromaDB Telemetry Forcefully ---
# Must be set BEFORE importing Chroma/LangChain
os.environ["ANONYMIZED_TELEMETRY"] = "False"
os.environ["CHROMA_TELEMETRY_IMPL"] = "False"

from pybreaker import CircuitBreaker
from langchain_community.vectorstores import Chroma
from app.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

try:
    from langfuse.callback import CallbackHandler as LangfuseHandler
except (ImportError, ModuleNotFoundError) as e:
    # Use print for now if logger isn't ready, or just pass
    print(f"⚠️ Langfuse callback handler not available: {e}")
    LangfuseHandler = None

# --- Circuit Breaker for LLM calls ---
llm_breaker = CircuitBreaker(fail_max=5, reset_timeout=30)

# --- Global instances ---
_embeddings = None
_vector_db = None
_analyzer = None
_anonymizer = None


def get_embeddings():
    """Get or create embeddings model (Lazy Load - Uses API to save server RAM)"""
    global _embeddings
    if _embeddings is None:
        try:
            from langchain_community.embeddings import JinaEmbeddings
            logger.info("Initializing Jina AI Embeddings (High Performance + 1M Free Tokens)...")
            _embeddings = JinaEmbeddings(
                jina_api_key=settings.JINA_API_KEY,
                model_name="jina-embeddings-v2-base-en"
            )
        except Exception as e:
            logger.error(f"Failed to init Jina Embeddings: {e}")
            raise e
    return _embeddings



def get_security_engines():
    """Get Presidio security engines with explicit spaCy configuration"""
    global _analyzer, _anonymizer
    if _analyzer is None:
        from presidio_analyzer.nlp_engine import NlpEngineProvider
        from presidio_analyzer import AnalyzerEngine, PatternRecognizer, Pattern
        from presidio_anonymizer import AnonymizerEngine
        
        # Configure spaCy engine explicitly (Lightweight model)
        configuration = {
            "nlp_engine_name": "spacy",
            "models": [{"lang_code": "en", "model_name": "en_core_web_sm"}],
        }
        provider = NlpEngineProvider(nlp_configuration=configuration)
        nlp_engine = provider.create_engine()
        
        _analyzer = AnalyzerEngine(nlp_engine=nlp_engine, default_score_threshold=0.4)
        
        # Add custom recognizer for simple 10-digit phone numbers (common in India)
        phone_pattern = Pattern(
            name="phone_number_regex",
            regex=r"(\+91[\-\s]?)?[6-9]\d{9}",
            score=0.5
        )
        phone_recognizer = PatternRecognizer(
            supported_entity="PHONE_NUMBER",
            patterns=[phone_pattern]
        )
        _analyzer.registry.add_recognizer(phone_recognizer)
        
        _anonymizer = AnonymizerEngine()
    return _analyzer, _anonymizer


def mask_pii(text: str) -> tuple[str, bool]:
    """Mask PII (Personal Identifiable Information)"""
    try:
        analyzer, anonymizer = get_security_engines()
        results = analyzer.analyze(
            text=text,
            entities=["PHONE_NUMBER", "EMAIL_ADDRESS", "PERSON", "LOCATION", "GPE"],
            language='en'
        )
        # Filter for high confidence
        results = [r for r in results if r.score >= 0.3]
        
        anonymized = anonymizer.anonymize(text=text, analyzer_results=results)
        entities = []
        for r in results:
            entities.append({
                "type": r.entity_type,
                "score": round(r.score, 2),
                "start": r.start,
                "end": r.end
            })
        return anonymized.text, len(results) > 0, entities
    except Exception as e:
        logger.error(f"PII Masking Error: {e}")
        return text, False, []


def is_abusive(text: str) -> bool:
    """Check for abusive language"""
    bad_words = [
        "stupid", "idiot", "dumb", "hate", "kill", "shut up",
        "useless", "nonsense", "pagal", "bevkuf", "chutiya", "madarchod"
    ]
    for word in bad_words:
        if re.search(r'\b' + re.escape(word) + r'\b', text.lower()):
            return True
    return False


def get_vector_db(data_path: str = None):
    """Get or create vector database"""
    global _vector_db
    
    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    db_path = os.path.join(backend_dir, "chroma_db")
    data_dir = data_path or os.path.join(backend_dir, "data")
    
    from langchain_community.vectorstores import Chroma
    embeddings = get_embeddings()
    
    # Try to load existing DB
    if os.path.exists(db_path):
        try:
            _vector_db = Chroma(
                persist_directory=db_path,
                embedding_function=embeddings
            )
            # Check if it has any data
            count = len(_vector_db.get()['ids'])
            if count > 0:
                logger.info(f"Loaded existing ChromaDB with {count} documents")
                return _vector_db
        except Exception as e:
            logger.warning(f"Could not load DB, rebuilding: {e}")
    
    # Build new DB if data exists (this should be the 8 core PDFs)
    if os.path.exists(data_dir) and os.listdir(data_dir):
        logger.info(f"Indexing core documents from {data_dir}")
        return rebuild_vector_db(data_dir)
    
    return None


def rebuild_vector_db(data_dir: str):
    """Rebuild vector database from scratch (Clears old index)"""
    global _vector_db
    
    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    db_path = os.path.join(backend_dir, "chroma_db")
    
    # Delete old DB if exists for fresh rebuild
    if os.path.exists(db_path):
        import shutil
        try:
            shutil.rmtree(db_path)
            logger.info("Cleared old ChromaDB for rebuild")
        except Exception as e:
            logger.error(f"Error clearing DB: {e}")

    embeddings = get_embeddings()
    
    from langchain_community.document_loaders import PyMuPDFLoader, DirectoryLoader
    from langchain_text_splitters import RecursiveCharacterTextSplitter
    
    loader = DirectoryLoader(
        data_dir,
        glob="*.pdf",
        loader_cls=PyMuPDFLoader
    )
    documents = loader.load()
    
    if not documents:
        logger.warning("No documents found for rebuild")
        return None
    
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=150
    )
    chunks = text_splitter.split_documents(documents)
    
    # Batched embedding for Jina (High Limit: 1M tokens)
    # 50 chunks per batch is safe and fast
    BATCH_SIZE = 50
    DELAY_SECONDS = 0.5
    
    _vector_db = None
    for i in range(0, len(chunks), BATCH_SIZE):
        batch = chunks[i:i + BATCH_SIZE]
        logger.info(f"Indexing batch {i//BATCH_SIZE + 1}/{(len(chunks) + BATCH_SIZE - 1)//BATCH_SIZE} ({len(batch)} chunks)")
        
        if _vector_db is None:
            # First batch - create new DB
            _vector_db = Chroma.from_documents(
                documents=batch,
                embedding=embeddings,
                persist_directory=db_path
            )
        else:
            # Subsequent batches - add to existing
            _vector_db.add_documents(batch)
        
        # Delay between batches to stay under rate limit
        if i + BATCH_SIZE < len(chunks):
            time.sleep(DELAY_SECONDS)

    
    logger.info(json.dumps({
        "event": "vector_db_rebuilt",
        "chunks": len(chunks),
        "timestamp": datetime.now().isoformat()
    }))
    
    return _vector_db



def add_documents_incremental(file_paths: List[str]):
    """
    Add documents incrementally without touching existing index.
    High speed, targeted for user uploads.
    """
    global _vector_db
    
    from langchain_community.document_loaders import PyMuPDFLoader
    from langchain_text_splitters import RecursiveCharacterTextSplitter
    
    if _vector_db is None:
        _vector_db = get_vector_db() or rebuild_vector_db(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data"))
    
    if _vector_db is None:
        logger.error("Could not initialize vector DB for incremental add")
        return 0
    
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=100  # Smaller overlap for speed on small uploads
    )
    
    new_chunks = []
    for file_path in file_paths:
        if os.path.exists(file_path):
            try:
                loader = PyMuPDFLoader(file_path)
                docs = loader.load()
                
                # Tag each document as temporary for easy cleanup later
                for d in docs:
                    d.metadata["is_temporary"] = True
                
                new_chunks.extend(text_splitter.split_documents(docs))
            except Exception as e:
                logger.error(f"Error loading {file_path}: {e}")
    
    if new_chunks:
        _vector_db.add_documents(new_chunks)
        # ChromaDB auto-persists in newer versions
        logger.info(json.dumps({
            "event": "documents_added_incremental",
            "chunks": len(new_chunks),
            "timestamp": datetime.now().isoformat()
        }))
    
    return len(new_chunks)


def clear_temporary_knowledge():
    """
    Surgically remove only temporary user-uploaded documents.
    No re-indexing of core files needed.
    """
    global _vector_db
    if _vector_db is None:
        _vector_db = get_vector_db()
        
    if _vector_db:
        try:
            # Delete by metadata tag
            # Note: ChromaDB supports 'where' filter for delete
            _vector_db.delete(where={"is_temporary": True})
            logger.info("Surgically cleared temporary documents from ChromaDB")
            return True
        except Exception as e:
            logger.error(f"Error clearing temp knowledge: {e}")
            return False
    return False


def generate_response(
    question: str,
    context: str,
    history: str,
    user_name: str = "User"
) -> tuple[str, float]:
    """Generate response using LLM with circuit breaker"""
    from langchain_openai import ChatOpenAI
    from langchain_core.prompts import ChatPromptTemplate
    from langchain_core.output_parsers import StrOutputParser

    start_time = time.time()
    
    system_prompt = """You are **Citizen Safety AI Assistant** created by Ambuj Kumar Tripathi.
You are currently helping **{user_name}**.

### RESPONSE FORMAT (MANDATORY):
- Always use proper **Markdown** with line breaks.
- Structure your response with:
  - **Headers** (### for sections)
  - **Bullet points** (- for lists)
  - **Bold** for important terms
  - Use **blank lines** between sections for readability.

### KNOWLEDGE RULES:
1. **Document Context First**: Answer using the provided Context for law/safety/scheme questions.
2. **General Queries OK**: For "Hi", "Who are you?", tech questions - answer naturally from general knowledge.
3. **No Hallucination**: If specific law/section is NOT in Context, say: "I don't have that specific information in my documents."
4. **Never invent** law numbers, emergency numbers, or legal citations.

### TONE & SAFETY:
- Maintain a **calm, empathetic, and professional** tone.
- **CRITICAL**: If the query suggests immediate life-threatening danger (e.g., suicide, rape, physical assault in progress), explicitly advise calling **Emergency 112** immediately at the TOP of your response before providing any other context.

### LANGUAGE:
- Default: **English**
- If user writes Hindi (Devanagari) -> Reply in Hindi
- If user writes Hinglish -> Reply in Hinglish

### SAFETY & LEGAL DISCLAIMER:
- At the end of every response related to law, safety, or citizen rights, you MUST append this mandatory footer:
  "***Disclaimer:** I am an AI assistant. While I provide information based on available documents, please consult a qualified legal professional or call 112/100 in case of an emergency.*"

---
Context: {context}
Chat History: {history}
User Name: {user_name}
Question: {question}"""

    llm = ChatOpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=settings.OPENROUTER_API_KEY,
        model="meta-llama/llama-3.3-70b-instruct:free",
        temperature=0.3,
        streaming=False,
        max_tokens=3000,
        default_headers={
            "HTTP-Referer": "https://github.com/Ambuj123-lab",
            "X-Title": "Citizen Safety AI"
        }
    )
    
    # Langfuse monitoring for LLM observability
    langfuse_handler = None
    try:
        # Set env vars for Langfuse (reads from settings)
        import os
        os.environ["LANGFUSE_SECRET_KEY"] = settings.LANGFUSE_SECRET_KEY
        os.environ["LANGFUSE_PUBLIC_KEY"] = settings.LANGFUSE_PUBLIC_KEY
        os.environ["LANGFUSE_HOST"] = settings.LANGFUSE_HOST
        if LangfuseHandler:
            langfuse_handler = LangfuseHandler()
        else:
            logger.warning("LangfuseHandler class is None, skipping initialization")

    except Exception as e:
        logger.warning(f"Langfuse init skipped: {e}")
    
    chain = ChatPromptTemplate.from_template(system_prompt) | llm | StrOutputParser()
    
    start_time = time.time()
    
    # Invoke with Langfuse callback if available
    invoke_config = {"callbacks": [langfuse_handler]} if langfuse_handler else {}
    
    try:
        # CIRCUIT BREAKER: Prevent cascading failures if LLM is down
        # Wrap in lambda to correctly pass config kwarg through pybreaker
        def invoke_llm():
            return chain.invoke(
                {"context": context, "question": question, "history": history, "user_name": user_name},
                config=invoke_config
            )
        
        response = llm_breaker.call(invoke_llm)
        
        # Handle None response from LLM
        if response is None:
            logger.warning("LLM returned None response, using fallback")
            response = "I apologize, but I'm temporarily unable to process your request. Please try again in a moment."
            
    except Exception as e:
        logger.error(f"Circuit Breaker/LLM Error: {e}")
        raise e
    
    latency = time.time() - start_time
    
    return response, latency


def search_and_respond(
    question: str,
    chat_history: List[dict] = None,
    user_name: str = "User"
) -> dict:
    """Main RAG function - search context and generate response"""
    
    # 1. Security checks
    if is_abusive(question):
        return {
            "error": "Professional queries only.",
            "response": None,
            "sources": [],
            "confidence": 0,
            "latency": 0
        }
    
    safe_question, pii_found, pii_entities = mask_pii(question)
    
    # 2. Get vector DB
    vector_db = get_vector_db()
    if vector_db is None:
        return {
            "error": "Knowledge base not initialized. Please upload documents.",
            "response": None,
            "sources": [],
            "confidence": 0,
            "latency": 0
        }
    
    # 3. Similarity search with score
    results = vector_db.similarity_search_with_score(safe_question, k=3)
    
    if not results:
        return {
            "error": "No relevant information found.",
            "response": None,
            "sources": [],
            "confidence": 0,
            "latency": 0
        }
    
    # 4. Calculate confidence
    relevant_docs = [doc for doc, score in results]
    best_doc, score_distance = results[0]
    confidence = max(0, min(100, (2.0 - score_distance) / 2.0 * 100))
    
    # 5. Prepare context
    context = "\n\n".join([d.page_content for d in relevant_docs])
    
    # 6. Format chat history (sliding window - last 3)
    history_text = "No previous history."
    if chat_history:
        history_msgs = chat_history[-6:]  # Last 3 pairs
        formatted = []
        for msg in history_msgs:
            role_prefix = "User: " if msg.get("role") == "user" else "Assistant: "
            formatted.append(role_prefix + str(msg.get("content", "")))
        history_text = "\n".join(formatted)
    
    # 7. Generate response
    try:
        response, latency = generate_response(safe_question, context, history_text, user_name)
    except Exception as e:
        logger.error(f"LLM Error: {e}")
        return {
            "error": "AI temporarily unavailable. Please try again.",
            "response": None,
            "sources": [],
            "confidence": 0,
            "latency": 0,
            "pii_masked": pii_found,
            "pii_entities": pii_entities,
            "masked_question": safe_question if pii_found else None
        }
    
    # 8. Format sources with page numbers
    sources = []
    for i, doc in enumerate(relevant_docs):
        source_path = doc.metadata.get('source', 'Unknown')
        source_file = source_path.split('\\')[-1].split('/')[-1].replace('.pdf', '')
        page_num = doc.metadata.get('page', 0) + 1  # PyMuPDF uses 0-indexed pages
        sources.append({
            "source_id": i + 1,
            "file": source_file,
            "page": page_num,
            "preview": doc.page_content[:300]
        })
    
    return {
        "response": response,
        "sources": sources,
        "confidence": round(confidence, 1),
        "latency": round(latency, 2),
        "pii_masked": pii_found,
        "pii_entities": pii_entities,
        "masked_question": safe_question if pii_found else None
    }
