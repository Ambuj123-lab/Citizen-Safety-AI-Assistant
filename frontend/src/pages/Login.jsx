import { authAPI } from '../api';
import logo from '../assets/logo.png';
import { useState, useEffect, useRef } from 'react';

/* ── Animated Counter ── */
const useCountUp = (target, duration = 2200) => {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const animated = useRef(false);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !animated.current) {
                animated.current = true;
                const start = performance.now();
                const tick = (now) => {
                    const t = Math.min((now - start) / duration, 1);
                    const ease = 1 - Math.pow(1 - t, 3);
                    setCount(Math.floor(ease * target));
                    if (t < 1) requestAnimationFrame(tick);
                };
                requestAnimationFrame(tick);
            }
        }, { threshold: 0.3 });
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [target, duration]);
    return { count, ref };
};

/* ═══════════════════ LOGIN PAGE ═══════════════════ */
const Login = () => {
    const handleGoogleLogin = () => {
        window.location.href = authAPI.getLoginUrl();
    };

    const features = [
        {
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            ),
            title: 'Agentic RAG Engine',
            desc: 'Multi-turn retrieval on LangChain with Pinecone vector search and deterministic source citations across 20+ legal frameworks.'
        },
        {
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
            ),
            title: 'Zero-Trust PII Shield',
            desc: 'Microsoft Presidio masks all personal identifiers before the LLM. 7-layer security with GDPR-compliant 30-day auto-delete.'
        },
        {
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            ),
            title: 'Optimized Runtime',
            desc: '512MB RAM optimized with Redis semantic caching and Jina MRL embeddings, cutting storage overhead by 75%.'
        }
    ];

    const stats = [
        { val: 31500, suf: '+', lbl: 'Chunks Indexed' },
        { val: 28000, suf: '+', lbl: 'Dense Vectors' },
        { val: 75, suf: '%', lbl: 'Storage Saved' },
        { val: 7, suf: ' Layer', lbl: 'Security Shield' },
    ];

    return (
        <div style={{ background: '#07090F', color: '#fff', fontFamily: "'Inter', system-ui, -apple-system, sans-serif", minHeight: '100vh' }}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');`}</style>

            {/* ── NAVBAR ── */}
            <nav style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '20px 40px', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 50
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src={logo} alt="Logo" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.9)', letterSpacing: '-0.01em' }}>Citizen Safety AI</span>
                </div>
                <button onClick={handleGoogleLogin} style={{
                    padding: '8px 18px', fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.7)',
                    background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', cursor: 'pointer',
                    transition: 'all 0.2s'
                }}
                onMouseOver={e => { e.target.style.borderColor = 'rgba(255,255,255,0.25)'; e.target.style.color = '#fff'; }}
                onMouseOut={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.color = 'rgba(255,255,255,0.7)'; }}
                >
                    Sign In →
                </button>
            </nav>

            {/* ── AMBIENT GLOW ── */}
            <div style={{ position: 'fixed', top: '-200px', left: '50%', transform: 'translateX(-50%)', width: '800px', height: '500px', background: 'radial-gradient(ellipse at top, rgba(56, 189, 248, 0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

            {/* ══════════════════ HERO SECTION ══════════════════ */}
            <section style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                textAlign: 'center', padding: '100px 40px 140px', maxWidth: '800px', margin: '0 auto',
                position: 'relative', zIndex: 10, minHeight: '80vh'
            }}>
                <h1 style={{
                    fontSize: 'clamp(42px, 6vw, 72px)', fontWeight: 600, letterSpacing: '-0.03em',
                    lineHeight: 1.1, marginBottom: '24px'
                }}>
                    <span style={{ color: '#fff' }}>Legal Intelligence.</span>
                    <br />
                    <span style={{ color: '#4B5563' }}>Enterprise Scale.</span>
                </h1>

                <p style={{
                    fontSize: '17px', color: '#6B7280', lineHeight: 1.7, maxWidth: '520px', marginBottom: '40px'
                }}>
                    AI-powered retrieval-augmented generation tailored for Indian legal frameworks with real-time PII redaction.
                </p>

                <button onClick={handleGoogleLogin} style={{
                    display: 'flex', alignItems: 'center', gap: '10px', height: '48px', padding: '0 28px',
                    background: '#fff', color: '#000', fontSize: '14px', fontWeight: 600,
                    borderRadius: '10px', border: 'none', cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.3s',
                    boxShadow: '0 0 40px rgba(255,255,255,0.08)'
                }}
                onMouseDown={e => e.target.style.transform = 'scale(0.97)'}
                onMouseUp={e => e.target.style.transform = 'scale(1)'}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Get Started with Google
                </button>
            </section>

            {/* ══════════════════ FEATURES SECTION ══════════════════ */}
            <section style={{ padding: '80px 40px 100px', position: 'relative', zIndex: 10 }}>
                <div style={{ maxWidth: '960px', margin: '0 auto' }}>

                    {/* Section Header */}
                    <div style={{ textAlign: 'center', marginBottom: '56px' }}>
                        <span style={{
                            display: 'inline-block', padding: '6px 16px', fontSize: '11px', fontWeight: 600,
                            textTransform: 'uppercase', letterSpacing: '0.12em', color: '#9CA3AF',
                            border: '1px solid rgba(255,255,255,0.08)', borderRadius: '100px', marginBottom: '20px'
                        }}>
                            Capabilities
                        </span>
                        <h2 style={{ fontSize: '32px', fontWeight: 600, letterSpacing: '-0.02em', color: '#fff' }}>
                            Built for production.
                        </h2>
                    </div>

                    {/* ── CARDS GRID ── */}
                    <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px'
                    }}>
                        {features.map((f, i) => (
                            <div key={i} style={{
                                background: '#0D1117',
                                border: '1px solid #1B1F2A',
                                borderRadius: '20px',
                                padding: '32px 28px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0',
                                transition: 'border-color 0.3s, background 0.3s',
                                cursor: 'default',
                            }}
                            onMouseOver={e => {
                                e.currentTarget.style.borderColor = '#2D3348';
                                e.currentTarget.style.background = '#111827';
                            }}
                            onMouseOut={e => {
                                e.currentTarget.style.borderColor = '#1B1F2A';
                                e.currentTarget.style.background = '#0D1117';
                            }}
                            >
                                {/* Icon Container */}
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '12px',
                                    background: '#161B26', border: '1px solid #252B3B',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#9CA3AF', marginBottom: '20px', flexShrink: 0
                                }}>
                                    {f.icon}
                                </div>

                                {/* Title */}
                                <h3 style={{
                                    fontSize: '16px', fontWeight: 600, color: '#F3F4F6',
                                    marginBottom: '10px', letterSpacing: '-0.01em'
                                }}>{f.title}</h3>

                                {/* Description */}
                                <p style={{
                                    fontSize: '14px', color: '#6B7280', lineHeight: 1.65, margin: 0
                                }}>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════════════ STATS SECTION ══════════════════ */}
            <section style={{ padding: '0 40px 100px', position: 'relative', zIndex: 10 }}>
                <div style={{ maxWidth: '960px', margin: '0 auto', borderTop: '1px solid #1B1F2A', paddingTop: '80px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', textAlign: 'center' }}>
                        {stats.map((s, i) => {
                            const StatItem = () => {
                                const { count, ref } = useCountUp(s.val);
                                return (
                                    <div ref={ref}>
                                        <p style={{ fontSize: '42px', fontWeight: 600, color: '#F3F4F6', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: '10px', fontVariantNumeric: 'tabular-nums' }}>
                                            {count.toLocaleString()}{s.suf}
                                        </p>
                                        <p style={{ fontSize: '13px', color: '#6B7280', fontWeight: 500 }}>{s.lbl}</p>
                                    </div>
                                );
                            };
                            return <StatItem key={i} />;
                        })}
                    </div>
                </div>
            </section>

            {/* ══════════════════ FOOTER ══════════════════ */}
            <footer style={{ padding: '32px 40px', borderTop: '1px solid #1B1F2A', textAlign: 'center' }}>
                <p style={{ fontSize: '12px', color: '#374151', fontWeight: 500 }}>
                    &copy; 2026 Ambuj Kumar Tripathi. All rights reserved.
                </p>
            </footer>
        </div>
    );
};

export default Login;
