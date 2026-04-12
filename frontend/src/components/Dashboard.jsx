import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { chatAPI, uploadAPI, statsAPI } from '../api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import logo from '../assets/logo.png';
import { Scale, ChevronDown, RotateCcw, FileText, Trash2, LogOut, Send, X, Shield, Activity, Users, Eye } from 'lucide-react';

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
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [isIndexing, setIsIndexing] = useState(false);
    const [auditModal, setAuditModal] = useState(null);

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
                await statsAPI.incrementVisit();
                const data = await statsAPI.getStats();
                setStats(prev => ({
                    ...prev,
                    visitors: data.visitors || 0
                }));

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
                    if (newMsgs.length >= 1 && newMsgs[newMsgs.length - 1].role === 'user') {
                        newMsgs[newMsgs.length - 1].pii_masked = response.pii_masked;
                        newMsgs[newMsgs.length - 1].pii_entities = response.pii_entities || [];
                    }
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
            const currentResponse = lastResponse;
            setLastResponse(null);

            await chatAPI.submitFeedback(currentResponse.question, currentResponse.response, rating);
            showToast(rating === '👍' ? 'Thanks for feedback! 🎉' : 'We\'ll improve! Thanks.', 'success');
        } catch (e) {
            showToast('Feedback failed. Try again.', 'error');
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
        if (!confirm('Start new session? This clears chat & temporary files. Core PDFs will remain.')) return;
        showToast('♻️ Clearing session data...', 'info');
        try {
            await chatAPI.clearHistory();
            await uploadAPI.rebuildKB(false);
            setMessages([]);
            setLastResponse(null);
            setUploadedFiles([]);
            showToast('Session cleared successfully', 'success');
        } catch (e) {
            showToast('Failed to reset', 'error');
        }
    };

    // Quick Actions
    const quickActions = [
        { icon: '🚨', text: 'Digital arrest kya hai?', accent: 'from-red-500/20 to-orange-500/20', border: 'hover:border-red-500/30' },
        { icon: '🏦', text: 'RBI fraud prevention?', accent: 'from-blue-500/20 to-cyan-500/20', border: 'hover:border-blue-500/30' },
        { icon: '👩', text: 'Women helpline numbers?', accent: 'from-pink-500/20 to-purple-500/20', border: 'hover:border-pink-500/30' },
        { icon: '💼', text: 'Fake job scams?', accent: 'from-amber-500/20 to-yellow-500/20', border: 'hover:border-amber-500/30' },
        { icon: '👶', text: 'POCSO Act explained?', accent: 'from-green-500/20 to-emerald-500/20', border: 'hover:border-green-500/30' },
        { icon: '📋', text: 'Bank complaint kaise karein?', accent: 'from-indigo-500/20 to-violet-500/20', border: 'hover:border-indigo-500/30' },
    ];

    // Tech Stack
    const techStack = [
        ['LLM', 'Qwen3 235B'],
        ['Embeddings', 'Jina V2'],
        ['Vector DB', 'Pinecone Serverless'],
        ['Framework', 'LangChain'],
        ['Backend', 'FastAPI'],
        ['Frontend', 'React 19 + Vite'],
        ['Auth', 'Google OAuth 2.0'],
        ['Database', 'MongoDB Atlas'],
        ['Cache', 'Upstash Redis'],
        ['PII Engine', 'Microsoft Presidio'],
        ['Monitoring', 'Langfuse'],
    ];

    return (
        <div className="flex h-screen bg-[#030712] font-sans">

            {/* ═══ Toast Notifications ═══ */}
            <div className="fixed top-4 right-4 z-50 space-y-2">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`px-4 py-3 rounded-lg shadow-xl border text-sm font-medium max-w-sm animate-slide-up backdrop-blur-sm
                            ${toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                toast.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                    toast.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                                        'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'}`}
                    >
                        {toast.message}
                    </div>
                ))}
            </div>

            {/* ═══════════════ SIDEBAR ═══════════════ */}
            <aside className="w-[260px] bg-[#0a0f1c] border-r border-white/[0.04] flex flex-col h-screen shrink-0">

                {/* App Header */}
                <div className="h-14 px-5 border-b border-white/[0.04] flex items-center gap-3">
                    <img src={logo} alt="Logo" className="w-7 h-7 object-contain" />
                    <div>
                        <span className="text-[13px] font-semibold text-white/90 tracking-tight block leading-tight">Citizen Safety AI</span>
                        <span className="text-[9px] text-slate-500 font-normal">by Ambuj Kumar Tripathi</span>
                    </div>
                </div>

                {/* User Profile */}
                <div className="px-4 py-4 border-b border-white/[0.04]">
                    <div className="flex items-center gap-3">
                        {user?.picture ? (
                            <img src={user.picture} className="w-9 h-9 rounded-full object-cover ring-1 ring-white/10" alt="User" />
                        ) : (
                            <div className="w-9 h-9 rounded-full bg-cyan-500/10 ring-1 ring-cyan-500/20 flex items-center justify-center text-cyan-400 text-sm font-semibold">
                                {user?.name?.charAt(0)}
                            </div>
                        )}
                        <div className="overflow-hidden flex-1 min-w-0">
                            <p className="text-[13px] font-medium text-white/90 truncate">{user?.name}</p>
                            <p className="text-[10px] text-slate-500 truncate">{user?.email || 'Authenticated'}</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 scrollbar-hide">

                    {/* Reset Session */}
                    <button
                        onClick={handleNewSession}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.03] transition-all text-[13px] font-normal group"
                    >
                        <RotateCcw className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:rotate-[-180deg] transition-all duration-500" />
                        Reset Session
                    </button>

                    {/* Upload Section */}
                    <div className="pt-2">
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept=".pdf"
                            hidden
                            onChange={handleFileUpload}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.03] transition-all text-[13px] font-normal group"
                        >
                            <FileText className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                            {stagedFiles.length > 0 ? (
                                <span className="truncate">{stagedFiles.map(f => f.name).join(', ')}</span>
                            ) : 'Upload PDFs'}
                        </button>

                        {stagedFiles.length > 0 && (
                            <button
                                onClick={handleIndex}
                                disabled={isIndexing}
                                className="w-full mt-1.5 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-all text-[12px] font-medium border border-cyan-500/10"
                            >
                                {isIndexing ? 'Indexing...' : '⚡ Index to Knowledge Base'}
                            </button>
                        )}

                        {uploadedFiles.length > 0 && (
                            <div className="mt-2 space-y-1 px-1">
                                {uploadedFiles.map((name, i) => (
                                    <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-emerald-500/5 text-[10px] font-medium text-emerald-400/80 truncate">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                                        {name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-white/[0.03] mx-2 my-3" />

                    {/* Knowledge Base Accordion */}
                    <div>
                        <button
                            onClick={() => setTechExpanded(!techExpanded)}
                            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.03] transition-all text-[13px] font-normal"
                        >
                            <span className="flex items-center gap-3">
                                <Scale className="w-4 h-4 text-slate-500" />
                                System Info
                            </span>
                            <ChevronDown className={`w-3.5 h-3.5 text-slate-600 transition-transform duration-200 ${techExpanded ? 'rotate-180' : ''}`} />
                        </button>

                        {techExpanded && (
                            <div className="mt-1 space-y-3 px-2 pb-2">
                                {/* KB Docs */}
                                <div>
                                    <p className="text-[9px] font-medium text-slate-600 uppercase tracking-wider px-2 mb-2">Knowledge Base</p>
                                    <div className="space-y-0.5">
                                        {[
                                            'Digital Arrest Advisory',
                                            'POSH Handbook',
                                            'POCSO Act',
                                            'RBI BeAware',
                                            'Banking Ombudsman',
                                            'Fake Job Advisory',
                                            'RBI OS 2021',
                                            'Developer Resume'
                                        ].map((doc, idx) => (
                                            <div key={idx} className="flex items-center gap-2.5 px-3 py-1.5 rounded-md text-[11px] text-slate-500 hover:text-slate-300 hover:bg-white/[0.02] cursor-default transition-colors">
                                                <div className="w-1 h-1 rounded-full bg-cyan-500/30 flex-shrink-0" />
                                                {doc}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Tech Stack */}
                                <div>
                                    <p className="text-[9px] font-medium text-slate-600 uppercase tracking-wider px-2 mb-2">Architecture</p>
                                    <div className="space-y-1">
                                        {techStack.map(([k, v]) => (
                                            <div key={k} className="flex justify-between text-[10px] px-3 py-1.5 rounded-md bg-white/[0.01]">
                                                <span className="text-slate-500">{k}</span>
                                                <span className="text-slate-300 font-medium">{v}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-white/[0.03] mx-2 my-3" />

                    {/* Status Indicators */}
                    <div className="px-3 py-2 space-y-2.5">
                        <div className="flex items-center gap-2.5 text-[11px] font-normal text-slate-500">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                            </span>
                            System Online
                        </div>
                        <div className="flex items-center gap-2.5 text-[11px] font-normal text-slate-500">
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 flex-shrink-0" />
                            PII Masking Active
                        </div>
                        <div className="flex items-center gap-2.5 text-[11px] font-normal text-slate-500">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                            Auto-Delete: 30 Days
                        </div>
                    </div>
                </div>

                {/* Metrics Bar */}
                <div className="px-4 py-3 border-t border-white/[0.04] flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                        <Users className="w-3 h-3" />
                        <span className="text-cyan-400 font-semibold tabular-nums">{stats.active}</span> live
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                        <Eye className="w-3 h-3" />
                        <span className="text-slate-300 font-semibold tabular-nums">{stats.visitors}</span> total
                    </div>
                </div>

                {/* Logout */}
                <div className="p-3 border-t border-white/[0.04]">
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-all text-[13px] font-normal group"
                    >
                        <LogOut className="w-4 h-4 group-hover:text-red-400 transition-colors" />
                        Sign out
                    </button>
                </div>
            </aside>

            {/* ═══════════════ MAIN CHAT AREA ═══════════════ */}
            <main className="flex-1 flex flex-col bg-[#030712]">

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto scroll-smooth scrollbar-hide">
                    <div className="max-w-3xl mx-auto px-8 py-8">

                        {/* Welcome Screen */}
                        {messages.length === 0 && !loading && (
                            <div className="text-center py-16 animate-fade-in-up">
                                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/10 mb-6">
                                    <span className="text-4xl">🛡️</span>
                                </div>
                                <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
                                    Citizen Safety & Awareness AI
                                </h1>
                                <p className="text-slate-500 text-sm mb-12 max-w-md mx-auto leading-relaxed">
                                    by <span className="text-slate-300 font-medium">Ambuj Kumar Tripathi</span>. Ask about digital safety, legal rights, POSH, POCSO, or financial fraud prevention.
                                </p>

                                {/* Quick Actions */}
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 max-w-xl mx-auto">
                                    {quickActions.map((qa, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setInput(qa.text)}
                                            className={`group p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] ${qa.border} transition-all text-left hover:bg-white/[0.03] active:scale-[0.98]`}
                                            style={{ animationDelay: `${i * 50}ms` }}
                                        >
                                            <span className="text-xl mb-2.5 block">{qa.icon}</span>
                                            <p className="text-[12px] font-medium text-slate-400 group-hover:text-white transition-colors leading-snug">
                                                {qa.text}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Messages */}
                        <div className="space-y-6">
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex gap-3 animate-fade-in-up ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>

                                    {/* Bot Avatar */}
                                    {msg.role === 'assistant' && (
                                        <div className="shrink-0 pt-1">
                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/10 flex items-center justify-center">
                                                <img src={logo} alt="AI" className="w-5 h-5 object-contain" />
                                            </div>
                                        </div>
                                    )}

                                    <div className="max-w-[80%] space-y-2.5">
                                        <div className={`px-5 py-4 rounded-2xl leading-relaxed ${msg.role === 'user'
                                            ? 'bg-cyan-500/8 text-white border border-cyan-500/10 rounded-tr-sm'
                                            : 'bg-white/[0.02] text-slate-200 border border-white/[0.04] rounded-tl-sm'
                                            }`}>
                                            {msg.role === 'assistant' ? (
                                                <div className="prose prose-sm prose-invert max-w-none prose-chat
                                                    prose-headings:text-cyan-300 prose-headings:font-bold prose-headings:text-sm
                                                    prose-strong:text-white prose-strong:font-semibold
                                                    prose-p:text-slate-300 prose-p:text-[13px] prose-p:leading-relaxed
                                                    prose-li:text-slate-300 prose-li:text-[13px]
                                                    prose-a:text-cyan-400">
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                                                </div>
                                            ) : (
                                                <p className="text-[14px] font-normal">{msg.content}</p>
                                            )}
                                        </div>

                                        {/* Source Citations */}
                                        {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                                            <div className="space-y-2">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {msg.sources.map((src, j) => (
                                                        <span key={j} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.02] text-[10px] font-medium text-slate-400 border border-white/[0.04] select-none">
                                                            📄 {src.file || src}
                                                            <span className="text-cyan-400/70 bg-cyan-500/5 px-1.5 py-0.5 rounded text-[9px]">p.{src.page || '?'}</span>
                                                        </span>
                                                    ))}
                                                </div>

                                                <details className="group">
                                                    <summary className="text-[10px] font-medium text-slate-600 hover:text-slate-400 cursor-pointer list-none flex items-center gap-1.5 transition-colors select-none">
                                                        <span>View source context</span>
                                                        <span className="text-[9px] text-slate-600 bg-white/[0.03] px-1.5 py-0.5 rounded">{msg.sources.length}</span>
                                                        <ChevronDown className="w-3 h-3 transition-transform group-open:rotate-180 text-slate-600" />
                                                    </summary>

                                                    <div className="mt-2.5 space-y-2">
                                                        {msg.sources.map((src, j) => (
                                                            <div key={j} className="p-3 rounded-xl bg-white/[0.015] border border-white/[0.03]">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="w-5 h-5 rounded bg-cyan-500/10 flex items-center justify-center text-cyan-400 text-[9px] font-bold">{j + 1}</span>
                                                                        <span className="text-[11px] font-medium text-slate-300">{src.file || 'Document'}</span>
                                                                    </div>
                                                                    <span className="text-[9px] font-medium text-slate-500 bg-white/[0.03] px-2 py-0.5 rounded">Page {src.page || '?'}</span>
                                                                </div>
                                                                <div className="relative pl-3 border-l border-cyan-500/10">
                                                                    <p className="text-[11px] text-slate-500 leading-relaxed italic">
                                                                        "{src.preview || 'No preview available'}..."
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </details>
                                            </div>
                                        )}

                                        {/* Metrics & PII */}
                                        <div className="flex flex-wrap items-center gap-2">
                                            {msg.role === 'assistant' && msg.confidence && (
                                                <div className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-400/80 bg-emerald-500/5 px-2.5 py-1 rounded-md border border-emerald-500/10 select-none">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                    {msg.confidence}% match
                                                </div>
                                            )}
                                            {msg.pii_masked && msg.pii_entities?.length > 0 && (
                                                <div className="flex flex-col gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            setAuditModal(msg.pii_entities);
                                                            showToast('Generating security report...', 'info');
                                                        }}
                                                        className="flex items-center gap-2 text-[10px] font-medium text-blue-400/80 bg-blue-500/5 px-3 py-1.5 rounded-md border border-blue-500/10 cursor-pointer hover:bg-blue-500/10 hover:text-blue-300 transition-all active:scale-95"
                                                    >
                                                        <Shield className="w-3 h-3" />
                                                        <span>Identity Shielded</span>
                                                        <span className="mx-0.5 opacity-30">·</span>
                                                        <span className="underline decoration-dotted underline-offset-2">View Audit</span>
                                                    </button>
                                                    <div className="flex flex-wrap gap-1 ml-0.5">
                                                        {[...new Set(msg.pii_entities.map(e => (typeof e === 'object' ? e.type : e)))].map((ent, idx) => (
                                                            <span key={idx} className="text-[8px] font-medium text-slate-600 border border-white/[0.04] px-1.5 py-0.5 rounded uppercase tracking-wide">
                                                                {ent.replace('_', ' ')}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* User Avatar */}
                                    {msg.role === 'user' && (
                                        <div className="shrink-0 pt-1">
                                            {user?.picture?.length > 10 ? (
                                                <img src={user.picture} alt="User" className="w-8 h-8 rounded-lg object-cover ring-1 ring-cyan-500/20" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 font-semibold text-sm ring-1 ring-cyan-500/20">
                                                    {user?.name?.charAt(0) || 'U'}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Loading */}
                            {loading && (
                                <div className="flex gap-3 items-start animate-fade-in">
                                    <div className="shrink-0 pt-1">
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/10 flex items-center justify-center">
                                            <img src={logo} alt="AI" className="w-5 h-5 object-contain opacity-50" />
                                        </div>
                                    </div>
                                    <div className="bg-white/[0.02] px-5 py-4 rounded-2xl border border-white/[0.04] rounded-tl-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="flex gap-1">
                                                <div className="w-2 h-2 bg-cyan-500/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                <div className="w-2 h-2 bg-cyan-500/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                <div className="w-2 h-2 bg-cyan-500/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                            </div>
                                            <span className="text-[11px] text-slate-600 font-normal">Processing query...</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>
                    </div>
                </div>

                {/* Feedback Bar */}
                {lastResponse && (
                    <div className="bg-[#0a0f1c]/90 border-t border-white/[0.04] px-6 py-3 backdrop-blur-sm animate-slide-up">
                        <div className="max-w-3xl mx-auto flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Activity className="w-4 h-4 text-slate-500" />
                                <div>
                                    <p className="text-[12px] font-medium text-white/80">Was this response accurate?</p>
                                    <p className="text-[10px] text-slate-500">Your feedback improves the system</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleFeedback('👍')}
                                    className="px-4 py-2 rounded-lg bg-emerald-500/5 hover:bg-emerald-500/15 text-emerald-400 text-[12px] font-medium transition-all border border-emerald-500/10 active:scale-95"
                                >
                                    👍 Accurate
                                </button>
                                <button
                                    onClick={() => handleFeedback('👎')}
                                    className="px-4 py-2 rounded-lg bg-red-500/5 hover:bg-red-500/15 text-red-400 text-[12px] font-medium transition-all border border-red-500/10 active:scale-95"
                                >
                                    👎 Flag
                                </button>
                                <button
                                    onClick={() => setLastResponse(null)}
                                    className="ml-2 text-slate-600 hover:text-slate-400 text-[10px] transition-colors"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══ Input Area ═══ */}
                <div className="px-6 pb-6 pt-3 bg-[#030712] border-t border-white/[0.03]">
                    <form
                        onSubmit={handleSubmit}
                        className="max-w-3xl mx-auto"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}
                    >
                        <div className="relative flex items-center bg-white/[0.02] rounded-xl border border-white/[0.05] focus-within:border-cyan-500/30 transition-all duration-300 p-1.5 pr-2">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask about citizen safety, laws, or prevention..."
                                className="flex-1 bg-transparent text-white placeholder:text-slate-600 outline-none py-3 px-4 font-normal text-[14px]"
                                disabled={loading}
                            />
                            <button
                                type="submit"
                                disabled={loading || !input.trim()}
                                className="w-10 h-10 rounded-lg bg-cyan-500 text-[#030712] flex items-center justify-center disabled:opacity-15 hover:bg-cyan-400 active:scale-95 transition-all"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="text-center text-[10px] text-slate-700 mt-3 font-normal select-none">
                            Powered by Qwen3 235B · Architected by Ambuj Kumar Tripathi
                        </p>
                    </form>
                </div>
            </main>

            {/* ═══ Security Audit Modal ═══ */}
            {auditModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="w-full max-w-md bg-[#0a0f1c] border border-white/[0.06] rounded-2xl shadow-2xl overflow-hidden animate-scale-in">

                        {/* Header */}
                        <div className="p-5 border-b border-white/[0.04] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/10">
                                    <Shield className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-white tracking-tight">Security Audit</h2>
                                    <p className="text-[10px] text-blue-400/80 font-medium">Microsoft Presidio Analysis</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setAuditModal(null)}
                                className="w-8 h-8 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] text-slate-400 flex items-center justify-center transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto scrollbar-hide">
                            <div className="space-y-2">
                                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-3">Detected Entities</p>
                                {auditModal.map((ent, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                                        <span className="text-[12px] font-medium text-blue-300">{(ent?.type || ent).replace('_', ' ')}</span>
                                        <span className="text-[10px] font-medium bg-blue-500/10 text-blue-300 px-2 py-0.5 rounded">
                                            {ent?.score ? (ent.score * 100).toFixed(0) : '100'}%
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-3">
                                <p className="text-[10px] font-medium text-amber-400/80 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                    <span>⚠️</span> Privacy Note
                                </p>
                                <p className="text-[11px] text-slate-400 leading-relaxed">
                                    Each entity is scored and completely redacted from the LLM prompt in real-time. No personal data reaches the cloud model.
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-white/[0.04]">
                            <button
                                onClick={() => setAuditModal(null)}
                                className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#030712] font-semibold text-sm transition-all active:scale-[0.98]"
                            >
                                Close Report
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
