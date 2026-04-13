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

        topBar: { height: '52px', borderBottom: '1px solid #1B1F2A', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: '#0D1117' },
        topBarTitle: { fontSize: '14px', fontWeight: 600, color: '#F3F4F6' },
        statusBadge: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '100px', fontSize: '11px', fontWeight: 600, background: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)', textDecoration: 'none', cursor: 'pointer', transition: 'background 0.2s' },
        statusDot: { width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' },
        topBarMeta: { display: 'flex', alignItems: 'center', gap: '16px', fontSize: '11px', color: '#4B5563' },

        chatArea: { flex: 1, overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: '#1B1F2A transparent' },
        chatInner: { maxWidth: '760px', margin: '0 auto', padding: '24px' },

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
        msgWrap: { display: 'flex', gap: '12px', marginBottom: '20px' },
        msgAvatar: { width: '28px', height: '28px', borderRadius: '8px', objectFit: 'contain', flexShrink: 0, marginTop: '2px' },
        userMsgAvatar: { width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, marginTop: '2px' },
        userMsgAvatarFallback: { width: '28px', height: '28px', borderRadius: '50%', background: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: 600, flexShrink: 0, marginTop: '2px' },

        botBubble: { padding: '14px 18px', borderRadius: '14px 14px 14px 4px', background: '#111827', border: '1px solid #1B1F2A', maxWidth: '85%', fontSize: '14px', lineHeight: '1.65', color: '#D1D5DB' },
        userBubble: { padding: '12px 18px', borderRadius: '14px 14px 4px 14px', background: '#3B82F6', color: '#fff', maxWidth: '80%', fontSize: '14px', lineHeight: '1.5', marginLeft: 'auto' },

        sourceTag: { display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '6px', fontSize: '10px', color: '#9CA3AF', background: '#111827', border: '1px solid #1B1F2A', marginRight: '4px', marginTop: '8px' },

        // Input
        inputWrap: { borderTop: '1px solid #1B1F2A', padding: '16px 24px', background: '#0D1117' },
        inputInner: { maxWidth: '760px', margin: '0 auto' },
        inputBox: { display: 'flex', alignItems: 'center', gap: '8px', background: '#111827', border: '1px solid #1B1F2A', borderRadius: '14px', padding: '8px 12px 8px 18px', transition: 'border-color 0.2s' },
        inputField: { flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#E5E7EB', fontSize: '14px', padding: '6px 0' },
        sendBtn: { width: '36px', height: '36px', borderRadius: '10px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s' },
        disclaimer: { textAlign: 'center', fontSize: '11.5px', color: '#6B7280', marginTop: '12px', userSelect: 'none', fontWeight: 500 },

        // Feedback
        feedbackBar: { borderTop: '1px solid #1B1F2A', padding: '10px 24px', background: '#0D1117' },
        feedbackInner: { maxWidth: '760px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },

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

                    {/* Upload PDFs */}
                    <input ref={fileInputRef} type="file" multiple accept=".pdf" hidden onChange={handleFileUpload} />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        style={S.navBtn}
                        onMouseOver={e => { e.currentTarget.style.background = '#111827'; e.currentTarget.style.color = '#E5E7EB'; }}
                        onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF'; }}
                    >
                        <svg style={S.navIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                        {stagedFiles.length > 0 ? stagedFiles.map(f => f.name).join(', ') : 'Upload PDF'}
                    </button>

                    {stagedFiles.length > 0 && (
                        <button onClick={handleIndex} disabled={isIndexing} style={S.indexBtn}>
                            {isIndexing ? 'Indexing...' : '⚡ Index to Brain'}
                        </button>
                    )}

                    {uploadedFiles.length > 0 && (
                        <div style={{ padding: '4px 0 0 8px' }}>
                            {uploadedFiles.map((name, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'rgba(16,185,129,0.7)', padding: '2px 0' }}>
                                    <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10B981', flexShrink: 0 }} />
                                    {name}
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
                        <h2 style={S.topBarTitle} className="hidden sm:block">Citizen Safety AI</h2>
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
                        <div>
                            {messages.map((msg, i) => (
                                <div key={i} style={{ ...S.msgWrap, justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>

                                    {msg.role === 'assistant' && (
                                        <img src={logo} alt="AI" style={S.msgAvatar} />
                                    )}

                                    <div style={{ maxWidth: '85%' }}>
                                        <div style={msg.role === 'user' ? S.userBubble : S.botBubble}>
                                            {msg.role === 'assistant' ? (
                                                <div className="prose prose-sm prose-invert max-w-none prose-headings:text-[#E5E7EB] prose-headings:font-semibold prose-headings:text-sm prose-strong:text-[#E5E7EB] prose-p:text-[#D1D5DB] prose-p:text-[13px] prose-p:leading-relaxed prose-li:text-[#D1D5DB] prose-li:text-[13px] prose-a:text-[#3B82F6] prose-code:text-[#93C5FD] prose-code:bg-[#0D1117] prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-blockquote:border-l-[#1B1F2A] prose-blockquote:text-[#6B7280]">
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                                                </div>
                                            ) : (
                                                <p style={{ margin: 0 }}>{msg.content}</p>
                                            )}
                                        </div>

                                        {/* Sources */}
                                        {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                                                {msg.sources.map((src, j) => (
                                                    <span key={j} style={S.sourceTag}>
                                                        📄 {src.file || src} · p.{src.page || '?'}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Confidence + PII */}
                                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                                            {msg.role === 'assistant' && msg.confidence && (
                                                <span style={{ fontSize: '10px', color: 'rgba(16,185,129,0.7)' }}>{msg.confidence}% match</span>
                                            )}
                                            {msg.pii_masked && msg.pii_entities?.length > 0 && (
                                                <button type="button"
                                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setAuditModal(msg.pii_entities); showToast('Generating security report...', 'info'); }}
                                                    style={{ fontSize: '10px', color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                                                >
                                                    🛡️ Identity Shielded · View Audit
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {msg.role === 'user' && (
                                        <div>
                                            {user?.picture?.length > 10 ? (
                                                <img src={user.picture} alt="You" style={S.userMsgAvatar} />
                                            ) : (
                                                <div style={S.userMsgAvatarFallback}>{user?.name?.charAt(0) || 'U'}</div>
                                            )}
                                        </div>
                                    )}
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
                                style={{ ...S.sendBtn, background: loading || !input.trim() ? '#1B1F2A' : '#3B82F6', color: '#fff' }}
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
