import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { chatAPI, uploadAPI, statsAPI } from '../api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import logo from '../assets/logo.png';
import { Copy, Check } from 'lucide-react';

const Dashboard = () => {
    const { user, logout } = useAuth();

    // Chat State
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [lastResponse, setLastResponse] = useState(null);
    const [copiedIndex, setCopiedIndex] = useState(null);

    const handleCopy = (msg, index) => {
        const userQuery = index > 0 ? messages[index - 1].content : '';
        const aiResponse = msg.content;
        const sources = msg.sources && msg.sources.length > 0 
            ? "\n\nSources / Citations:\n" + msg.sources.map((src, idx) => `[Source ${src.source_id || idx + 1}] File: ${src.file || 'Source'}, Page: ${src.page || '1'}\nPreview: "${src.preview || ''}"`).join('\n\n')
            : '';
            
        const textToCopy = `User Query:\n${userQuery}\n\nAI Response:\n${aiResponse}${sources}`;
        
        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                setCopiedIndex(index);
                showToast('Copied to clipboard with citations!', 'success');
                setTimeout(() => setCopiedIndex(null), 2000);
            })
            .catch(err => {
                console.error('Failed to copy text: ', err);
                showToast('Failed to copy message', 'error');
            });
    };

    // UI State
    const [toasts, setToasts] = useState([]);
    const [stats, setStats] = useState({ visitors: 0, active: 1 });
    const [techExpanded, setTechExpanded] = useState(false);
    const [stagedFiles, setStagedFiles] = useState([]);
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [isIndexing, setIsIndexing] = useState(false);
    const [auditModal, setAuditModal] = useState(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/chat/stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` }),
                },
                body: JSON.stringify({ message: userMessage })
            });

            if (!response.ok) {
                // Check if it's fallback standard response
                const text = await response.text();
                throw new Error('Stream failed');
            }

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: '',
                sources: [],
                confidence: null,
                latency: null,
                pii_masked: false,
                pii_entities: [],
                isStreaming: true
            }]);

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            
            let buffer = '';

            while (true) {
                const { value, done } = await reader.read();
                if (done) {
                    setMessages(prev => {
                        const newMsgs = [...prev];
                        if (newMsgs.length > 0) {
                            newMsgs[newMsgs.length - 1].isStreaming = false;
                        }
                        return newMsgs;
                    });
                    break;
                }
                
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                
                // Keep the last partial line in the buffer
                buffer = lines.pop();
                
                for (const line of lines) {
                    if (line.trim() === '') continue;
                    if (line.startsWith('data: ')) {
                        const dataStr = line.slice(6).trim();
                        if (dataStr === '[DONE]') continue;
                        
                        try {
                            const data = JSON.parse(dataStr);
                            if (data.type === 'error') {
                                setMessages(prev => {
                                    const newMsgs = [...prev];
                                    newMsgs[newMsgs.length - 1].content = `⚠️ ${data.message}`;
                                    return newMsgs;
                                });
                                showToast(data.message, 'warning');
                            } else if (data.type === 'meta') {
                                setMessages(prev => {
                                    const newMsgs = [...prev];
                                    const last = newMsgs[newMsgs.length - 1];
                                    last.sources = data.sources;
                                    last.confidence = data.confidence;
                                    last.pii_masked = data.pii_detected;
                                    last.pii_entities = data.pii_entities;
                                    return newMsgs;
                                });
                                if (data.pii_detected) {
                                    showToast('Identity protected using Microsoft Presidio AI', 'info');
                                }
                            } else if (data.type === 'token') {
                                setMessages(prev => {
                                    const newMsgs = [...prev];
                                    newMsgs[newMsgs.length - 1].content += data.content;
                                    return newMsgs;
                                });
                            }
                        } catch (e) {}
                    }
                }
            }
            // Fetch stats update after response complete
            try {
                const activeData = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/stats/active`).then(res => res.json());
                if (activeData.active_users) setStats(prev => ({ ...prev, active: activeData.active_users }));
            } catch (e) {}

        } catch (e) {
            console.error('Submit Error:', e);
            setMessages(prev => {
                const newMsgs = [...prev];
                if (newMsgs[newMsgs.length-1].role === 'assistant') {
                    newMsgs[newMsgs.length-1].content = "⚠️ System busy. Please try again.";
                } else {
                    newMsgs.push({ role: 'assistant', content: "⚠️ System busy. Please try again." });
                }
                return newMsgs;
            });
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

    /* ═══════════════════════════════════════════════════════════════
       STYLES — Using inline styles for pixel-perfect control
       Color Palette: #07090F (page), #0D1117 (sidebar), #161B26 (cards)
       Accent: #3B82F6 (blue), #10B981 (green status)
    ═══════════════════════════════════════════════════════════════ */

    const S = {
        root: { display: 'flex', height: '100vh', background: '#0D1117', fontFamily: "'Inter', system-ui, sans-serif", color: '#E5E7EB', overflow: 'hidden' },

        // Sidebar
        sidebar: { width: '240px', background: '#0D1117', borderRight: '1px solid #1B1F2A', flexDirection: 'column', flexShrink: 0 },
        sidebarHeader: { padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #1B1F2A' },
        sidebarLogo: { width: '24px', height: '24px', objectFit: 'contain' },
        sidebarTitle: { fontSize: '14px', fontWeight: 600, color: '#F3F4F6', letterSpacing: '-0.01em' },

        userSection: { padding: '12px 16px', borderBottom: '1px solid #1B1F2A' },
        userRow: { display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 8px', borderRadius: '8px' },
        userAvatar: { width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' },
        userAvatarFallback: { width: '32px', height: '32px', borderRadius: '50%', background: '#1B1F2A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: '13px', fontWeight: 600 },
        userName: { fontSize: '13px', color: '#E5E7EB', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 },
        userEmail: { fontSize: '11px', color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },

        navSection: { flex: 1, overflowY: 'auto', padding: '8px 12px', scrollbarWidth: 'none' },
        navBtn: { width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '8px', border: 'none', background: 'transparent', color: '#9CA3AF', fontSize: '13px', cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left' },
        navIcon: { width: '16px', height: '16px', flexShrink: 0 },
        navDivider: { height: '1px', background: '#1B1F2A', margin: '8px 4px' },

        kbItem: { display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', marginLeft: '16px', borderRadius: '6px', fontSize: '12px', color: '#6B7280', cursor: 'default', transition: 'background 0.15s' },
        kbIcon: { width: '12px', height: '12px', color: '#4B5563', flexShrink: 0 },

        indexBtn: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '7px 12px', borderRadius: '8px', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', background: '#10B981', color: '#fff' },

        logoutSection: { padding: '12px 12px', borderTop: '1px solid #1B1F2A' },
        logoutBtn: { width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '8px', border: 'none', background: 'transparent', color: '#6B7280', fontSize: '13px', cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left' },

        // Main
        main: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: '#07090F' },

        topBar: { position: 'sticky', top: 0, zIndex: 50, height: '52px', borderBottom: '1px solid #1B1F2A', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: '#0D1117' },
        topBarTitle: { fontSize: '14px', fontWeight: 600, color: '#F3F4F6' },
        statusBadge: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '100px', fontSize: '11px', fontWeight: 600, background: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)', textDecoration: 'none', cursor: 'pointer', transition: 'background 0.2s' },
        statusDot: { width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' },
        topBarMeta: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#4B5563' },
        builtByBadge: { background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '4px 10px', borderRadius: '4px', color: '#F59E0B', fontFamily: 'monospace', letterSpacing: '0.02em', fontSize: '10px' },

        chatArea: { flex: 1, overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: '#1B1F2A transparent', display: 'flex', flexDirection: 'column' },
        chatInner: { width: '100%', padding: '24px 40px', flex: 1 },

        // Welcome
        welcomeWrap: { padding: '60px 0', textAlign: 'center' },
        welcomeIcon: { width: '48px', height: '48px', borderRadius: '14px', background: '#111827', border: '1px solid #1B1F2A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '24px' },
        welcomeTitle: { fontSize: '22px', fontWeight: 600, color: '#F3F4F6', marginBottom: '8px' },
        welcomeDesc: { fontSize: '14px', color: '#6B7280', maxWidth: '400px', margin: '0 auto 40px' },
        quickGrid: { gap: '8px', maxWidth: '480px', margin: '0 auto' },
        quickBtn: { padding: '14px', borderRadius: '12px', background: '#111827', border: '1px solid #1B1F2A', cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.2s' },
        quickIcon: { fontSize: '16px', display: 'block', marginBottom: '8px' },
        quickText: { fontSize: '12px', color: '#9CA3AF', lineHeight: '1.4' },

        // Messages
        msgWrap: { display: 'flex', gap: '16px', marginBottom: '32px', wFull: '100%' },
        msgAvatar: { width: '30px', height: '30px', borderRadius: '8px', objectFit: 'contain', flexShrink: 0, marginTop: '2px', padding: '2px', border: '1px solid #1B1F2A', background: '#0D1117' },
        userMsgAvatar: { width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, marginTop: '2px' },
        userMsgAvatarFallback: { width: '30px', height: '30px', borderRadius: '50%', background: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontSize: '13px', fontWeight: 600, flexShrink: 0, marginTop: '2px' },

        botBubble: { width: '100%', fontSize: '14.5px', lineHeight: '1.7', color: '#D1D5DB' },
        userBubble: { padding: '14px 20px', borderRadius: '24px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', color: '#fff', fontSize: '14.5px', lineHeight: '1.5', marginLeft: 'auto' },

        sourceDetails: { marginTop: '16px', background: '#0D1117', border: '1px solid #1B1F2A', borderRadius: '8px', overflow: 'hidden' },
        sourceSummary: { padding: '10px 16px', fontSize: '12px', fontWeight: 600, color: '#9CA3AF', cursor: 'pointer', userSelect: 'none', display: 'flex', alignItems: 'center', gap: '8px' },
        sourceContainer: { padding: '12px 16px', borderTop: '1px solid #1B1F2A', background: '#07090F', display: 'flex', flexDirection: 'column', gap: '10px' },
        sourceTag: { padding: '8px 12px', borderRadius: '6px', fontSize: '11px', color: '#D1D5DB', background: '#111827', border: '1px solid #1B1F2A', lineHeight: '1.5' },

        // Input
        inputWrap: { borderTop: '1px solid #1B1F2A', padding: '16px 24px', background: '#0D1117' },
        inputInner: { width: '100%', padding: '0 16px' },
        inputBox: { display: 'flex', alignItems: 'center', gap: '8px', background: '#111827', border: '1px solid #1B1F2A', borderRadius: '14px', padding: '10px 14px 10px 20px', transition: 'border-color 0.2s', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' },
        inputField: { flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#E5E7EB', fontSize: '14px', padding: '6px 0' },
        sendBtn: { width: '36px', height: '36px', borderRadius: '10px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s' },
        disclaimer: { textAlign: 'center', fontSize: '11.5px', color: '#6B7280', marginTop: '12px', userSelect: 'none', fontWeight: 500 },

        // Feedback
        feedbackBar: { borderTop: '1px solid #1B1F2A', padding: '10px 24px', background: '#0D1117' },
        feedbackInner: { width: '100%', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },

        // Audit Modal
        modalOverlay: { position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' },
        modalCard: { width: '100%', maxWidth: '440px', background: '#111827', border: '1px solid #1B1F2A', borderRadius: '16px', overflow: 'hidden' },
        modalHeader: { padding: '16px 20px', borderBottom: '1px solid #1B1F2A', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
        modalBody: { padding: '16px 20px', maxHeight: '50vh', overflowY: 'auto' },
        modalFooter: { padding: '12px 20px', borderTop: '1px solid #1B1F2A' },
    };

    return (
        <div style={S.root}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');`}</style>

            {/* Toast Notifications */}
            <div style={{ position: 'fixed', top: '16px', right: '16px', zIndex: 60, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {toasts.map(toast => (
                    <div key={toast.id} style={{
                        padding: '10px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 500, maxWidth: '320px',
                        background: toast.type === 'success' ? 'rgba(16,185,129,0.12)' : toast.type === 'error' ? 'rgba(239,68,68,0.12)' : toast.type === 'warning' ? 'rgba(245,158,11,0.12)' : 'rgba(59,130,246,0.12)',
                        color: toast.type === 'success' ? '#10B981' : toast.type === 'error' ? '#EF4444' : toast.type === 'warning' ? '#F59E0B' : '#3B82F6',
                        border: `1px solid ${toast.type === 'success' ? 'rgba(16,185,129,0.2)' : toast.type === 'error' ? 'rgba(239,68,68,0.2)' : toast.type === 'warning' ? 'rgba(245,158,11,0.2)' : 'rgba(59,130,246,0.2)'}`,
                    }}>
                        {toast.message}
                    </div>
                ))}
            </div>

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 z-40 md:hidden" 
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* ═══ SIDEBAR ═══ */}
            <aside style={S.sidebar} className={`md:flex ${isMobileMenuOpen ? 'flex absolute z-50 h-full' : 'hidden'}`}>

                {/* Logo */}
                <div style={S.sidebarHeader}>
                    <img src={logo} alt="Logo" style={S.sidebarLogo} />
                    <span style={S.sidebarTitle}>Citizen Safety AI</span>
                </div>

                {/* User */}
                <div style={S.userSection}>
                    <div style={S.userRow}>
                        {user?.picture ? (
                            <img src={user.picture} style={S.userAvatar} alt="User" />
                        ) : (
                            <div style={S.userAvatarFallback}>{user?.name?.charAt(0)}</div>
                        )}
                        <div style={{ overflow: 'hidden', flex: 1 }}>
                            <div style={S.userName}>{user?.name}</div>
                            <div style={S.userEmail}>{user?.email}</div>
                        </div>
                    </div>
                </div>

                {/* Nav Items */}
                <div style={S.navSection}>

                    {/* Knowledge Base (Expandable) */}
                    <button
                        onClick={() => setTechExpanded(!techExpanded)}
                        style={S.navBtn}
                        onMouseOver={e => { e.currentTarget.style.background = '#111827'; e.currentTarget.style.color = '#E5E7EB'; }}
                        onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF'; }}
                    >
                        <svg style={S.navIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                        </svg>
                        <span style={{ flex: 1 }}>Knowledge Base</span>
                        <svg style={{ width: '12px', height: '12px', transition: 'transform 0.2s', transform: techExpanded ? 'rotate(90deg)' : 'rotate(0)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                    </button>

                    {techExpanded && (
                        <div style={{ paddingTop: '4px' }}>
                            {kbDocs.map((doc, idx) => (
                                <div key={idx} style={S.kbItem}
                                    onMouseOver={e => e.currentTarget.style.background = '#111827'}
                                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <svg style={S.kbIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                    </svg>
                                    {doc}
                                </div>
                            ))}
                        </div>
                    )}

                    <div style={S.navDivider} />

                    {/* New Session */}
                    <button onClick={handleNewSession} style={S.navBtn}
                        onMouseOver={e => { e.currentTarget.style.background = '#111827'; e.currentTarget.style.color = '#E5E7EB'; }}
                        onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF'; }}
                    >
                        <svg style={S.navIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        New Session
                    </button>

                    {/* Clear History */}
                    <button onClick={handleNewSession} style={S.navBtn}
                        onMouseOver={e => { e.currentTarget.style.background = '#111827'; e.currentTarget.style.color = '#E5E7EB'; }}
                        onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF'; }}
                    >
                        <svg style={S.navIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                        Clear History
                    </button>
                </div>

                {/* Logout */}
                <div style={S.logoutSection}>
                    <button onClick={logout} style={S.logoutBtn}
                        onMouseOver={e => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                        onMouseOut={e => { e.currentTarget.style.color = '#6B7280'; e.currentTarget.style.background = 'transparent'; }}
                    >
                        <svg style={S.navIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                        </svg>
                        Logout
                    </button>
                </div>
            </aside>

            {/* ═══ MAIN CHAT ═══ */}
            <main style={S.main}>

                {/* Top Bar */}
                <div style={S.topBar}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button className="md:hidden flex items-center justify-center text-[#9CA3AF]" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <h2 style={S.topBarTitle} className="hidden sm:block">Citizen Safety AI {user?.name ? <span style={{color: '#6B7280', fontWeight: 400}}> / {user.name}</span> : ''}</h2>
                        <a 
                            href="https://stats.uptimerobot.com/4tYmSQnuBE" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={S.statusBadge}
                            onMouseOver={e => e.currentTarget.style.background = 'rgba(16,185,129,0.18)'}
                            onMouseOut={e => e.currentTarget.style.background = 'rgba(16,185,129,0.1)'}
                        >
                            <span style={S.statusDot} />
                            System: Active
                        </a>
                    </div>
                    <div style={S.topBarMeta}>
                        <span className="hidden md:block" style={S.builtByBadge}>RAG Engine × Dual LLM · Built by Ambuj</span>
                        <span>{stats.active} online</span>
                        <span>·</span>
                        <span>{stats.visitors} visits</span>
                    </div>
                </div>

                {/* Chat Area */}
                <div style={S.chatArea}>
                    <div style={S.chatInner}>

                        {/* Welcome */}
                        {messages.length === 0 && !loading && (
                            <div style={S.welcomeWrap}>
                                <div style={S.welcomeIcon}>🛡️</div>
                                <h1 style={S.welcomeTitle}>Citizen Safety & Awareness AI</h1>
                                <p style={S.welcomeDesc}>
                                    Ask about digital safety, legal rights, POSH, POCSO, or financial fraud prevention.
                                </p>
                                <div style={S.quickGrid} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                                    {quickActions.map((qa, i) => (
                                        <button key={i} onClick={() => setInput(qa.text)} style={S.quickBtn}
                                            onMouseOver={e => e.currentTarget.style.borderColor = '#2D3348'}
                                            onMouseOut={e => e.currentTarget.style.borderColor = '#1B1F2A'}
                                        >
                                            <span style={S.quickIcon}>{qa.icon}</span>
                                            <p style={S.quickText}>{qa.text}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Messages */}
                        <div style={{ paddingBottom: '40px' }}>
                            {messages.map((msg, i) => (
                                <div key={i} className="group" style={{ ...S.msgWrap, flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', position: 'relative' }}>

                                    {/* Avatar */}
                                    {msg.role === 'assistant' ? (
                                        <img src={logo} alt="AI" style={S.msgAvatar} />
                                    ) : (
                                        user?.picture ? (
                                            <img src={user.picture} alt="You" style={S.userMsgAvatar} />
                                        ) : (
                                            <div style={S.userMsgAvatarFallback}>{user?.name?.charAt(0) || 'U'}</div>
                                        )
                                    )}

                                    <div style={{ flex: 1, maxWidth: msg.role === 'user' ? '80%' : '100%', minWidth: 0, position: 'relative' }}>
                                        {msg.role === 'assistant' && (
                                            <button
                                                onClick={() => handleCopy(msg, i)}
                                                className="absolute top-0 right-0 p-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-700/80 border border-slate-700/50 text-slate-400 hover:text-slate-200 opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer"
                                                title="Copy message with citations"
                                                style={{ zIndex: 10 }}
                                            >
                                                {copiedIndex === i ? (
                                                    <Check size={14} className="text-emerald-400" />
                                                ) : (
                                                    <Copy size={14} />
                                                )}
                                            </button>
                                        )}
                                        <div style={msg.role === 'user' ? S.userBubble : { ...S.botBubble, paddingRight: msg.role === 'assistant' ? '40px' : '0px' }}>
                                            {msg.role === 'assistant' ? (
                                                <div className="prose-chat prose-sm max-w-none w-full break-words">
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                                                </div>
                                            ) : (
                                                <p style={{ margin: 0 }}>{msg.content}</p>
                                            )}
                                        </div>

                                        {/* Sources Accordion Mode */}
                                        {msg.role === 'assistant' && !msg.isStreaming && msg.sources && msg.sources.length > 0 && (
                                            <details style={S.sourceDetails}>
                                                <summary style={S.sourceSummary}>
                                                    📄 {msg.sources.length} SOURCES CITED
                                                    <svg style={{ marginLeft: 'auto', width: '14px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                                </summary>
                                                <div style={S.sourceContainer}>
                                                    {msg.sources.map((src, j) => (
                                                        <div key={j} style={S.sourceTag}>
                                                            <strong style={{ color: '#F59E0B' }}>• {src.file || src.source_id}</strong> (Page {src.page || '1'})
                                                            {src.preview && <div style={{ marginTop: '6px', color: '#9CA3AF', fontSize: '10px' }}>"{src.preview}..."</div>}
                                                        </div>
                                                    ))}
                                                </div>
                                            </details>
                                        )}

                                        {/* Confidence + PII */}
                                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', marginTop: '12px', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                                            {msg.role === 'assistant' && !msg.isStreaming && msg.confidence && (
                                                <span style={{ fontSize: '11px', color: 'rgba(16,185,129,0.9)', fontWeight: 600 }}>✨ {msg.confidence}% Confidence</span>
                                            )}
                                            {msg.pii_masked && msg.pii_entities?.length > 0 && (
                                                <button type="button"
                                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setAuditModal(msg.pii_entities); }}
                                                    style={{ fontSize: '11px', color: '#FCD34D', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                                                >
                                                    🛡️ Identity Shielded
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Loading */}
                            {loading && (
                                <div style={S.msgWrap}>
                                    <img src={logo} alt="AI" style={{ ...S.msgAvatar, opacity: 0.5 }} />
                                    <div style={{ ...S.botBubble, display: 'flex', alignItems: 'center', gap: '6px', padding: '14px 20px' }}>
                                        <div style={{ width: '6px', height: '6px', background: '#4B5563', borderRadius: '50%', animation: 'bounce 1s infinite' }} />
                                        <div style={{ width: '6px', height: '6px', background: '#4B5563', borderRadius: '50%', animation: 'bounce 1s infinite 0.15s' }} />
                                        <div style={{ width: '6px', height: '6px', background: '#4B5563', borderRadius: '50%', animation: 'bounce 1s infinite 0.3s' }} />
                                    </div>
                                    <style>{`@keyframes bounce { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-6px); } }`}</style>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>
                    </div>
                </div>

                {/* Feedback */}
                {lastResponse && (
                    <div style={S.feedbackBar}>
                        <div style={S.feedbackInner}>
                            <span style={{ fontSize: '12px', color: '#6B7280' }}>Was this response helpful?</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button onClick={() => handleFeedback('👍')} style={{ fontSize: '12px', background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', transition: 'all 0.15s' }}
                                    onMouseOver={e => { e.currentTarget.style.color = '#10B981'; e.currentTarget.style.background = 'rgba(16,185,129,0.1)'; }}
                                    onMouseOut={e => { e.currentTarget.style.color = '#6B7280'; e.currentTarget.style.background = 'none'; }}
                                >👍 Helpful</button>
                                <button onClick={() => handleFeedback('👎')} style={{ fontSize: '12px', background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', transition: 'all 0.15s' }}
                                    onMouseOver={e => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                                    onMouseOut={e => { e.currentTarget.style.color = '#6B7280'; e.currentTarget.style.background = 'none'; }}
                                >👎 Not helpful</button>
                                <button onClick={() => setLastResponse(null)} style={{ fontSize: '11px', background: 'none', border: 'none', color: '#374151', cursor: 'pointer', marginLeft: '8px' }}>Dismiss</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Input */}
                <div style={S.inputWrap}>
                    <form onSubmit={handleSubmit} style={S.inputInner}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
                    >
                        <div style={S.inputBox} id="chat-input-box"
                            onFocus={() => document.getElementById('chat-input-box').style.borderColor = '#3B82F6'}
                            onBlur={() => document.getElementById('chat-input-box').style.borderColor = '#1B1F2A'}
                        >
                            <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask about Acts, Rules, Budgets, or compare old vs new laws..."
                                style={S.inputField} disabled={loading}
                            />
                            <button type="submit" disabled={loading || !input.trim()}
                                style={{ ...S.sendBtn, background: loading || !input.trim() ? '#1B1F2A' : '#F59E0B', color: '#fff' }}
                            >
                                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                                </svg>
                            </button>
                        </div>
                        <p style={S.disclaimer}>
                            Responses are AI-generated from indexed documents. Always verify critical information independently. © 2026 Ambuj Kumar Tripathi
                        </p>
                    </form>
                </div>
            </main>

            {/* ═══ Audit Modal ═══ */}
            {auditModal && (
                <div style={S.modalOverlay} onClick={() => setAuditModal(null)}>
                    <div style={S.modalCard} onClick={e => e.stopPropagation()}>
                        <div style={S.modalHeader}>
                            <div>
                                <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#F3F4F6', margin: 0 }}>🛡️ Security Audit</h2>
                                <p style={{ fontSize: '11px', color: '#6B7280', margin: '2px 0 0' }}>Microsoft Presidio Analysis</p>
                            </div>
                            <button onClick={() => setAuditModal(null)} style={{ background: 'none', border: 'none', color: '#6B7280', fontSize: '18px', cursor: 'pointer' }}>✕</button>
                        </div>
                        <div style={S.modalBody}>
                            {auditModal.map((ent, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: '10px', background: '#0D1117', border: '1px solid #1B1F2A', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '13px', color: '#D1D5DB' }}>{(ent?.type || ent).replace('_', ' ')}</span>
                                    <span style={{ fontSize: '11px', color: '#3B82F6', background: 'rgba(59,130,246,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                                        {ent?.score ? (ent.score * 100).toFixed(0) : '100'}%
                                    </span>
                                </div>
                            ))}
                            <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.1)', marginTop: '12px' }}>
                                <p style={{ fontSize: '11px', color: '#6B7280', margin: 0 }}>
                                    ⚠️ Each entity is redacted from the LLM prompt in real-time. No personal data reaches the cloud model.
                                </p>
                            </div>
                        </div>
                        <div style={S.modalFooter}>
                            <button onClick={() => setAuditModal(null)} style={{ width: '100%', padding: '10px', borderRadius: '10px', background: '#1B1F2A', border: 'none', color: '#E5E7EB', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
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
