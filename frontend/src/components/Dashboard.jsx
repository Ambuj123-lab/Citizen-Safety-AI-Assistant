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
        { icon: '🚨', text: 'Digital arrest kya hai?' },
        { icon: '🏦', text: 'RBI fraud prevention?' },
        { icon: '👩', text: 'Women helpline numbers?' },
        { icon: '💼', text: 'Fake job scams?' },
        { icon: '👶', text: 'POCSO Act explained?' },
        { icon: '📋', text: 'Bank complaint kaise karein?' },
    ];

    // Knowledge Base Documents
    const kbDocs = [
        'Digital Arrest Advisory',
        'POSH Handbook (Women Safety)',
        'POCSO Act (Child Protection)',
        'RBI BeAware (Fraud Prevention)',
        'Banking Ombudsman Scheme',
        'Fake Job SMS Advisory',
        'RBI OS 2021 Amendments',
        'Agent Developer Resume',
    ];

    return (
        <div className="flex h-screen bg-[#0d1117]" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>

            {/* Toast Notifications */}
            <div className="fixed top-4 right-4 z-50 space-y-2">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`px-4 py-2.5 rounded-lg text-[13px] font-medium max-w-xs animate-slide-up
                            ${toast.type === 'success' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' :
                                toast.type === 'error' ? 'bg-red-500/15 text-red-400 border border-red-500/20' :
                                    toast.type === 'warning' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' :
                                        'bg-blue-500/15 text-blue-400 border border-blue-500/20'}`}
                    >
                        {toast.message}
                    </div>
                ))}
            </div>

            {/* ═══ SIDEBAR ═══ */}
            <aside className="w-[220px] bg-[#161b22] flex flex-col h-screen shrink-0 border-r border-[#21262d]">

                {/* Logo */}
                <div className="h-[52px] px-4 flex items-center gap-2.5 border-b border-[#21262d]">
                    <img src={logo} alt="Logo" className="w-6 h-6 object-contain" />
                    <span className="text-[14px] font-semibold text-[#e6edf3]">Citizen Safety AI</span>
                </div>

                {/* User */}
                <div className="px-3 py-3 border-b border-[#21262d]">
                    <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-[#1c2128] transition-colors">
                        {user?.picture ? (
                            <img src={user.picture} className="w-7 h-7 rounded-full object-cover" alt="User" />
                        ) : (
                            <div className="w-7 h-7 rounded-full bg-[#21262d] flex items-center justify-center text-[#e6edf3] text-xs font-semibold">
                                {user?.name?.charAt(0)}
                            </div>
                        )}
                        <span className="text-[13px] text-[#e6edf3] font-medium truncate flex-1">{user?.name}</span>
                    </div>
                </div>

                {/* Nav Items */}
                <div className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5" style={{ scrollbarWidth: 'none' }}>

                    {/* New Session */}
                    <button
                        onClick={handleNewSession}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#1c2128] transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        New Session
                    </button>

                    {/* Upload */}
                    <input ref={fileInputRef} type="file" multiple accept=".pdf" hidden onChange={handleFileUpload} />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#1c2128] transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                        {stagedFiles.length > 0 ? stagedFiles.map(f => f.name).join(', ') : 'Upload PDFs'}
                    </button>

                    {stagedFiles.length > 0 && (
                        <button
                            onClick={handleIndex}
                            disabled={isIndexing}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium text-[#0d1117] bg-[#238636] hover:bg-[#2ea043] transition-colors"
                        >
                            {isIndexing ? 'Indexing...' : '⚡ Index to Brain'}
                        </button>
                    )}

                    {uploadedFiles.length > 0 && (
                        <div className="px-2 pt-1 space-y-1">
                            {uploadedFiles.map((name, i) => (
                                <div key={i} className="flex items-center gap-2 text-[11px] text-emerald-400/70 truncate">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                    {name}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Divider */}
                    <div className="h-px bg-[#21262d] my-2" />

                    {/* Knowledge Base */}
                    <button
                        onClick={() => setTechExpanded(!techExpanded)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#1c2128] transition-colors"
                    >
                        <span className="flex items-center gap-2.5">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                            </svg>
                            Knowledge Base
                        </span>
                        <svg className={`w-3 h-3 transition-transform ${techExpanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                    </button>

                    {techExpanded && (
                        <div className="pl-4 space-y-0.5 pt-0.5">
                            {kbDocs.map((doc, idx) => (
                                <div key={idx} className="flex items-center gap-2 px-2 py-1.5 text-[12px] text-[#8b949e] rounded-md hover:bg-[#1c2128] cursor-default transition-colors">
                                    <svg className="w-3 h-3 text-[#484f58] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                    </svg>
                                    {doc}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Bottom: Logout */}
                <div className="px-3 py-3 border-t border-[#21262d]">
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-[#8b949e] hover:text-[#f85149] hover:bg-[#f851491a] transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                        </svg>
                        Log out
                    </button>
                </div>
            </aside>

            {/* ═══ MAIN CHAT ═══ */}
            <main className="flex-1 flex flex-col bg-[#0d1117] min-w-0">

                {/* Top Bar */}
                <div className="h-[52px] border-b border-[#21262d] px-6 flex items-center justify-between shrink-0">
                    <h2 className="text-[14px] font-semibold text-[#e6edf3]">Citizen Safety AI</h2>
                    <div className="flex items-center gap-4 text-[11px] text-[#484f58]">
                        <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {stats.active} online
                        </span>
                        <span>{stats.visitors} visits</span>
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#21262d transparent' }}>
                    <div className="max-w-[760px] mx-auto px-6 py-6">

                        {/* Welcome */}
                        {messages.length === 0 && !loading && (
                            <div className="py-16 text-center">
                                <div className="w-12 h-12 rounded-xl bg-[#161b22] border border-[#21262d] flex items-center justify-center mx-auto mb-5">
                                    <span className="text-2xl">🛡️</span>
                                </div>
                                <h1 className="text-[22px] font-semibold text-[#e6edf3] mb-2">Citizen Safety & Awareness AI</h1>
                                <p className="text-[14px] text-[#8b949e] mb-10 max-w-md mx-auto">
                                    Ask about digital safety, legal rights, POSH, POCSO, or financial fraud prevention.
                                </p>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-w-lg mx-auto">
                                    {quickActions.map((qa, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setInput(qa.text)}
                                            className="p-3 rounded-xl bg-[#161b22] border border-[#21262d] hover:border-[#30363d] text-left transition-colors"
                                        >
                                            <span className="text-base block mb-1.5">{qa.icon}</span>
                                            <p className="text-[12px] text-[#8b949e] leading-snug">{qa.text}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Messages */}
                        <div className="space-y-5">
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>

                                    {/* Bot Avatar */}
                                    {msg.role === 'assistant' && (
                                        <img src={logo} alt="AI" className="w-7 h-7 rounded-lg object-contain shrink-0 mt-0.5" />
                                    )}

                                    <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                                        {/* Bubble */}
                                        <div className={`px-4 py-3 rounded-xl text-[14px] leading-relaxed ${msg.role === 'user'
                                            ? 'bg-[#1f6feb] text-white rounded-br-sm ml-auto'
                                            : 'bg-[#161b22] text-[#e6edf3] border border-[#21262d] rounded-bl-sm'
                                            }`}>
                                            {msg.role === 'assistant' ? (
                                                <div className="prose prose-sm prose-invert max-w-none
                                                    prose-headings:text-[#e6edf3] prose-headings:font-semibold prose-headings:text-sm
                                                    prose-strong:text-[#e6edf3]
                                                    prose-p:text-[#c9d1d9] prose-p:text-[13px] prose-p:leading-relaxed
                                                    prose-li:text-[#c9d1d9] prose-li:text-[13px]
                                                    prose-a:text-[#58a6ff]
                                                    prose-code:text-[#79c0ff] prose-code:bg-[#0d1117] prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
                                                    prose-blockquote:border-l-[#30363d] prose-blockquote:text-[#8b949e]">
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                                                </div>
                                            ) : (
                                                <p>{msg.content}</p>
                                            )}
                                        </div>

                                        {/* Sources */}
                                        {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-1.5">
                                                {msg.sources.map((src, j) => (
                                                    <span key={j} className="text-[10px] text-[#8b949e] bg-[#161b22] border border-[#21262d] px-2 py-1 rounded-md">
                                                        📄 {src.file || src} · p.{src.page || '?'}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Confidence + PII */}
                                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                            {msg.role === 'assistant' && msg.confidence && (
                                                <span className="text-[10px] text-emerald-400/70">{msg.confidence}% match</span>
                                            )}
                                            {msg.pii_masked && msg.pii_entities?.length > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setAuditModal(msg.pii_entities);
                                                        showToast('Generating security report...', 'info');
                                                    }}
                                                    className="text-[10px] text-[#58a6ff] hover:underline cursor-pointer"
                                                >
                                                    🛡️ Identity Shielded · View Audit
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* User Avatar */}
                                    {msg.role === 'user' && (
                                        <div className="shrink-0 mt-0.5">
                                            {user?.picture?.length > 10 ? (
                                                <img src={user.picture} alt="You" className="w-7 h-7 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-7 h-7 rounded-full bg-[#1f6feb] flex items-center justify-center text-white text-xs font-semibold">
                                                    {user?.name?.charAt(0) || 'U'}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Loading */}
                            {loading && (
                                <div className="flex gap-3">
                                    <img src={logo} alt="AI" className="w-7 h-7 rounded-lg object-contain shrink-0 mt-0.5 opacity-50" />
                                    <div className="bg-[#161b22] border border-[#21262d] px-4 py-3 rounded-xl rounded-bl-sm">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 bg-[#484f58] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <div className="w-1.5 h-1.5 bg-[#484f58] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <div className="w-1.5 h-1.5 bg-[#484f58] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>
                    </div>
                </div>

                {/* Feedback */}
                {lastResponse && (
                    <div className="border-t border-[#21262d] px-6 py-2.5">
                        <div className="max-w-[760px] mx-auto flex items-center justify-between">
                            <span className="text-[12px] text-[#8b949e]">Was this response helpful?</span>
                            <div className="flex items-center gap-2">
                                <button onClick={() => handleFeedback('👍')} className="text-[12px] text-[#8b949e] hover:text-emerald-400 px-2 py-1 rounded hover:bg-emerald-500/10 transition-colors">👍</button>
                                <button onClick={() => handleFeedback('👎')} className="text-[12px] text-[#8b949e] hover:text-red-400 px-2 py-1 rounded hover:bg-red-500/10 transition-colors">👎</button>
                                <button onClick={() => setLastResponse(null)} className="text-[11px] text-[#484f58] hover:text-[#8b949e] ml-2 transition-colors">Dismiss</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Input */}
                <div className="border-t border-[#21262d] px-6 py-4">
                    <form
                        onSubmit={handleSubmit}
                        className="max-w-[760px] mx-auto"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}
                    >
                        <div className="flex items-center gap-2 bg-[#161b22] border border-[#30363d] focus-within:border-[#58a6ff] rounded-xl px-4 py-2 transition-colors">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask me something..."
                                className="flex-1 bg-transparent text-[#e6edf3] placeholder:text-[#484f58] outline-none text-[14px] py-1.5"
                                disabled={loading}
                            />
                            <button
                                type="submit"
                                disabled={loading || !input.trim()}
                                className="w-8 h-8 rounded-lg bg-[#238636] hover:bg-[#2ea043] disabled:opacity-20 flex items-center justify-center transition-colors shrink-0"
                            >
                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                                </svg>
                            </button>
                        </div>
                        <p className="text-center text-[10px] text-[#30363d] mt-2.5 select-none">
                            Responses are AI-generated from indexed documents. Always verify critical information independently. © 2026 Ambuj Kumar Tripathi
                        </p>
                    </form>
                </div>
            </main>

            {/* ═══ Audit Modal ═══ */}
            {auditModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm" onClick={() => setAuditModal(null)}>
                    <div className="w-full max-w-md bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden" onClick={e => e.stopPropagation()}>

                        <div className="px-5 py-4 border-b border-[#21262d] flex items-center justify-between">
                            <div>
                                <h2 className="text-[15px] font-semibold text-[#e6edf3]">🛡️ Security Audit</h2>
                                <p className="text-[11px] text-[#8b949e]">Microsoft Presidio Analysis</p>
                            </div>
                            <button onClick={() => setAuditModal(null)} className="text-[#8b949e] hover:text-[#e6edf3] text-lg transition-colors">✕</button>
                        </div>

                        <div className="px-5 py-4 max-h-[50vh] overflow-y-auto space-y-2">
                            {auditModal.map((ent, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-[#0d1117] border border-[#21262d]">
                                    <span className="text-[13px] text-[#c9d1d9]">{(ent?.type || ent).replace('_', ' ')}</span>
                                    <span className="text-[11px] text-[#58a6ff] bg-[#58a6ff1a] px-2 py-0.5 rounded">
                                        {ent?.score ? (ent.score * 100).toFixed(0) : '100'}%
                                    </span>
                                </div>
                            ))}

                            <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 mt-3">
                                <p className="text-[11px] text-[#8b949e]">
                                    ⚠️ Each entity is redacted from the LLM prompt in real-time. No personal data reaches the cloud model.
                                </p>
                            </div>
                        </div>

                        <div className="px-5 py-3 border-t border-[#21262d]">
                            <button
                                onClick={() => setAuditModal(null)}
                                className="w-full py-2.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-[#e6edf3] text-[13px] font-medium transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
