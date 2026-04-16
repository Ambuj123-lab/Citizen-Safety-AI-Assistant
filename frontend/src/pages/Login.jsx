import { authAPI } from '../api';
import logo from '../assets/logo.png';
import { useState, useEffect, useRef, useCallback } from 'react';

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

/* ── Typewriter Code Block ── */
function TypewriterCodeBlock() {
  const [displayText, setDisplayText] = useState('');
  const codeText = `from unsloth import FastLanguageModel

model, tokenizer = FastLanguageModel.from_pretrained(
    model_name = "invincibleambuj/llama-3.2-1b-legal-india-qlora",
    load_in_4bit = True,
)

inputs = tokenizer(
    "### Instruction:\\nWhat is IPC Section 302?\\n\\n### Response:\\n",
    return_tensors="pt"
)

outputs = model.generate(**inputs, max_new_tokens=200, repetition_penalty=1.3)
print(tokenizer.decode(outputs[0], skip_special_tokens=True))`;

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setDisplayText(codeText.slice(0, index));
      index++;
      if (index > codeText.length) clearInterval(interval);
    }, 12);
    return () => clearInterval(interval);
  }, [codeText]);

  const highlightCode = (code) => {
    return code
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/(".*?")/g, '<span style="color: #a5d6ff">$1</span>')
      .replace(/\b(from|import|True|return_tensors|max_new_tokens|repetition_penalty|skip_special_tokens)\b/g, '<span style="color: #ff7b72">$1</span>')
      .replace(/\b(FastLanguageModel|model|tokenizer|inputs|outputs)\b/g, '<span style="color: #79c0ff">$1</span>')
      .replace(/\b(print)\b/g, '<span style="color: #d2a8ff">$1</span>');
  };

  return (
    <pre style={{ margin: '0', padding: '24px', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', lineHeight: '1.8', color: '#888', overflowX: 'auto', minHeight: '340px' }} dangerouslySetInnerHTML={{ __html: highlightCode(displayText) }}></pre>
  );
}

/* ═══════════════════ LOGIN PAGE ═══════════════════ */
const Login = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
            desc: 'Multi-turn retrieval on LangChain with Pinecone vector search and deterministic source citations across legal frameworks.'
        },
        {
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
            ),
            title: 'Zero-Trust PII Shield',
            desc: 'Microsoft Presidio masks all personal identifiers before the LLM. 7-layer security with GDPR-compliant auto-delete.'
        },
        {
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            ),
            title: 'Optimized Runtime',
            desc: '512MB RAM optimized with Redis semantic caching and Jina MRL embeddings, cutting storage overhead by 75%.'
        },
        {
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
                    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
                </svg>
            ),
            title: 'Persistent Storage',
            desc: 'MongoDB Atlas securely stores sanitized user sessions, conversation metadata, and interaction history.'
        },
        {
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10"></line>
                    <line x1="12" y1="20" x2="12" y2="4"></line>
                    <line x1="6" y1="20" x2="6" y2="14"></line>
                </svg>
            ),
            title: 'Full Observability',
            desc: 'Langfuse tracing monitors LLM latency, token usage, and RAG retrieval stages with strict zero-user tracking.'
        },
        {
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
            ),
            title: 'Dual-LLM Engine',
            desc: 'Highly resilient pipeline utilizing Google Gemini 3.1 with seamless auto-fallback to Gemma 4 for 99.9% uptime.'
        }
    ];

    const stats = [
        { val: 31500, suf: '+', lbl: 'Chunks Indexed' },
        { val: 28000, suf: '+', lbl: 'Dense Vectors' },
        { val: 75, suf: '%', lbl: 'Storage Saved' },
        { val: 7, suf: ' Layer', lbl: 'Security Shield' },
    ];

    return (
        <div style={{ background: '#07090F', color: '#fff', fontFamily: "'Inter', system-ui, -apple-system, sans-serif", minHeight: '100vh', overflowX: 'hidden', width: '100%', maxWidth: '100vw' }}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');`}</style>

            {/* ── TOP DISCLAIMER BANNER ── */}
            <style>{`
                @keyframes sonar-ping {
                    0% { transform: scale(1); opacity: 0.8; }
                    70% { transform: scale(3.5); opacity: 0; }
                    100% { transform: scale(3.5); opacity: 0; }
                }
                @keyframes shimmer-sweep {
                    0% { background-position: -200% center; }
                    100% { background-position: 200% center; }
                }
                @keyframes ecg-draw {
                    0% { stroke-dashoffset: 60; }
                    100% { stroke-dashoffset: -60; }
                }
                @keyframes red-heartbeat-glow {
                    0%   { box-shadow: 0 0 0px rgba(185, 28, 28, 0); border-color: rgba(255, 255, 255, 0.1); }
                    30%  { box-shadow: 0 0 0px rgba(185, 28, 28, 0); border-color: rgba(255, 255, 255, 0.1); }
                    40%  { box-shadow: 0 0 25px rgba(185, 28, 28, 0.8), inset 0 0 8px rgba(153, 27, 27, 0.4); border-color: rgba(185, 28, 28, 0.9); }
                    45%  { box-shadow: 0 0 8px rgba(185, 28, 28, 0.3); border-color: rgba(185, 28, 28, 0.4); }
                    55%  { box-shadow: 0 0 40px rgba(153, 27, 27, 1), inset 0 0 15px rgba(153, 27, 27, 0.8); border-color: #dc2626; }
                    70%  { box-shadow: 0 0 0px rgba(185, 28, 28, 0); border-color: rgba(255, 255, 255, 0.1); }
                    100% { box-shadow: 0 0 0px rgba(185, 28, 28, 0); border-color: rgba(255, 255, 255, 0.1); }
                }
                .status-badge {
                    display: inline-flex; align-items: center; gap: 6px;
                    margin-left: 12px; padding: 4px 12px;
                    background: #000000;
                    animation: red-heartbeat-glow 4s ease-in-out infinite;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 6px; text-decoration: none; color: #ffffff;
                    font-size: 10px; font-weight: 600; letter-spacing: 0.04em;
                    cursor: pointer; white-space: nowrap;
                    transition: border-color 0.3s;
                }
            `}</style>
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', borderBottom: '1px solid rgba(245, 158, 11, 0.2)', padding: '8px 16px', textAlign: 'center', fontSize: '10px', fontWeight: 500, color: '#FCD34D', letterSpacing: '0.02em', position: 'relative', zIndex: 100, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '4px', lineHeight: '1.5' }}>
                <span style={{ fontSize: '13px' }}>⚠️</span> 
                <span><strong>Disclaimer:</strong> This is an experimental AI platform by Ambuj Kumar Tripathi. It does NOT substitute professional legal counsel.</span>
                <a href="https://stats.uptimerobot.com/4tYmSQnuBE" target="_blank" rel="noreferrer" className="status-badge">
                    <span style={{ position: 'relative', width: '8px', height: '8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ position: 'absolute', width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(185, 28, 28, 0.4)', animation: 'sonar-ping 2s ease-out infinite' }} />
                        <span style={{ position: 'relative', width: '6px', height: '6px', borderRadius: '50%', background: '#b91c1c', boxShadow: '0 0 6px rgba(185, 28, 28, 0.6)' }} />
                    </span>
                    <svg width="28" height="12" viewBox="0 0 28 12" style={{ overflow: 'visible', marginLeft: '-2px' }}>
                        <path
                            d="M0,6 L6,6 L8,2 L10,10 L12,4 L14,8 L16,6 L28,6"
                            fill="none"
                            stroke="#dc2626"
                            strokeWidth="1.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{ strokeDasharray: '30', strokeDashoffset: '0', animation: 'ecg-draw 2s linear infinite' }}
                        />
                    </svg>
                    System Status
                </a>
            </div>

            {/* ── NAVBAR ── */}
            <nav style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 16px', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 9999,
                flexWrap: 'wrap', gap: '12px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src={logo} alt="Logo" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.9)', letterSpacing: '-0.01em' }}>Citizen Safety AI</span>
                </div>
                
                {/* Interactive Navbar Center */}
                <div className="hidden lg:flex items-center gap-7" style={{ fontSize: '13px', fontWeight: 500, color: '#9CA3AF' }}>
                    <button onClick={() => document.getElementById('pipeline')?.scrollIntoView({ behavior: 'smooth' })} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', transition: 'color 0.2s', padding: 0 }} onMouseOver={e => e.target.style.color = '#fff'} onMouseOut={e => e.target.style.color = '#9CA3AF'}>Pipeline Structure</button>
                    
                    <button onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', transition: 'color 0.2s', padding: 0 }} onMouseOver={e => e.target.style.color = '#fff'} onMouseOut={e => e.target.style.color = '#9CA3AF'}>Live Demo</button>
                    
                    <button onClick={() => document.getElementById('opensource')?.scrollIntoView({ behavior: 'smooth' })} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', transition: 'color 0.2s', padding: 0 }} onMouseOver={e => e.target.style.color = '#fff'} onMouseOut={e => e.target.style.color = '#9CA3AF'}>My Fine-Tuned Models</button>
                    
                    <div className="group relative" style={{ cursor: 'pointer', paddingBottom: '10px', marginBottom: '-10px' }}>
                        <span style={{ transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color = '#fff'} onMouseOut={e => e.target.style.color = '#9CA3AF'}>Live Systems <span style={{fontSize:'10px', marginLeft:'2px'}}>▼</span></span>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 hidden group-hover:block" style={{ width: '260px', background: '#0A0D14', border: '1px solid #1B1F2A', borderRadius: '12px', padding: '8px', zIndex: 100, boxShadow: '0 10px 40px rgba(0,0,0,0.8)' }}>
                            <a href="https://agentic-rag-financial-parser.onrender.com/" target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems:'center', gap:'10px', padding: '12px 14px', color: '#D1D5DB', textDecoration: 'none', borderRadius: '8px', transition: 'all 0.2s', marginBottom: '4px' }} onMouseOver={e => { e.currentTarget.style.background = 'rgba(245, 158, 11, 0.05)'; e.currentTarget.style.color = '#F59E0B'; }} onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#D1D5DB'; }}>
                                <span style={{fontSize:'16px'}}>💰</span> Agentic Financial Parser
                            </a>
                            <a href="https://indian-legal-ai-expert.onrender.com/login" target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems:'center', gap:'10px', padding: '12px 14px', color: '#D1D5DB', textDecoration: 'none', borderRadius: '8px', transition: 'all 0.2s' }} onMouseOver={e => { e.currentTarget.style.background = 'rgba(245, 158, 11, 0.05)'; e.currentTarget.style.color = '#F59E0B'; }} onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#D1D5DB'; }}>
                                <span style={{fontSize:'16px'}}>⚖️</span> Indian Legal AI Expert
                            </a>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <a href="https://ambuj-rag-docs.netlify.app/" target="_blank" rel="noreferrer" className="hidden sm:block" style={{
                        fontSize: '13px', fontWeight: 500, color: '#9CA3AF', textDecoration: 'none', transition: 'color 0.2s'
                    }} onMouseOver={e => e.target.style.color = '#fff'} onMouseOut={e => e.target.style.color = '#9CA3AF'}>
                        Documentation
                    </a>
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

                    {/* Mobile Hamburger Button */}
                    <button className="lg:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = '#fff'} onMouseOut={e => e.currentTarget.style.color = '#9CA3AF'}>
                        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            {mobileMenuOpen ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
                        </svg>
                    </button>
                </div>

                {/* ── MOBILE MENU OVERLAY (inside nav, top:100% = always below navbar) ── */}
                {mobileMenuOpen && (
                    <div className="lg:hidden" style={{ position: 'absolute', top: '100%', left: '0', right: '0', margin: '8px 16px 0', background: '#0A0D14', border: '1px solid #1B1F2A', borderRadius: '16px', padding: '24px', zIndex: 9998, boxShadow: '0 20px 40px rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <button onClick={() => { document.getElementById('pipeline')?.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false); }} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '15px', fontWeight: 500, textAlign: 'left', padding: '0' }}>Pipeline Structure</button>
                        <button onClick={() => { document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false); }} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '15px', fontWeight: 500, textAlign: 'left', padding: '0' }}>Live Demo</button>
                        <button onClick={() => { document.getElementById('opensource')?.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false); }} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '15px', fontWeight: 500, textAlign: 'left', padding: '0' }}>My Fine-Tuned Models</button>
                        
                        <div style={{ height: '1px', background: '#1B1F2A' }} />
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Live Systems</span>
                            <a href="https://agentic-rag-financial-parser.onrender.com/" target="_blank" rel="noreferrer" style={{ color: '#D1D5DB', textDecoration: 'none', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '12px' }}><span style={{fontSize:'18px'}}>💰</span> Agentic Financial Parser</a>
                            <a href="https://indian-legal-ai-expert.onrender.com/login" target="_blank" rel="noreferrer" style={{ color: '#D1D5DB', textDecoration: 'none', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '12px' }}><span style={{fontSize:'18px'}}>⚖️</span> Indian Legal AI Expert</a>
                        </div>
                        <button onClick={() => setMobileMenuOpen(false)} style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#ef4444', cursor: 'pointer', fontSize: '14px', fontWeight: 600, padding: '12px', borderRadius: '8px', textAlign: 'center' }}>✕ Close Menu</button>
                    </div>
                )}
            </nav>

            {/* ── SUPER DYNAMIC AMBIENT GLOW (LUXURY WEBFLOW SPOTLIGHT) ── */}
            {/* Large Wide Amber Base */}
            <div style={{ position: 'fixed', top: '-300px', left: '50%', transform: 'translateX(-50%)', width: '120vw', height: '900px', background: 'radial-gradient(ellipse at 50% 10%, rgba(245, 158, 11, 0.25) 0%, rgba(234, 88, 12, 0.15) 40%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }} />
            {/* Deep Crimson Core */}
            <div style={{ position: 'fixed', top: '-150px', left: '50%', transform: 'translateX(-50%)', width: '700px', height: '500px', background: 'radial-gradient(circle at center, rgba(220, 38, 38, 0.45) 0%, rgba(153, 27, 27, 0.25) 40%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0 }} />

            {/* ══════════════════ HERO SECTION ══════════════════ */}
            <section style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                textAlign: 'center', padding: '60px 20px 100px', maxWidth: '800px', margin: '0 auto',
                position: 'relative', zIndex: 10, minHeight: '70vh'
            }}>
                <h1 style={{
                    fontSize: 'clamp(42px, 6vw, 72px)', fontWeight: 600, letterSpacing: '-0.03em',
                    lineHeight: 1.1, marginBottom: '24px'
                }}>
                    <span style={{ color: '#fff' }}>Legal Intelligence.</span>
                    <br />
                    <span style={{ color: '#4B5563' }}>Citizen Empowerment.</span>
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
            <section id="pipeline" style={{ padding: '60px 16px 80px', position: 'relative', zIndex: 10 }}>
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
                            End-to-End Pipeline.
                        </h2>
                    </div>

                    {/* ── CARDS GRID ── */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {features.map((f, i) => {
                            // High-end glowing gradients for the interior orbs
                            const glowColors = [
                                'radial-gradient(circle at top right, rgba(239, 68, 68, 0.6) 0%, transparent 70%)', // Redish
                                'radial-gradient(circle at bottom left, rgba(59, 130, 246, 0.6) 0%, transparent 70%)', // Blueish
                                'radial-gradient(circle at center, rgba(245, 158, 11, 0.5) 0%, transparent 70%)' // Amber
                            ];

                            return (
                            <div key={i} style={{
                                background: 'linear-gradient(180deg, rgba(22, 27, 38, 0.4) 0%, rgba(10, 13, 18, 0.8) 100%)',
                                border: '1px solid rgba(255,255,255,0.06)',
                                borderRadius: '24px',
                                padding: '40px 32px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                textAlign: 'center',
                                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                cursor: 'pointer',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                            onMouseOver={e => {
                                e.currentTarget.style.animation = 'border-pulse-colors 2s infinite alternate';
                                e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                            }}
                            onMouseOut={e => {
                                e.currentTarget.style.animation = 'none';
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                                e.currentTarget.style.boxShadow = 'none';
                                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                            }}
                            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.90)'}
                            onMouseUp={e => e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)'} // reset to hovered state
                            >
                                {/* Top Edge inner highlight line */}
                                <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: '1px', background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 100%)' }} />

                                {/* Glowing Orb Icon Container */}
                                <div style={{
                                    width: '64px', height: '64px', borderRadius: '50%',
                                    background: '#05070A',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#fff', marginBottom: '24px', flexShrink: 0,
                                    position: 'relative',
                                    boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.5)'
                                }}>
                                    {/* Inner Color Glow */}
                                    <div style={{
                                        position: 'absolute', inset: 0, borderRadius: '50%',
                                        background: glowColors[i % 3], opacity: 0.9, mixBlendMode: 'screen',
                                        filter: 'blur(4px)'
                                    }} />
                                    <div style={{ position: 'relative', zIndex: 2 }}>
                                        {/* Inject larger size to standard icon */}
                                        <div style={{ transform: 'scale(1.2)' }}>{f.icon}</div>
                                    </div>
                                </div>

                                {/* Title */}
                                <h3 style={{
                                    fontSize: '20px', fontWeight: 600, color: '#fff',
                                    marginBottom: '12px', letterSpacing: '-0.01em'
                                }}>{f.title}</h3>

                                {/* Description */}
                                <p style={{
                                    fontSize: '14px', color: '#9CA3AF', lineHeight: 1.6, margin: 0
                                }}>{f.desc}</p>
                            </div>
                        )})}
                    </div>
                </div>
            </section>

            {/* ══════════════════ STATS SECTION ══════════════════ */}
            <section style={{ padding: '0 20px 80px', position: 'relative', zIndex: 10 }}>
                <div style={{ maxWidth: '960px', margin: '0 auto', borderTop: '1px solid #1B1F2A', paddingTop: '80px' }}>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                        {stats.map((s, i) => {
                            const StatItem = () => {
                                const { count, ref } = useCountUp(s.val);
                                return (
                                    <div ref={ref}>
                                        <p style={{ fontSize: 'clamp(28px, 6vw, 42px)', fontWeight: 600, color: '#F3F4F6', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: '10px', fontVariantNumeric: 'tabular-nums' }}>
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

            {/* ══════════════════ LIVE DEMO VIDEO SECTION ══════════════════ */}
            <section id="demo" style={{ padding: '80px 16px', position: 'relative', zIndex: 10 }}>
                <div style={{ maxWidth: '960px', margin: '0 auto' }}>

                    {/* Section Header */}
                    <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            padding: '6px 16px', fontSize: '11px', fontWeight: 600,
                            textTransform: 'uppercase', letterSpacing: '0.12em', color: '#F59E0B',
                            border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '100px', marginBottom: '20px',
                            background: 'rgba(245, 158, 11, 0.05)'
                        }}>
                            <span style={{ fontSize: '12px' }}>▶</span> Live Demo
                        </span>
                        <h2 style={{ fontSize: '32px', fontWeight: 600, letterSpacing: '-0.02em', color: '#fff', marginBottom: '12px' }}>
                            See It In Action.
                        </h2>
                        <p style={{ fontSize: '15px', color: '#6B7280', lineHeight: 1.6, maxWidth: '520px', margin: '0 auto' }}>
                            Watch the AI parse legal queries in real-time with streaming responses and source-grounded citations.
                        </p>
                    </div>

                    {/* Video Container — Glassmorphism Frame */}
                    <div style={{
                        position: 'relative',
                        borderRadius: '16px',
                        border: '1px solid rgba(245, 158, 11, 0.15)',
                        background: 'linear-gradient(180deg, rgba(22, 27, 38, 0.5) 0%, rgba(10, 13, 18, 0.9) 100%)',
                        padding: '6px',
                        boxShadow: '0 0 60px rgba(245, 158, 11, 0.06), 0 20px 60px rgba(0,0,0,0.5)',
                        overflow: 'hidden'
                    }}>
                        {/* Top Edge Highlight */}
                        <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: '1px', background: 'radial-gradient(circle, rgba(245, 158, 11, 0.3) 0%, transparent 100%)', zIndex: 2 }} />

                        <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', height: 0, borderRadius: '12px', overflow: 'hidden' }}>
                          <iframe
                              src="https://player.cloudinary.com/embed/?cloud_name=dra6lzzb9&public_id=bot_response_k79sbj"
                              style={{
                                  position: 'absolute', top: 0, left: 0,
                                  width: '100%', height: '100%',
                                  borderRadius: '12px',
                                  display: 'block',
                                  border: 'none'
                              }}
                              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                              allowFullScreen
                              frameBorder="0"
                              title="Citizen Safety AI — Live Bot Response Demo"
                          />
                        </div>
                    </div>

                    {/* Caption */}
                    <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px', color: '#4B5563', letterSpacing: '0.5px' }}>
                        Real-time RAG pipeline response · Streaming · Source verification against PDF
                    </p>

                </div>
            </section>

            {/* ===== OPEN SOURCE MODEL ===== */}
            <section id="opensource" className="opensource-section" style={{ padding: '60px 16px', background: '#0a0a0a', borderTop: '1px solid #1B1F2A', borderBottom: '1px solid #1B1F2A' }}>
                <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                
                <p style={{ color: '#c9a84c', fontSize: '12px', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '12px' }}>qLoRA Fine-Tuned By Ambuj Kumar Tripathi</p>
                <h2 style={{ color: '#ffffff', fontSize: '36px', fontWeight: '700', marginBottom: '8px' }}>Indian Legal LLM</h2>
                <p style={{ color: '#444', fontSize: '13px', marginBottom: '16px', letterSpacing: '1px' }}>Designed & Fine-tuned by <span style={{ color: '#c9a84c' }}>Ambuj Kumar Tripathi</span> · invincibleambuj</p>
                <p style={{ color: '#6B7280', fontSize: '15px', marginBottom: '48px', lineHeight: '1.6', maxWidth: '600px' }}>Fine-tuned Llama 3.2 1B on 14,543 Indian Legal examples — IPC, CrPC & Constitution of India. Free to use, run locally or via Python.</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                    
                    <a href="https://huggingface.co/invincibleambuj/llama-3.2-1b-legal-india-qlora" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                    <div style={{ background: '#111', border: '1px solid #222', borderRadius: '12px', padding: '24px' }} onMouseOver={(e) => e.currentTarget.style.borderColor='#c9a84c'} onMouseOut={(e) => e.currentTarget.style.borderColor='#222'}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                        <span style={{ fontSize: '16px' }}>🤗</span>
                        <span style={{ color: '#c9a84c', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase' }}>Hugging Face</span>
                        </div>
                        <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: '600', margin: '0 0 8px 0' }}>qLoRA Adapter</h3>
                        <p style={{ color: '#6B7280', fontSize: '13px', margin: '0 0 16px 0', lineHeight: '1.5' }}>Use via Python with Unsloth. GPU recommended.</p>
                        <span style={{ color: '#c9a84c', fontSize: '12px' }}>View Model →</span>
                    </div>
                    </a>

                    <a href="https://huggingface.co/invincibleambuj/Ambuj-Tripathi-Indian-Legal-Llama-GGUF" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                    <div style={{ background: '#111', border: '1px solid #222', borderRadius: '12px', padding: '24px' }} onMouseOver={(e) => e.currentTarget.style.borderColor='#c9a84c'} onMouseOut={(e) => e.currentTarget.style.borderColor='#222'}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                        <span style={{ fontSize: '16px' }}>📦</span>
                        <span style={{ color: '#c9a84c', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase' }}>GGUF</span>
                        </div>
                        <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: '600', margin: '0 0 8px 0' }}>Run Locally</h3>
                        <p style={{ color: '#6B7280', fontSize: '13px', margin: '0 0 16px 0', lineHeight: '1.5' }}>Download & run on CPU. No GPU needed. 807 MB.</p>
                        <span style={{ color: '#c9a84c', fontSize: '12px' }}>Download GGUF →</span>
                    </div>
                    </a>

                    <a href="https://lmstudio.ai" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                    <div style={{ background: '#111', border: '1px solid #222', borderRadius: '12px', padding: '24px' }} onMouseOver={(e) => e.currentTarget.style.borderColor='#c9a84c'} onMouseOut={(e) => e.currentTarget.style.borderColor='#222'}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                        <span style={{ fontSize: '16px' }}>🖥️</span>
                        <span style={{ color: '#c9a84c', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase' }}>LM Studio</span>
                        </div>
                        <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: '600', margin: '0 0 8px 0' }}>Desktop App</h3>
                        <p style={{ color: '#6B7280', fontSize: '13px', margin: '0 0 16px 0', lineHeight: '1.5' }}>Search & chat locally. No code required.</p>
                        <span style={{ color: '#c9a84c', fontSize: '12px' }}>Open in LM Studio →</span>
                    </div>
                    </a>

                </div>

                <div style={{ background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ background: '#111', padding: '10px 20px', borderBottom: '1px solid #1e1e1e', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff5f56' }}></div>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ffbd2e' }}></div>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#27c93f' }}></div>
                    <span style={{ color: '#444', fontSize: '11px', marginLeft: '8px', fontFamily: 'monospace' }}>quick_start.py</span>
                    </div>
                    <TypewriterCodeBlock />
                </div>

                <p style={{ color: '#aaa', fontSize: '12px', marginTop: '20px', textAlign: 'center', letterSpacing: '0.5px' }}>Built with Llama 3.2 · Fine-tuned by <strong style={{ color: '#c9a84c' }}>Ambuj Kumar Tripathi</strong> · Llama 3.2 Community License</p>

                {/* ── Training Pipeline Video ── */}
                <div style={{ marginTop: '64px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            padding: '6px 16px', fontSize: '11px', fontWeight: 600,
                            textTransform: 'uppercase', letterSpacing: '0.12em', color: '#c9a84c',
                            border: '1px solid rgba(201, 168, 76, 0.25)', borderRadius: '100px', marginBottom: '20px',
                            background: 'rgba(201, 168, 76, 0.05)'
                        }}>
                            <span style={{ fontSize: '12px' }}>▶</span> Training Process
                        </span>
                        <h3 style={{ fontSize: '28px', fontWeight: 600, letterSpacing: '-0.02em', color: '#fff', marginBottom: '12px' }}>
                            Training Pipeline.
                        </h3>
                        <p style={{ fontSize: '14px', color: '#6B7280', lineHeight: 1.6, maxWidth: '480px', margin: '0 auto' }}>
                            Watch the full qLoRA fine-tuning cycle — from training steps and loss convergence to GGUF quantization export.
                        </p>
                    </div>

                    <div style={{
                        position: 'relative',
                        borderRadius: '16px',
                        border: '1px solid rgba(201, 168, 76, 0.15)',
                        background: 'linear-gradient(180deg, rgba(22, 27, 38, 0.5) 0%, rgba(10, 13, 18, 0.9) 100%)',
                        padding: '6px',
                        boxShadow: '0 0 60px rgba(201, 168, 76, 0.06), 0 20px 60px rgba(0,0,0,0.5)',
                        overflow: 'hidden'
                    }}>
                        {/* Top Edge Highlight */}
                        <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: '1px', background: 'radial-gradient(circle, rgba(201, 168, 76, 0.3) 0%, transparent 100%)', zIndex: 2 }} />

                        <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', height: 0, borderRadius: '12px', overflow: 'hidden' }}>
                          <iframe
                              src="https://player.cloudinary.com/embed/?cloud_name=dra6lzzb9&public_id=qlora_training_nsjd7g"
                              style={{
                                  position: 'absolute', top: 0, left: 0,
                                  width: '100%', height: '100%',
                                  borderRadius: '12px',
                                  display: 'block',
                                  border: 'none'
                              }}
                              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                              allowFullScreen
                              frameBorder="0"
                              title="qLoRA Fine-Tuning — Training Steps & GGUF Export"
                          />
                        </div>
                    </div>

                    <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px', color: '#4B5563', letterSpacing: '0.5px' }}>
                        qLoRA 4-bit training · Loss convergence · GGUF Q4_K_M quantization export
                    </p>
                </div>

                </div>
            </section>

            {/* ══════════════════ ENGINEERED BY SECTION ══════════════════ */}
            <section style={{ padding: '80px 20px', position: 'relative', zIndex: 10, borderTop: '1px solid rgba(220, 38, 38, 0.1)', background: '#07090F', overflow: 'hidden' }}>
                {/* Accent Gradients (Matched to Hero Crimson/Amber) */}
                <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '120vw', height: '100%', background: 'radial-gradient(circle at 20% 0%, rgba(245, 158, 11, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 100%, rgba(220, 38, 38, 0.15) 0%, transparent 60%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
                
                <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 2 }}>
                    
                    {/* Badge */}
                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '6px 16px', borderRadius: '100px', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.15)', marginBottom: '32px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', color: '#F59E0B', textTransform: 'uppercase' }}>Engineered By</span>
                    </div>

                    {/* Name */}
                    <h2 style={{ fontSize: '42px', fontWeight: 700, letterSpacing: '-0.02em', color: '#F3F4F6', marginBottom: '16px' }}>
                        Ambuj Kumar Tripathi
                    </h2>

                    {/* Subtitle */}
                    <p style={{ fontSize: '16px', fontWeight: 500, color: '#F59E0B', marginBottom: '36px', letterSpacing: '-0.01em' }}>
                        AI Engineer <span style={{ color: '#4B5563', margin: '0 8px' }}>•</span> RAG Systems Architect <span style={{ color: '#4B5563', margin: '0 8px' }}>•</span> Production ML
                    </p>

                    {/* Description Paragraphs */}
                    <p style={{ fontSize: '15px', color: '#9CA3AF', lineHeight: 1.7, maxWidth: '720px', margin: '0 auto 20px' }}>
                        B.Tech in Electrical & Electronics Engineering. Specialist in production-grade RAG pipelines, LangGraph orchestration, and serverless vector architectures under hard resource constraints.
                    </p>
                    <p style={{ fontSize: '15px', color: '#6B7280', lineHeight: 1.7, maxWidth: '720px', margin: '0 auto 48px' }}>
                        Built enterprise-grade systems across <span style={{ color: '#D1D5DB', fontWeight: 500 }}>Global Telecom</span> and <span style={{ color: '#D1D5DB', fontWeight: 500 }}>International AdTech</span> — hands-on experience shipping production systems that handle real-world scale.
                    </p>

                    {/* Badges Grid */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px', maxWidth: '640px', margin: '0 auto 48px' }}>
                        {['NVIDIA RAG Agents', 'Google Cloud (6 Badges)', 'IBM AI Engineering', 'Anthropic MCP', 'Linux Foundation', 'BCG X GenAI'].map(badge => (
                            <span key={badge} style={{ padding: '8px 16px', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.15)', borderRadius: '100px', fontSize: '12px', color: '#F3F4F6', fontFamily: 'monospace' }}>
                                {badge}
                            </span>
                        ))}
                    </div>

                    {/* Links Grid */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '16px', marginBottom: '40px' }}>
                        {[
                            { label: 'Portfolio', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>, link: 'https://ambuj-portfolio-v2.netlify.app/' },
                            { label: 'GitHub', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>, link: 'https://github.com/Ambuj123-lab' },
                            { label: 'Engineering Docs', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>, link: 'https://ambuj-rag-docs.netlify.app/' },
                            { label: 'LinkedIn', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>, link: 'https://www.linkedin.com/in/ambuj-tripathi-042b4a118/' }
                        ].map(btn => (
                            <a key={btn.label} href={btn.link} target="_blank" rel="noreferrer" style={{ 
                                display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', 
                                background: 'transparent', border: '1px solid #1B1F2A', borderRadius: '12px', 
                                color: '#F59E0B', fontSize: '14px', fontWeight: 500, textDecoration: 'none',
                                transition: 'all 0.2s', cursor: 'pointer'
                            }}
                            onMouseOver={e => { e.currentTarget.style.borderColor = '#F59E0B'; e.currentTarget.style.background = 'rgba(245, 158, 11, 0.05)'; }}
                            onMouseOut={e => { e.currentTarget.style.borderColor = '#1B1F2A'; e.currentTarget.style.background = 'transparent'; }}
                            >
                                <span style={{ display: 'flex', alignItems: 'center' }}>{btn.icon}</span>
                                {btn.label}
                            </a>
                        ))}
                    </div>

                    {/* Live AI Systems Grid */}
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '32px', maxWidth: '640px', margin: '0 auto' }}>
                        <p style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>Live AI Systems by Ambuj</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '16px' }}>
                            {[
                                { label: 'Agentic Financial Parser', icon: '💰', link: 'https://agentic-rag-financial-parser.onrender.com/' },
                                { label: 'Indian Legal AI Expert', icon: '⚖️', link: 'https://indian-legal-ai-expert.onrender.com/login' }
                            ].map(sys => (
                                <a key={sys.label} href={sys.link} target="_blank" rel="noreferrer" style={{
                                    display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
                                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px',
                                    color: '#D1D5DB', fontSize: '13px', fontWeight: 500, textDecoration: 'none',
                                    transition: 'all 0.2s', cursor: 'pointer'
                                }}
                                onMouseOver={e => { e.currentTarget.style.borderColor = '#4B5563'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                                onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                                >
                                    <span>{sys.icon}</span>
                                    {sys.label}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ══════════════════ FOOTER ══════════════════ */}
            <footer style={{ 
                padding: '40px 40px', 
                background: '#05070A', 
                textAlign: 'center',
                position: 'relative',
                borderTop: '1px solid rgba(255,255,255,0.02)'
            }}>
                {/* Glowing Gradient Top Border */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(220,38,38,0.5), rgba(245,158,11,0.5), transparent)' }} />
                
                <p style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500, letterSpacing: '0.02em' }}>
                    &copy; 2026 Citizen Safety AI — Engineered by <span style={{ color: '#Ef4444', fontWeight: 600 }}>Ambuj Kumar Tripathi</span>.
                    <br />
                    <span style={{ color: '#4B5563', fontSize: '11px', marginTop: '4px', display: 'inline-block' }}>Production RAG, engineered for scale.</span>
                </p>
            </footer>
        </div>
    );
};

export default Login;
