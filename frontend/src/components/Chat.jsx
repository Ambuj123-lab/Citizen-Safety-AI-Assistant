import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { chatAPI, uploadAPI, statsAPI } from '../api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const Chat = () => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [lastResponse, setLastResponse] = useState(null);
    const [toasts, setToasts] = useState([]);
    const [stats, setStats] = useState({ visitors: 0, questions: 0 });
    const [uploading, setUploading] = useState(false);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    // Toast notification system
    const showToast = (message, type = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Load stats on mount
    useEffect(() => {
        const loadStats = async () => {
            try {
                const data = await statsAPI.getStats();
                setStats(data);
            } catch (e) {
                console.log('Stats unavailable');
            }
        };
        loadStats();
    }, []);

    // Load history on mount
    useEffect(() => {
        const loadHistory = async () => {
            try {
                const data = await chatAPI.getHistory();
                if (data.messages && data.messages.length > 0) {
                    setMessages(data.messages.map(m => ({
                        role: m.role,
                        content: m.content
                    })));
                }
            } catch (e) {
                console.log('No history');
            }
        };
        if (user) loadHistory();
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
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
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: response.response,
                    sources: response.sources,
                    confidence: response.confidence,
                    latency: response.latency,
                    pii_masked: response.pii_masked
                }]);
                setLastResponse({ question: userMessage, response: response.response });

                if (response.pii_masked) {
                    showToast('🔒 Personal info detected & masked for security', 'info');
                }
            }
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: `❌ Error: ${error.message}` }]);
            showToast('Connection error. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleFeedback = async (rating) => {
        if (!lastResponse) return;
        try {
            await chatAPI.submitFeedback(lastResponse.question, lastResponse.response, rating);
            setLastResponse(null);
            showToast(rating === '👍' ? 'Thanks for the feedback! 🎉' : 'We\'ll improve. Thanks!', 'success');
        } catch (e) {
            showToast('Could not save feedback', 'error');
        }
    };

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploading(true);
        showToast(`📤 Uploading ${files.length} file(s)...`, 'info');

        try {
            const result = await uploadAPI.uploadFiles(files);
            showToast(`✅ ${result.message}`, 'success');
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `📄 **Files Added to Knowledge Base:**\n${result.files?.map(f => `• ${f}`).join('\n') || 'Upload successful'}`
            }]);
        } catch (error) {
            showToast('❌ Upload failed. Try again.', 'error');
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: '❌ File upload failed. Please try again.'
            }]);
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const handleNewSession = async () => {
        if (!confirm('Start a new session? This will clear your chat history.')) return;
        try {
            await chatAPI.clearHistory();
            setMessages([]);
            setLastResponse(null);
            showToast('New session started!', 'success');
        } catch (e) {
            showToast('Could not clear history', 'error');
        }
    };

    // Quick action questions based on PDFs
    const quickActions = [
        { icon: '🚨', text: 'What is digital arrest?', color: 'from-red-500 to-orange-500' },
        { icon: '🏦', text: 'RBI fraud prevention tips?', color: 'from-blue-500 to-cyan-500' },
        { icon: '👩', text: 'Women helpline numbers?', color: 'from-pink-500 to-purple-500' },
        { icon: '💼', text: 'Fake job SMS scams?', color: 'from-amber-500 to-yellow-500' },
        { icon: '👶', text: 'POCSO Act explained?', color: 'from-green-500 to-emerald-500' },
        { icon: '📋', text: 'Bank complaint kaise kare?', color: 'from-indigo-500 to-violet-500' },
    ];

    return (
        <div className="flex flex-col h-screen bg-[#0a0a0a]">
            {/* Toast Container */}
            <div className="fixed top-20 right-4 z-50 space-y-2">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`animate-fade-in px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm border max-w-sm
                            ${toast.type === 'success' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' :
                                toast.type === 'error' ? 'bg-red-500/20 border-red-500/50 text-red-300' :
                                    toast.type === 'warning' ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' :
                                        'bg-blue-500/20 border-blue-500/50 text-blue-300'}`}
                    >
                        {toast.message}
                    </div>
                ))}
            </div>

            {/* Stats Bar */}
            <div className="bg-[#111] border-b border-[#222] px-4 py-2 pt-16">
                <div className="max-w-4xl mx-auto flex items-center justify-between text-xs text-slate-400">
                    <div className="flex gap-6">
                        <span>👀 Visitors: <span className="text-amber-400 font-semibold">{stats.visitors || 0}</span></span>
                        <span>💬 Questions: <span className="text-emerald-400 font-semibold">{messages.filter(m => m.role === 'user').length}</span></span>
                    </div>
                    <button
                        onClick={handleNewSession}
                        className="text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1"
                    >
                        <span>🔄</span> New Session
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-6">
                <div className="max-w-4xl mx-auto">
                    {messages.length === 0 && (
                        <div className="text-center py-12 animate-fade-in">
                            {/* Hero Section */}
                            <div className="mb-8">
                                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 mb-6 shadow-lg shadow-amber-500/20">
                                    <span className="text-4xl">🛡️</span>
                                </div>
                                <h1 className="text-3xl font-bold text-white mb-2">
                                    Citizen Safety & Awareness AI
                                </h1>
                                <p className="text-slate-400 mb-1">
                                    by <span className="text-amber-400 font-medium">Ambuj Kumar Tripathi</span>
                                </p>
                            </div>

                            {/* About Section */}
                            <div className="bg-[#111] rounded-2xl border border-[#222] p-6 mb-8 text-left max-w-2xl mx-auto">
                                <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                                    <span className="text-amber-400">📚</span> Knowledge Base Topics
                                </h3>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <span className="text-red-400">🚨</span> Digital Arrest Scams & OTP Fraud
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <span className="text-blue-400">🏦</span> Banking & UPI Fraud (RBI)
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <span className="text-yellow-400">💼</span> Fake Job SMS Scams
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <span className="text-pink-400">👩</span> Women Safety (POSH Act)
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <span className="text-green-400">👶</span> Child Protection (POCSO)
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <span className="text-indigo-400">📋</span> Banking Ombudsman
                                    </div>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-2xl mx-auto">
                                {quickActions.map((qa, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setInput(qa.text)}
                                        className={`group p-4 rounded-xl bg-[#111] border border-[#222] hover:border-[#333] transition-all text-left hover:scale-[1.02]`}
                                    >
                                        <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br ${qa.color} mb-3 text-lg shadow-lg`}>
                                            {qa.icon}
                                        </div>
                                        <p className="text-sm text-slate-300 group-hover:text-white transition-colors">
                                            {qa.text}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Chat Messages */}
                    {messages.map((msg, i) => (
                        <div key={i} className={`mb-6 animate-fade-in ${msg.role === 'user' ? 'flex justify-end' : ''}`}>
                            <div className={`max-w-[85%] ${msg.role === 'user'
                                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-900 rounded-2xl rounded-br-md px-5 py-3'
                                : 'bg-[#111] border border-[#222] rounded-2xl rounded-bl-md px-5 py-4'}`}
                            >
                                <div className={`${msg.role === 'assistant' ? 'text-slate-200 prose prose-invert prose-sm max-w-none' : 'font-medium'}`}>
                                    {msg.role === 'assistant' ? (
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                                    ) : (
                                        msg.content
                                    )}
                                </div>

                                {/* Inline Source Citation Badges (like reference screenshot) */}
                                {msg.sources && msg.sources.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {msg.sources.map((src, j) => (
                                            <span
                                                key={j}
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 text-slate-300 text-xs font-medium border border-slate-700 hover:bg-slate-700 transition-colors cursor-default"
                                            >
                                                📄 {src.file} <span className="text-cyan-400 font-bold">p.{src.page}</span>
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Expandable Sources with Preview (detailed view) */}
                                {msg.sources && msg.sources.length > 0 && (
                                    <details className="mt-4 pt-4 border-t border-[#222] group">
                                        <summary className="text-xs text-slate-500 mb-3 font-medium cursor-pointer hover:text-slate-400 transition-colors list-none flex items-center gap-2">
                                            📚 Sources Used
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">{msg.sources.length}</span>
                                            <svg className="w-3 h-3 text-slate-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </summary>
                                        <div className="space-y-2">
                                            {msg.sources.map((src, j) => (
                                                <div key={j} className="bg-[#0a0a0a] rounded-lg p-3 border border-[#1a1a1a]">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-amber-500/20 text-amber-400 text-xs font-bold">
                                                            {src.source_id}
                                                        </span>
                                                        <span className="text-sm text-slate-300 font-medium">{src.file}</span>
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                                                            Page {src.page}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                                                        {src.preview}...
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </details>
                                )}

                                {/* Metrics */}
                                {msg.confidence && (
                                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#222]">
                                        <span className="text-xs px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400">
                                            🎯 {msg.confidence}% match
                                        </span>
                                        <span className="text-xs px-2 py-1 rounded-md bg-blue-500/10 text-blue-400">
                                            ⏱️ {msg.latency}s
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Loading */}
                    {loading && (
                        <div className="mb-4 animate-fade-in">
                            <div className="inline-flex items-center gap-2 bg-[#111] border border-[#222] rounded-2xl px-5 py-4">
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                                <span className="text-sm text-slate-400">Thinking...</span>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Feedback Bar */}
            {lastResponse && (
                <div className="bg-[#111] border-t border-[#222] px-4 py-3">
                    <div className="max-w-4xl mx-auto flex items-center justify-center gap-4">
                        <span className="text-sm text-slate-400">Was this helpful?</span>
                        <button
                            onClick={() => handleFeedback('👍')}
                            className="px-4 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors flex items-center gap-2"
                        >
                            👍 Yes
                        </button>
                        <button
                            onClick={() => handleFeedback('👎')}
                            className="px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors flex items-center gap-2"
                        >
                            👎 No
                        </button>
                    </div>
                </div>
            )}

            {/* Input Area */}
            <div className="bg-[#0a0a0a] border-t border-[#222] px-4 py-4">
                <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-3 bg-[#111] rounded-2xl border border-[#222] focus-within:border-amber-500/50 transition-colors px-4 py-2">
                        {/* Upload Button */}
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className={`p-2 rounded-lg transition-colors ${uploading ? 'text-slate-600' : 'text-slate-400 hover:text-amber-400 hover:bg-[#1a1a1a]'}`}
                            title="Upload PDF"
                        >
                            {uploading ? (
                                <span className="animate-spin">⏳</span>
                            ) : (
                                <span>📎</span>
                            )}
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept=".pdf"
                            onChange={handleFileUpload}
                            className="hidden"
                        />

                        {/* Text Input */}
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about citizen safety..."
                            className="flex-1 bg-transparent text-slate-200 placeholder:text-slate-500 outline-none py-2"
                            disabled={loading}
                        />

                        {/* Send Button */}
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-900 font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-amber-500/20 transition-all"
                        >
                            Send
                        </button>
                    </div>
                    <p className="text-center text-xs text-slate-600 mt-2">
                        AI may produce inaccurate information. Verify critical details.
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Chat;
