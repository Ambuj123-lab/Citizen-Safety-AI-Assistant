<div align="center">

# 🛡️ Citizen Safety & Awareness AI

### Production-Grade RAG System for Legal Safety Queries

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![LangChain](https://img.shields.io/badge/LangChain-0.3+-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white)](https://langchain.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

[Live Demo](https://citizen-safety-ai-assistant.vercel.app/) · [Report Bug](https://github.com/Ambuj123-lab/Citizen-Safety-AI-Assistant/issues) · [Request Feature](https://github.com/Ambuj123-lab/Citizen-Safety-AI-Assistant/issues)

</div>

---

## 📋 Overview

Citizen Safety AI is an **enterprise-grade Retrieval-Augmented Generation (RAG) chatbot** designed to provide accurate, source-cited responses to legal safety queries. Built with a focus on **reliability, privacy, and compliance**, this system demonstrates production-ready AI engineering patterns.

### 🎯 Key Differentiators

- **Real-time PII Masking** — Microsoft Presidio + spaCy NLP pipeline
- **Source Citations** — Every response includes document references with page numbers
- **GDPR-Compliant** — 30-day TTL on all user data with automatic cleanup
- **Fault Tolerance** — Circuit breaker pattern for LLM API resilience
- **Rate-Limit Aware** — Batched embeddings with exponential backoff

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CITIZEN SAFETY AI                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐       │
│  │   FRONTEND       │    │    BACKEND       │    │  CLOUD SERVICES  │       │
│  │   (Vercel)       │───▶│    (Render)      │───▶│                  │       │
│  │                  │    │                  │    │                  │       │
│  │  • React 19      │    │  • FastAPI       │    │  • MongoDB Atlas │       │
│  │  • Vite          │    │  • LangChain     │    │  • Upstash Redis │       │
│  │  • TailwindCSS   │    │  • ChromaDB      │    │  • Langfuse      │       │
│  │  • Google OAuth  │    │  • Presidio PII  │    │  • OpenRouter    │       │
│  └──────────────────┘    └──────────────────┘    └──────────────────┘       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## ⚡ Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 19 + Vite + TailwindCSS | Modern SPA with responsive UI |
| **Backend** | FastAPI + Python 3.11 | High-performance async API |
| **Authentication** | Google OAuth 2.0 | Secure user authentication |
| **RAG Pipeline** | LangChain + ChromaDB | Document retrieval & generation |
| **LLM** | Llama 3.3 70B (OpenRouter) | Response generation |
| **Embeddings** | Google Generative AI | `models/embedding-001` |
| **PII Detection** | Microsoft Presidio + spaCy | Real-time data masking |
| **Database** | MongoDB Atlas | Chat history with TTL indexes |
| **Cache/Analytics** | Upstash Redis | Real-time analytics & rate limiting |
| **Observability** | Langfuse | LLM tracing & monitoring |

---

## 🔐 Security Features

```python
# PII Masking Pipeline
class PrivacyPipeline:
    """
    Multi-layer PII detection using:
    - Microsoft Presidio Analyzer
    - spaCy NER (en_core_web_sm)
    - Custom regex patterns for Indian context
    """
    
    MASKED_ENTITIES = [
        "PERSON", "EMAIL_ADDRESS", "PHONE_NUMBER",
        "CREDIT_CARD", "AADHAAR_NUMBER", "PAN_NUMBER"
    ]
```

| Feature | Implementation |
|---------|----------------|
| **PII Masking** | Presidio + spaCy NLP pipeline |
| **Data Retention** | 30-day TTL with automatic deletion |
| **Auth** | Google OAuth 2.0 with JWT tokens |
| **Rate Limiting** | SlowAPI (10 req/min per user) |
| **Input Validation** | Pydantic schemas + sanitization |

---

## 📊 RAG Pipeline

### Document Processing

```python
# Intelligent Chunking Strategy
RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    separators=["\n\n", "\n", ".", "!", "?", ",", " "]
)
```

### Retrieval Strategy

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| **Retriever Type** | MMR (Maximal Marginal Relevance) | Diversity in results |
| **k** | 5 | Balance relevance & context |
| **Fetch k** | 20 | Larger candidate pool |
| **Lambda** | 0.7 | Favor relevance over diversity |

### Knowledge Base

| Document | Category | Chunks |
|----------|----------|--------|
| Consumer Protection Act 2019 | Legal | 89 |
| POCSO Act | Child Safety | 67 |
| POSH Act | Workplace Safety | 54 |
| RBI Fraud Advisories | Financial | 112 |
| Cyber Crime Guidelines | Digital Safety | 78 |
| + 3 more documents | Various | 244 |
| **Total** | | **644 vectors** |

---

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- MongoDB Atlas account
- Google Cloud Console project (OAuth)

### Backend Setup

```bash
# Clone repository
git clone https://github.com/Ambuj123-lab/Citizen-Safety-AI-Assistant.git
cd Citizen-Safety-AI-Assistant/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Download spaCy model
python -m spacy download en_core_web_sm

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Run server
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your credentials

# Run development server
npm run dev
```

---

## 📁 Project Structure

```
citizen-safety-ai/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application entry
│   │   ├── auth/
│   │   │   ├── routes.py        # Google OAuth endpoints
│   │   │   └── dependencies.py  # JWT validation
│   │   ├── rag/
│   │   │   ├── pipeline.py      # RAG chain implementation
│   │   │   ├── routes.py        # Chat API endpoints
│   │   │   └── vectorstore.py   # ChromaDB management
│   │   ├── privacy/
│   │   │   └── pii_masker.py    # Presidio PII detection
│   │   └── analytics/
│   │       └── redis_client.py  # Real-time analytics
│   ├── data/                    # PDF documents
│   ├── chroma_db/               # Vector store
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatInterface.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   └── AuthProvider.jsx
│   │   ├── hooks/
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

---

## 🔧 Configuration

### Environment Variables

#### Backend (.env)

```env
# MongoDB
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/citizen_safety

# Google OAuth
GOOGLE_CLIENT_ID=<your-client-id>
GOOGLE_CLIENT_SECRET=<your-client-secret>

# LLM
OPENROUTER_API_KEY=<your-openrouter-key>

# Embeddings
GOOGLE_API_KEY=<your-google-api-key>

# Analytics
UPSTASH_REDIS_URL=<your-redis-url>

# Monitoring
LANGFUSE_PUBLIC_KEY=<your-public-key>
LANGFUSE_SECRET_KEY=<your-secret-key>
```

#### Frontend (.env.local)

```env
VITE_API_URL=https://your-backend.onrender.com
VITE_GOOGLE_CLIENT_ID=<your-client-id>
```

---

## 📈 Monitoring & Observability

### Langfuse Tracing

```python
# Automatic LLM tracing
from langfuse.callback import CallbackHandler

handler = CallbackHandler(
    public_key=os.getenv("LANGFUSE_PUBLIC_KEY"),
    secret_key=os.getenv("LANGFUSE_SECRET_KEY")
)

# Traces: latency, tokens, costs, user feedback
```

### Metrics Dashboard

| Metric | Source | Purpose |
|--------|--------|---------|
| Query latency | Langfuse | Performance monitoring |
| Token usage | Langfuse | Cost tracking |
| Active users | Redis | Usage analytics |
| Error rates | Application logs | Reliability |

---

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest tests/ -v --cov=app

# Frontend tests
cd frontend
npm run test
```

---

## 🚢 Deployment

### Backend (Render)

1. Connect GitHub repository
2. Set environment variables
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Frontend (Vercel)

1. Import from GitHub
2. Framework preset: Vite
3. Set environment variables
4. Deploy

---

## 📄 API Documentation

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/google` | Google OAuth callback |
| `GET` | `/auth/me` | Get current user |
| `POST` | `/rag/chat` | Send chat message |
| `GET` | `/rag/history` | Get chat history |
| `DELETE` | `/rag/history` | Clear chat history |
| `GET` | `/health` | Health check |

### Example Request

```bash
curl -X POST "https://api.example.com/rag/chat" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"message": "What are my rights under Consumer Protection Act?"}'
```

### Example Response

```json
{
  "response": "Under the Consumer Protection Act 2019, you have the following rights...",
  "sources": [
    {
      "document": "Consumer_Protection_Act_2019.pdf",
      "page": 12,
      "relevance": 0.92
    }
  ],
  "processing_time_ms": 1847
}
```

---

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) first.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 👨‍💻 Author

<div align="center">

**Ambuj Kumar Tripathi**

*GenAI Engineer | RAG Specialist | Full Stack Developer*

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/ambuj-tripathi-042b4a118/)
[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Ambuj123-lab)
[![Portfolio](https://img.shields.io/badge/Portfolio-FF5722?style=for-the-badge&logo=google-chrome&logoColor=white)](https://ambuj-ai-portfolio.netlify.app/)

</div>

---

<div align="center">

**⭐ Star this repo if you found it helpful!**

</div>
