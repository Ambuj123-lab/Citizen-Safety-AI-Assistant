import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { chatAPI, uploadAPI, statsAPI } from '../api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import logo from '../assets/logo.png';

const Dashboard = () => {
    const { user, logout } = useAuth();

    // Chat State
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [lastResponse, setLastResponse] = useState(null);

    // UI State
    const [toasts, setToasts] = useState([]);
    const [stats, setStats] = useState({ visitors: 0, active: 1 });
    const [techExpanded, setTechExpanded] = useState(false);
    const [stagedFiles, setStagedFiles] = useState([]);
    const [uploadedFiles, setUploadedFiles] = useState([]); // Successfully indexed
    const [uploading, setUploading] = useState(false);
    const [isIndexing, setIsIndexing] = useState(false);
    const [auditModal, setAuditModal] = useState(null); // RAW PII data for modal

    // Refs
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const inputRef = useRef(null);

    // Toast System
    const showToast = (message, type = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    };

    // Scroll & Focus
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // Initialize
    useEffect(() => {
        const init = async () => {
            try {
                // Load history
                const history = await chatAPI.getHistory();
                if (history?.messages?.length) {
                    setMessages(history.messages.map(m => ({
                        role: m.role,
                        content: m.content,
                        sources: m.sources,
                        confidence: m.confidence,
                        latency: m.latency,
                        pii_masked: m.pii_masked,
                        pii_entities: m.pii_entities
                    })));
                }
                // Load stats
                await statsAPI.incrementVisit();
                const data = await statsAPI.getStats();
                setStats(prev => ({
                    ...prev,
                    visitors: data.visitors || 0
                }));

                // Fetch real-time active users from Redis
                try {
                    const activeData = await fetch(`${import.meta.env.VITE_API_URL}/api/stats/active`).then(res => res.json());
                    if (activeData.active_users) {
                        setStats(prev => ({ ...prev, active: activeData.active_users }));
                    }
                } catch (err) {
                    console.log('Redis Stats Error:', err);
                }
            } catch (e) {
                console.log('Init:', e.message);
            }
        };
        if (user) init();
    }, [user]);

    // Submit Message
    const handleSubmit = async (e) => {
        e?.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setLoading(true);

        try {
            const response = await chatAPI.sendMessage(userMessage);

            if (response.error) {
                setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${response.error}` }]);
                showToast(response.error, 'warning');
            } else {
                if (response.pii_masked) {
                    showToast('Identity protected using Microsoft Presidio AI', 'info');
                }

                setMessages(prev => {
                    const newMsgs = [...prev];
                    // Update user message with PII metadata
                    if (newMsgs.length >= 1 && newMsgs[newMsgs.length - 1].role === 'user') {
                        newMsgs[newMsgs.length - 1].pii_masked = response.pii_masked;
                        newMsgs[newMsgs.length - 1].pii_entities = response.pii_entities || [];
                    }
                    // Add assistant message
                    newMsgs.push({
                        role: 'assistant',
                        content: response.response,
                        sources: response.sources,
                        confidence: response.confidence,
                        latency: response.latency,
                        pii_masked: response.pii_masked,
                        pii_entities: response.pii_entities || []
                    });
                    return newMsgs;
                });
                setLastResponse({ question: userMessage, response: response.response });

                // Update live metrics from Redis
                if (response.active_users) {
                    setStats(prev => ({ ...prev, active: response.active_users }));
                }
            }
        } catch (e) {
            console.error('Submit Error:', e);
            setMessages(prev => [...prev, { role: 'assistant', content: "⚠️ System busy. Try again." }]);
            showToast('Service temporarily unavailable', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Feedback
    const handleFeedback = async (rating) => {
        if (!lastResponse) return;
        try {
            // Optimistic UI: Hide it immediately
            const currentResponse = lastResponse;
            setLastResponse(null);

            await chatAPI.submitFeedback(currentResponse.question, currentResponse.response, rating);
            showToast(rating === '👍' ? 'Thanks for feedback! 🎉' : 'We\'ll improve! Thanks.', 'success');
        } catch (e) {
            showToast('Feedback failed. Try again.', 'error');
            // If it failed, don't bring it back, user might be annoyed. Just log it.
        }
    };

    // File Upload
    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        setStagedFiles(files);
        showToast(`${files.length} file(s) selected`, 'info');
        e.target.value = '';
    };

    // Index Files
    const handleIndex = async () => {
        if (!stagedFiles.length) return;
        setIsIndexing(true);
        setUploading(true);
        showToast('📤 Indexing files...', 'info');

        try {
            const result = await uploadAPI.uploadFiles(stagedFiles);
            showToast(`✅ ${result.message || 'Indexed successfully!'}`, 'success');

            // Store file names for session visibility
            const names = stagedFiles.map(f => f.name);
            setUploadedFiles(prev => [...new Set([...prev, ...names])]);

            setStagedFiles([]);
        } catch (error) {
            showToast('❌ Index failed', 'error');
        } finally {
            setIsIndexing(false);
            setUploading(false);
        }
    };

    // New Session & Surgical Reset
    const handleNewSession = async () => {
        if (!confirm('Start new session? This clears chat & temporary files. Core 8 PDFs will remain.')) return;
        showToast('♻️ Clearing Temporary Brain...', 'info');
        try {
            await chatAPI.clearHistory();
            await uploadAPI.rebuildKB(false); // Surgical clear (force=false)
            setMessages([]);
            setLastResponse(null);
            setUploadedFiles([]);
            showToast('Temporary Data Cleared! 🛡️', 'success');
        } catch (e) {
            showToast('Failed to reset', 'error');
        }
    };


    // Quick Actions
    const quickActions = [
        { icon: '🚨', text: 'Digital arrest kya hai?', color: 'from-red-500 to-orange-500' },
        { icon: '🏦', text: 'RBI fraud prevention?', color: 'from-blue-500 to-cyan-500' },
        { icon: '👩', text: 'Women helpline numbers?', color: 'from-pink-500 to-purple-500' },
        { icon: '💼', text: 'Fake job scams?', color: 'from-amber-500 to-yellow-500' },
        { icon: '👶', text: 'POCSO Act explained?', color: 'from-green-500 to-emerald-500' },
        { icon: '📋', text: 'Bank complaint kaise karein?', color: 'from-indigo-500 to-violet-500' },
    ];

    // Tech Stack
    const techStack = [
        ['LLM', 'Meta Llama 3.3 70B'],
        ['Vector DB', 'ChromaDB'],
        ['Framework', 'LangChain'],
        ['Backend', 'FastAPI'],
        ['Frontend', 'React + Vite'],
        ['Auth', 'Google OAuth 2.0'],
        ['Database', 'MongoDB Atlas'],
        ['Cache', 'Upstash Redis'],
        ['PII Masking', 'Microsoft Presidio'],
        ['Monitoring', 'Langfuse'],
    ];

    return (
        <div className="flex h-screen bg-[#0a0f1a]">

            {/* Toast Notifications */}
            <div className="fixed top-4 right-4 z-50 space-y-2">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`px-4 py-3 rounded-lg shadow-lg border max-w-sm animate-slide-up
                            ${toast.type === 'success' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' :
                                toast.type === 'error' ? 'bg-red-500/20 border-red-500/50 text-red-300' :
                                    toast.type === 'warning' ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' :
                                        'bg-blue-500/20 border-blue-500/50 text-blue-300'}`}
                    >
                        {toast.message}
                    </div>
                ))}
            </div>

            {/* ========== SIDEBAR ========== */}
            <aside className="w-80 bg-[#111827] border-r border-slate-800 flex flex-col">

                {/* User Card */}
                <div className="p-6 border-b border-slate-700/50">
                    <div className="flex items-center gap-4 mb-4">
                        {user?.picture ? (
                            <img src={user.picture} className="w-12 h-12 rounded-full object-cover border-2 border-amber-500/30" alt="User" />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 text-xl font-black">
                                {user?.name?.charAt(0)}
                            </div>
                        )}
                        <div>
                            <p className="text-base font-bold text-white uppercase tracking-tight">{user?.name}</p>
                            <p className="text-[10px] text-slate-500 font-bold opacity-70">Google OAuth Active</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full py-2.5 rounded-lg bg-red-500/10 text-red-500 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-500/20 transition-all border border-red-500/20"
                    >
                        Logout
                    </button>
                </div>

                {/* Scrollable Sections */}
                <div className="flex-1 overflow-y-auto p-10 space-y-16">

                    {/* Document Control */}
                    <div className="p-8 rounded-[2.5rem] bg-[#0b1220] border border-slate-700/50 space-y-6 shadow-2xl">
                        <h3 className="text-[12px] font-black text-amber-500 uppercase tracking-[0.2em]">📁 Document Control</h3>
                        <p className="text-[11px] text-slate-400 font-bold leading-relaxed opacity-80">Add PDF documents to initialize the system knowledge for this session.</p>

                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept=".pdf"
                            hidden
                            onChange={handleFileUpload}
                        />

                        <div className="space-y-3">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="w-full py-4 rounded-2xl bg-slate-800 text-[11px] font-black text-white hover:bg-slate-700 transition-all flex items-center justify-center gap-2 border border-slate-700 shadow-md group"
                            >
                                <span className="group-hover:scale-110 transition-transform">📎</span>
                                {stagedFiles.length > 0 ? (
                                    <span className="truncate max-w-[180px]">
                                        {stagedFiles.map(f => f.name).join(", ")}
                                    </span>
                                ) : 'Browse PDFs'}
                            </button>

                            {stagedFiles.length > 0 && (
                                <button
                                    onClick={handleIndex}
                                    disabled={isIndexing}
                                    className="w-full py-4 rounded-2xl bg-amber-500 text-slate-900 font-black text-[11px] uppercase tracking-tighter flex items-center justify-center gap-2 hover:bg-amber-400 transition-all shadow-xl shadow-amber-500/20 active:scale-95"
                                >
                                    {isIndexing ? 'Indexing...' : '⚡ Sync Temporary Brain'}
                                </button>
                            )}
                        </div>

                        {/* Successfully Uploaded Files List */}
                        {uploadedFiles.length > 0 && (
                            <div className="pt-4 border-t border-slate-800/50 space-y-2">
                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest pl-1">Live in Session Brain:</p>
                                <div className="space-y-1.5">
                                    {uploadedFiles.map((name, i) => (
                                        <div key={i} className="flex items-center gap-2 px-3 py-2 bg-emerald-500/5 rounded-lg border border-emerald-500/10 text-[9px] font-bold text-emerald-400/80 truncate">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/40"></div>
                                            {name}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent opacity-30"></div>

                    {/* Session Management */}
                    <div className="p-8 rounded-[2.5rem] bg-[#0b1220] border border-slate-700/50 space-y-6 shadow-2xl">
                        <h3 className="text-[12px] font-black text-white uppercase tracking-[0.2em] opacity-40">🔄 Session Control</h3>
                        <button
                            onClick={handleNewSession}
                            className="w-full py-4 rounded-2xl bg-slate-800/50 text-[11px] font-black text-white hover:bg-slate-700 transition-all flex items-center justify-center gap-2 border border-slate-700/50 shadow-lg group"
                        >
                            <span className="group-hover:rotate-180 transition-transform duration-500">🔄</span>
                            Reset Context Brain
                        </button>
                    </div>

                    <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent opacity-30"></div>

                    {/* System Architecture */}
                    <div className="p-8 rounded-[2.5rem] bg-[#0b1220] border border-slate-700/50 space-y-6 shadow-2xl">
                        <button
                            onClick={() => setTechExpanded(!techExpanded)}
                            className="w-full flex items-center justify-between text-[12px] font-black text-white uppercase tracking-[0.2em]"
                        >
                            <span>🛠 Intelligence</span>
                            <span className={`transition-transform text-amber-500 ${techExpanded ? 'rotate-180' : ''}`}>▾</span>
                        </button>

                        {techExpanded && (
                            <div className="space-y-6 pt-2">
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Core Knowledge Base</p>
                                    <div className="grid grid-cols-1 gap-1.5">
                                        {[
                                            'Digital Arrest Advisory',
                                            'POSH Handbook (Women Safety)',
                                            'POCSO Act (Child Protection)',
                                            'RBI BeAware (Fraud Prevention)',
                                            'Banking Ombudsman Scheme',
                                            'Fake Job SMS Advisory',
                                            'RBI OS 2021 Amendments',
                                            'Agent Developer Resume'
                                        ].map((doc, idx) => (
                                            <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-slate-900/50 rounded-lg border border-slate-800/50 text-[9px] font-bold text-slate-400">
                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500/40"></div>
                                                {doc}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Tech Stack</p>
                                    <div className="space-y-2">
                                        {techStack.map(([k, v]) => (
                                            <div key={k} className="flex justify-between text-[10px] bg-slate-900/50 rounded-lg px-3 py-2 border border-slate-800/30">
                                                <span className="text-slate-400 font-medium">{k}</span>
                                                <span className="text-amber-400 font-bold">{v}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent opacity-30"></div>

                    {/* Compliance */}
                    <div className="p-8 rounded-[2.5rem] bg-[#0b1220] border border-slate-700/50 space-y-5 shadow-2xl">
                        <h3 className="text-[12px] font-black text-white uppercase tracking-[0.2em] opacity-40">🛡 Compliance</h3>
                        <div className="text-[11px] text-slate-400 space-y-4 font-black select-none">
                            <div className="flex items-center gap-3 group">
                                <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-500/40 group-hover:scale-125 transition-transform"></div>
                                GDPR COMPLIANT
                            </div>
                            <div className="flex items-center gap-3 group">
                                <div className="w-2 h-2 rounded-full bg-blue-500 shadow-sm shadow-blue-500/40 group-hover:scale-125 transition-transform"></div>
                                PII MASKING ACTIVE
                            </div>
                            <div className="flex items-center gap-3 group">
                                <div className="w-2 h-2 rounded-full bg-amber-500 shadow-sm shadow-amber-500/40 group-hover:scale-125 transition-transform"></div>
                                AUTO-DELETE ON (30D)
                            </div>
                        </div>
                    </div>
                </div>

                {/* Live System Metrics */}
                <div className="p-8 border-t border-slate-700/50 space-y-6">
                    <div>
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                            Live Activity (Redis)
                        </div>
                        <p className="text-4xl font-black text-blue-500 tabular-nums">
                            {stats.active} <span className="text-xs text-blue-500/50">Online</span>
                        </p>
                    </div>

                    <div>
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                            <div className="w-2 h-2 rounded-full bg-amber-500/40"></div>
                            Global Awareness
                        </div>
                        <p className="text-4xl font-black text-amber-500 tabular-nums">
                            {stats.visitors} <span className="text-xs text-amber-500/50">Total</span>
                        </p>
                    </div>
                </div>
            </aside>

            {/* ========== MAIN CHAT ========== */}
            < main className="flex-1 flex flex-col bg-[#0f172a]" >

                {/* Chat Area */}
                < div className="flex-1 overflow-y-auto scroll-smooth" >
                    <div className="max-w-4xl mx-auto px-10 py-10">

                        {/* Welcome Screen */}
                        {messages.length === 0 && !loading && (
                            <div className="text-center py-10">
                                <div className="inline-flex items-center justify-center w-24 h-24 rounded-[2rem] bg-gradient-to-br from-amber-500 to-orange-600 mb-8 shadow-xl shadow-amber-500/20 rotate-3">
                                    <span className="text-5xl -rotate-3">🛡️</span>
                                </div>
                                <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
                                    Citizen Safety & Awareness AI
                                </h1>
                                <p className="text-slate-400 text-lg mb-12 max-w-lg mx-auto leading-relaxed font-bold opacity-70">
                                    by Ambuj Kumar Tripathi. Ask anything about digital safety, POSH, POCSO, or UPI frauds.
                                </p>

                                {/* Quick Actions */}
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-2xl mx-auto">
                                    {quickActions.map((qa, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setInput(qa.text)}
                                            className="group p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50 hover:border-amber-500/50 transition-all text-left hover:scale-[1.03] hover:shadow-lg backdrop-blur-sm"
                                        >
                                            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br ${qa.color} mb-4 text-xl shadow-lg border border-white/10`}>
                                                {qa.icon}
                                            </div>
                                            <p className="text-sm font-black text-slate-300 group-hover:text-amber-400 transition-colors tracking-tight">
                                                {qa.text}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Messages */}
                        <div className="space-y-10">
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex gap-5 animate-message-pop ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>

                                    {/* Bot Avatar */}
                                    {msg.role === 'assistant' && (
                                        <div className="shrink-0 pt-2">
                                            <img src={logo} alt="Bot" className="w-11 h-11 rounded-2xl object-cover border-2 border-amber-500/20 shadow-lg" />
                                        </div>
                                    )}

                                    <div className={`max-w-[85%] space-y-4`}>
                                        <div className={`px-8 py-5 rounded-2xl shadow-xl leading-relaxed ${msg.role === 'user'
                                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-tr-none font-bold'
                                            : 'bg-[#0b1220]/95 text-slate-100 border border-slate-700/50 rounded-tl-none backdrop-blur-md'
                                            }`}>
                                            {msg.role === 'assistant' ? (
                                                <div className="prose prose-invert prose-amber prose-sm max-w-none 
                                                    prose-headings:text-amber-400 prose-headings:font-black prose-headings:uppercase prose-headings:tracking-wider
                                                    prose-strong:text-white prose-strong:font-black
                                                    prose-p:text-slate-100/90 prose-p:leading-relaxed
                                                    prose-li:text-slate-300">
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                                                </div>
                                            ) : (
                                                <p className="text-base">{msg.content}</p>
                                            )}
                                        </div>

                                        {/* Expandable Sources Citation */}
                                        {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                                            <div className="space-y-3">
                                                {/* Mini Badges Overview */}
                                                <div className="flex flex-wrap gap-2">
                                                    {msg.sources.map((src, j) => (
                                                        <span key={j} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/5 text-blue-400/90 text-[10px] font-black uppercase border border-blue-500/10 hover:bg-blue-500/10 transition-all cursor-default select-none">
                                                            <span className="opacity-60">📄</span>
                                                            {src.file || src}
                                                            <span className="text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded ml-2 border border-amber-500/20">P.{src.page || '?'}</span>
                                                        </span>
                                                    ))}
                                                </div>

                                                {/* Details Accordion for Previews */}
                                                <details className="group">
                                                    <summary className="text-[11px] font-black text-slate-500 hover:text-amber-500 cursor-pointer list-none flex items-center gap-2 uppercase tracking-widest transition-colors select-none">
                                                        <span>Expand Source Contexts</span>
                                                        <span className="w-4 h-4 rounded bg-blue-500/20 flex items-center justify-center text-[9px] text-blue-400 border border-blue-500/20">{msg.sources.length}</span>
                                                        <span className="transition-transform group-open:rotate-180 opacity-50">▾</span>
                                                    </summary>

                                                    <div className="mt-4 grid grid-cols-1 gap-4">
                                                        {msg.sources.map((src, j) => (
                                                            <div key={j} className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-amber-500/20 transition-all group/source">
                                                                <div className="flex items-center justify-between mb-3">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 text-xs font-black border border-blue-500/20">
                                                                            {j + 1}
                                                                        </div>
                                                                        <span className="text-xs font-black text-slate-300 uppercase tracking-tight">{src.file || 'Document'}</span>
                                                                    </div>
                                                                    <span className="text-[10px] font-black bg-amber-500/5 text-amber-500 px-2 py-0.5 rounded-full border border-amber-500/20">PAGE {src.page || '?'}</span>
                                                                </div>
                                                                <div className="relative">
                                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500/20 rounded-full"></div>
                                                                    <p className="text-xs text-slate-400 leading-relaxed pl-4 italic select-all">
                                                                        {/* Highlighting simple simulation: make keywords bold if they match query terms */}
                                                                        "{src.preview || 'No preview available'}..."
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </details>
                                            </div>
                                        )}

                                        {/* Metrics */}
                                        <div className="flex flex-wrap items-center gap-3 pt-1">
                                            {msg.role === 'assistant' && msg.confidence && (
                                                <div className="flex items-center gap-1 text-[10px] font-black uppercase text-emerald-500 bg-emerald-500/5 px-2 py-1 rounded-md border border-emerald-500/10 select-none">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                                    {msg.confidence}% MATCH
                                                </div>
                                            )}
                                            {msg.pii_masked && msg.pii_entities?.length > 0 && (
                                                <div className="flex flex-col gap-1.5 animate-message-pop">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            setAuditModal(msg.pii_entities);
                                                            showToast('Generating Security Report...', 'info');
                                                        }}
                                                        className="flex items-center gap-2 text-[10px] font-black uppercase text-blue-400 bg-blue-400/20 px-4 py-2 rounded-xl border-2 border-blue-400/30 shadow-lg shadow-blue-500/10 cursor-pointer hover:bg-blue-400 hover:text-white transition-all active:scale-95 z-[50] relative"
                                                    >
                                                        <span className="text-[14px]">🛡️</span>
                                                        <span>Identity Shielded</span>
                                                        <span className="mx-1 opacity-40">|</span>
                                                        <span className="underline decoration-dotted">View Technical Audit</span>
                                                    </button>
                                                    <div className="flex flex-wrap gap-1 ml-1">
                                                        {[...new Set(msg.pii_entities.map(e => (typeof e === 'object' ? e.type : e)))].map((ent, idx) => (
                                                            <span key={idx} className="text-[8px] font-bold text-slate-500 border border-slate-700/50 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                                                                {ent.replace('_', ' ')} MASKED
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* User Avatar */}
                                    {msg.role === 'user' && (
                                        <div className="shrink-0 pt-2">
                                            {user?.picture?.length > 10 ? (
                                                <img src={user.picture} alt="User" className="w-11 h-11 rounded-2xl object-cover border-2 border-amber-500 shadow-lg" />
                                            ) : (
                                                <div className="w-11 h-11 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-900 font-black text-lg border-2 border-white/20 shadow-lg">
                                                    {user?.name?.charAt(0) || 'U'}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Loading State */}
                            {loading && (
                                <div className="flex gap-5 items-start animate-pulse">
                                    <div className="shrink-0 pt-2">
                                        <img src={logo} alt="Bot" className="w-11 h-11 rounded-2xl object-cover border-2 border-amber-500/10" />
                                    </div>
                                    <div className="bg-slate-800/50 px-8 py-6 rounded-3xl border border-slate-700/50 rounded-bl-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="flex gap-1.5">
                                                <div className="w-2.5 h-2.5 bg-amber-500/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                                <div className="w-2.5 h-2.5 bg-amber-500/60 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
                                                <div className="w-2.5 h-2.5 bg-amber-500/60 rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></div>
                                            </div>
                                            <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-4">Thinking...</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>
                    </div>
                </div >

                {/* Feedback Sticky Bar */}
                {
                    lastResponse && (
                        <div className="bg-slate-900/80 border-t border-slate-800/50 px-6 py-4 backdrop-blur-xl animate-slide-up">
                            <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-xl">🌟</span>
                                    <div className="text-xs">
                                        <p className="font-black text-white uppercase tracking-tight">Was this helpful?</p>
                                        <p className="text-slate-500 font-bold uppercase text-[9px]">Your feedback helps improve safety accuracy.</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <button
                                        onClick={() => handleFeedback('👍')}
                                        className="px-6 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white font-black text-xs uppercase tracking-widest transition-all border border-emerald-500/20 active:scale-95"
                                    >
                                        👍 Yes
                                    </button>
                                    <button
                                        onClick={() => handleFeedback('👎')}
                                        className="px-6 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white font-black text-xs uppercase tracking-widest transition-all border border-red-500/20 active:scale-95"
                                    >
                                        👎 No
                                    </button>
                                    <button
                                        onClick={() => setLastResponse(null)}
                                        className="ml-4 text-slate-600 hover:text-slate-400 text-[10px] font-bold uppercase transition-colors"
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Input Area (Chat Island) */}
                <div className="px-8 pb-10 pt-4 bg-[#0f172a] border-t border-slate-800/10 relative">
                    <form
                        onSubmit={handleSubmit}
                        className="max-w-4xl mx-auto relative group"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}
                    >
                        <div className="relative flex items-center bg-slate-900/60 rounded-2xl border-2 border-slate-700/50 focus-within:border-amber-500 transition-all p-2.5 pr-3 shadow-[0_0_50px_-12px_rgba(245,158,11,0.15)] backdrop-blur-xl">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask me about citizen safety, laws, or prevention..."
                                className="flex-1 bg-transparent text-white placeholder:text-slate-600 outline-none py-5 px-10 font-bold text-lg"
                                disabled={loading}
                            />
                            <button
                                type="submit"
                                disabled={loading || !input.trim()}
                                className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 text-slate-900 flex items-center justify-center disabled:opacity-20 hover:scale-110 active:scale-95 transition-all shadow-xl shadow-amber-500/30 group/btn"
                            >
                                <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 stroke-slate-900 stroke-[3] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
                                    <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>
                        <p className="text-center text-[11px] text-slate-500 mt-6 font-black uppercase tracking-[0.2em] select-none opacity-60">
                            © 2026 Ambuj Kumar Tripathi | Secure Enterprise Intelligence Architecture
                        </p>
                    </form>
                </div>
            </main>

            {/* Security Audit Modal (The Evidence) */}
            {auditModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-lg bg-[#0b1220] border border-blue-500/30 rounded-[2.5rem] shadow-2xl shadow-blue-500/10 overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-500/5 to-transparent">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-2xl">
                                    🛡️
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-white tracking-tight uppercase">Security Audit</h2>
                                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Microsoft Presidio Analysis</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setAuditModal(null)}
                                className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
                            <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Detected Entities</p>
                                <div className="space-y-3">
                                    {auditModal.map((ent, i) => (
                                        <div key={i} className="flex flex-col gap-2 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-black text-blue-400 uppercase tracking-tight">{(ent?.type || ent).replace('_', ' ')}</span>
                                                <span className="text-[10px] font-bold bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">
                                                    {ent?.score ? (ent.score * 100).toFixed(0) : '100'}% Confidence
                                                </span>
                                            </div>
                                            <div className="flex gap-4 text-[9px] font-bold text-slate-500 uppercase">
                                                <span>Offset: {ent?.start ?? '?'} → {ent?.end ?? '?'}</span>
                                                <span>Model: Microsoft Presidio SDK</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4">
                                <p className="text-[10px] font-black text-amber-500/80 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <span>⚠️</span> Technical Note
                                </p>
                                <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                                    This data is generated in real-time by the PII Anonymizer service. Each entity is scored against the <span className="text-white font-bold">spaCy Transformer</span> model before being redacted from the final LLM prompt.
                                </p>
                            </div>
                        </div>

                        <div className="p-8 bg-slate-900/30 border-t border-slate-800">
                            <button
                                onClick={() => setAuditModal(null)}
                                className="w-full py-4 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-black uppercase tracking-[0.2em] transition-all active:scale-95 shadow-lg shadow-blue-500/20"
                            >
                                Close Audit Report
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default Dashboard;
