import { authAPI } from '../api';
import logo from '../assets/logo.png';
import { useState, useEffect, useRef, useCallback } from 'react';
import { FaLinkedin, FaXTwitter, FaMedium, FaGithub } from 'react-icons/fa6';

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

/* ── Fade-In on Scroll ── */
const useFadeIn = (delay = 0) => {
    const [visible, setVisible] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
        }, { threshold: 0.15 });
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);
    return {
        ref,
        style: {
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(30px)',
            transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s`,
        }
    };
};

/* ── Fade-In Wrapper Component ── */
const FadeIn = ({ delay = 0, children, style = {} }) => {
    const fade = useFadeIn(delay);
    return <div ref={fade.ref} style={{ ...fade.style, ...style }}>{children}</div>;
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
    const [showBackToTop, setShowBackToTop] = useState(false);
    const [uptimeData, setUptimeData] = useState(null);
    const [legalModal, setLegalModal] = useState(null);
    const UPTIME_API_URL = '/api/uptime';

    useEffect(() => {
        const fetchUptime = async () => {
            try {
                const response = await fetch(UPTIME_API_URL);
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.uptime) {
                        setUptimeData(data);
                        return;
                    }
                }
                setUptimeData({ uptime: '--', latency: '--' }); // Fallback
            } catch (error) {
                console.error("Failed to fetch uptime:", error);
                setUptimeData({ uptime: '--', latency: '--' }); // Fallback
            }
        };
        fetchUptime();
        
        const handleScroll = () => setShowBackToTop(window.scrollY > 600);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

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

    const techStack = [
        { name: "LangChain", icon: "🦜" },
        { name: "Pinecone", icon: "🌲" },
        { name: "Presidio", icon: "🛡️" },
        { name: "Redis", icon: "⚡" },
        { name: "FastAPI", icon: "🚀" },
        { name: "React", icon: "⚛️" },
        { name: "Vercel", icon: "▲" },
        { name: "Gemini 1.5", icon: "✨" },
        { name: "Python", icon: "🐍" },
        { name: "TailwindCSS", icon: "🎨" }
    ];
    const marqueeItems = [...techStack, ...techStack, ...techStack];

    const stats = [
        { val: 31500, suf: '+', lbl: 'Knowledge Chunks' },
        { val: 3, suf: '', lbl: 'Live Systems' },
        { val: 5600, suf: '+', lbl: 'Downloads' },
        { val: 14000, suf: '+', lbl: 'Legal Responses' },
    ];

    return (
        <div style={{ background: '#030303', color: '#fff', fontFamily: "'Inter', system-ui, -apple-system, sans-serif", minHeight: '100vh', overflowX: 'hidden', width: '100%', maxWidth: '100vw' }}>
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
            <style>{`
                .blueprint-btn {
                    display: inline-flex; align-items: center; gap: 8px;
                    padding: 12px 26px;
                    background: #000000;
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 10px;
                    color: #ffffff;
                    font-size: 14px; font-weight: 600;
                    letter-spacing: 0.5px;
                    text-decoration: none;
                    cursor: pointer;
                    transition: transform 0.2s, background 0.3s, box-shadow 0.3s;
                }
                .blueprint-btn:hover {
                    transform: translateY(-2px);
                    background: #0a0a0a;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.5) !important;
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
                    {uptimeData ? `${uptimeData.uptime} • ${uptimeData.latency}` : 'System Status'}
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



            {/* ══════════════════ HERO SECTION ══════════════════ */}
            <section style={{
                position: 'relative', zIndex: 10, minHeight: '70vh', width: '100%',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                textAlign: 'center', padding: '120px 20px 100px'
            }}>
                {/* Vercel Style Faint Vector Grid */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.6, pointerEvents: 'none', zIndex: -1 }} />

                {/* Top Left: Designed & Engineered By */}
                <div className="hidden md:block" style={{ position: 'absolute', top: '40px', left: '40px', textAlign: 'left', pointerEvents: 'none' }}>
                    <p style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Designed & Engineered By</p>
                    <p style={{ fontSize: '15px', color: '#E5E7EB', fontWeight: 700, marginBottom: '2px', letterSpacing: '-0.02em' }}>Ambuj Kumar Tripathi</p>
                    <p style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>Independent AI Engineer</p>
                </div>

                {/* Top Right: Version Badge */}
                <div className="hidden md:flex" style={{ position: 'absolute', top: '40px', right: '40px', alignItems: 'center', gap: '10px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '100px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.05em' }}>v1.8</span>
                        <span style={{ fontSize: '10px', color: '#6B7280' }}>Updated July 2026</span>
                    </div>
                </div>

                <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative' }}>
                    <h1 style={{
                        fontSize: 'clamp(36px, 5vw, 60px)', fontWeight: 600, letterSpacing: '-0.03em',
                        lineHeight: 1.1, marginBottom: '24px'
                    }}>
                        <span style={{ color: '#fff' }}>Secure Linear RAG</span>
                        <br />
                        <span style={{ color: '#4B5563' }}>with</span> <span style={{ color: '#c084fc' }}>Real-Time PII Protection.</span>
                    </h1>

                <p style={{
                    fontSize: '17px', color: '#6B7280', lineHeight: 1.7, maxWidth: '520px', margin: '0 auto 40px'
                }}>
                    AI-powered <span style={{ color: '#F3F4F6', fontWeight: 500 }}>retrieval-augmented generation</span> tailored for <span style={{ color: '#F3F4F6', fontWeight: 500 }}>Indian legal frameworks</span> with <span style={{ color: '#c084fc', fontWeight: 500 }}>real-time PII redaction</span>.
                </p>

                {/* Hero Stats */}
                <div style={{ width: '100%', maxWidth: '700px', margin: '0 auto 40px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '30px' }}>
                    {stats.map((s, i) => {
                        const StatItem = () => {
                            const { count, ref } = useCountUp(s.val);
                            return (
                                <div ref={ref} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '120px' }}>
                                    <p style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: '6px', fontVariantNumeric: 'tabular-nums' }}>
                                        {count.toLocaleString()}{s.suf}
                                    </p>
                                    <p style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.lbl}</p>
                                </div>
                            );
                        };
                        return <StatItem key={i} />;
                    })}
                </div>

                {/* Trust Badge Row */}
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '12px', marginBottom: '40px', color: '#9CA3AF', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    <span style={{ color: '#6B7280', marginRight: '4px' }}>Built with</span>
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#374151' }}></span>
                    <span>LangChain</span>
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#374151' }}></span>
                    <span>Pinecone</span>
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#374151' }}></span>
                    <span>Presidio</span>
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#374151' }}></span>
                    <span>Redis</span>
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#374151' }}></span>
                    <span>FastAPI</span>
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#374151' }}></span>
                    <span>React</span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '16px' }}>
                    <button onClick={handleGoogleLogin} style={{
                        display: 'flex', alignItems: 'center', gap: '10px', height: '48px', padding: '0 28px',
                        background: '#fff', color: '#000', fontSize: '14px', fontWeight: 600,
                        borderRadius: '10px', border: 'none', cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.3s'
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

                    <a href="/architecture.html" target="_blank" rel="noreferrer" className="blueprint-btn">
                        <span style={{ fontSize: '16px' }}>🏗️</span>
                        System Blueprint
                    </a>

                    <a href="https://ambuj-ai-portfolio.vercel.app/" target="_blank" rel="noreferrer" style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        padding: '0 26px', height: '48px', boxSizing: 'border-box',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '10px',
                        color: '#ffffff',
                        fontSize: '14px', fontWeight: 600,
                        letterSpacing: '0.5px',
                        textDecoration: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.3s'
                    }}
                    onMouseOver={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.boxShadow = '0 0 15px rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                    onMouseOut={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' }}
                    >
                        <span style={{ fontSize: '16px' }}>👨‍💻</span>
                        View Portfolio
                    </a>
                </div>
                </div>

                {/* Tech Stack Marquee */}
                <div className="marquee-container" style={{ width: '100%', overflow: 'hidden', marginTop: '60px', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.3)', padding: '16px 0', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100px', height: '100%', background: 'linear-gradient(to right, #030303, transparent)', zIndex: 2 }} />
                    <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100%', background: 'linear-gradient(to left, #030303, transparent)', zIndex: 2 }} />
                    <div className="marquee-content" role="marquee" aria-live="off">
                        {marqueeItems.map((tech, idx) => (
                            <div key={idx} aria-hidden={idx >= techStack.length ? "true" : "false"} style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.6, transition: 'opacity 0.3s' }} onMouseOver={e=>e.currentTarget.style.opacity=1} onMouseOut={e=>e.currentTarget.style.opacity=0.6}>
                                <span style={{ fontSize: '18px' }}>{tech.icon}</span>
                                <span style={{ color: '#9CA3AF', fontSize: '14px', fontWeight: 500, letterSpacing: '0.05em' }}>{tech.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════════════ EVOLUTION JOURNEY SECTION ══════════════════ */}
            <section style={{ padding: '100px 20px', position: 'relative', zIndex: 10, background: '#030303' }}>
                <div style={{ maxWidth: '700px', margin: '0 auto' }}>
                    
                    <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '6px 16px', borderRadius: '100px', background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.2)', marginBottom: '20px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', color: '#a78bfa', textTransform: 'uppercase' }}>The Evolution</span>
                        </div>
                        <h2 style={{ fontSize: 'clamp(32px, 5vw, 46px)', fontWeight: 700, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '20px' }}>
                            Engineering Evolution: <br/>From Linear RAG to <span style={{ color: '#c084fc' }}>Autonomous AI.</span>
                        </h2>
                        <p style={{ color: '#9CA3AF', fontSize: '16px', maxWidth: '500px', margin: '0 auto' }}>
                            A complete architectural journey showing how this ecosystem evolved step-by-step into a fully autonomous multi-agent system.
                        </p>
                    </div>

                    <div style={{ position: 'relative', paddingLeft: '32px' }}>
                        {/* Glowing Line */}
                        <div style={{ position: 'absolute', left: '7px', top: '10px', bottom: '10px', width: '2px', background: 'linear-gradient(to bottom, #3b82f6 0%, #8b5cf6 30%, #d946ef 70%, #f43f5e 100%)', opacity: 0.6 }}></div>

                         {[
                            { step: "Linear RAG", desc: <span>Built the <span style={{ color: '#fff', fontWeight: 500 }}>foundational retrieval pipeline</span> enabling accurate <span style={{ color: '#fff', fontWeight: 500 }}>similarity-based document search</span>.</span>, color: "#3b82f6" },
                            { step: "Security", desc: <span>Secured the entire ecosystem with <span style={{ color: '#fff', fontWeight: 500 }}>robust access controls</span>, preventing <span style={{ color: '#fff', fontWeight: 500 }}>unauthorized API abuse</span>.</span>, color: "#3b82f6" },
                            { step: "PII Anonymization", desc: <span>Ensured <span style={{ color: '#fff', fontWeight: 500 }}>enterprise-grade privacy</span> by <span style={{ color: '#fff', fontWeight: 500 }}>automatically redacting</span> sensitive user data in <span style={{ color: '#34d399', fontWeight: 500 }}>real-time</span>.</span>, color: "#6366f1" },
                            { step: "Semantic Caching", desc: <span>Reduced repeated-query latency and <span style={{ color: '#34d399', fontWeight: 500 }}>slashed LLM costs</span> by leveraging <span style={{ color: '#fff', fontWeight: 500 }}>intelligent Redis caching</span>.</span>, color: "#6366f1" },
                            { step: "Observability", desc: <span>Enabled <span style={{ color: '#fff', fontWeight: 500 }}>end-to-end observability</span> across latency, token usage, retrieval quality, and <span style={{ color: '#fff', fontWeight: 500 }}>reasoning traces</span>.</span>, color: "#8b5cf6" },
                            { step: "Fine-Tuning", desc: <span><span style={{ color: '#fff', fontWeight: 500 }}>Boosted model accuracy</span> on domain-specific tasks through efficient custom <span style={{ color: '#fff', fontWeight: 500 }}>qLoRA 4-bit training</span>.</span>, color: "#8b5cf6" },
                            { step: "Legal Specialization", desc: <span>Engineered highly accurate, <span style={{ color: '#fff', fontWeight: 500 }}>citation-backed responses</span> specifically structured for complex <span style={{ color: '#fff', fontWeight: 500 }}>Indian Law</span>.</span>, color: "#a855f7" },
                            { step: "Stateful Graphs", desc: <span>Unlocked <span style={{ color: '#fff', fontWeight: 500 }}>complex multi-step reasoning</span> by migrating from rigid linear chains to <span style={{ color: '#fff', fontWeight: 500 }}>dynamic stateful graphs</span>.</span>, color: "#a855f7" },
                            { step: "Agentic RAG", desc: <span>Enabled <span style={{ color: '#fff', fontWeight: 500 }}>self-correcting AI</span> that <span style={{ color: '#fff', fontWeight: 500 }}>autonomously routes, grades, and refines</span> its own generated answers.</span>, color: "#d946ef" },
                            { step: "Financial Parsing", desc: <span>Engineered <span style={{ color: '#fff', fontWeight: 500 }}>specialized parsing pipelines</span> to reliably extract and interpret <span style={{ color: '#fff', fontWeight: 500 }}>structured data</span> from complex financial reports.</span>, color: "#d946ef" },
                            { step: "Edge Integration", desc: <span>Expanded user accessibility by <span style={{ color: '#fff', fontWeight: 500 }}>deploying the AI brain</span> directly to <span style={{ color: '#fff', fontWeight: 500 }}>real-time conversational platforms</span> like WhatsApp.</span>, color: "#ec4899" },
                            { step: "Adaptive ReAct", desc: <span>Achieved <span style={{ color: '#fff', fontWeight: 500 }}>true autonomy</span> with an orchestrator capable of <span style={{ color: '#fff', fontWeight: 500 }}>dynamic tool-use</span> and <span style={{ color: '#fff', fontWeight: 500 }}>continuous logical reasoning</span>.</span>, color: "#f43f5e" }
                        ].map((item, i) => (
                            <div key={i} style={{ position: 'relative', marginBottom: '32px' }}>
                                {/* Glowing Dot */}
                                <div style={{ position: 'absolute', left: '-32px', top: '4px', width: '16px', height: '16px', borderRadius: '50%', background: '#030303', border: `2px solid ${item.color}`, boxShadow: `0 0 10px ${item.color}` }}></div>
                                
                                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '20px 24px', borderRadius: '12px', transition: 'all 0.3s ease' }}
                                     onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = item.color + '40'; }}
                                     onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; }}>
                                    <h4 style={{ color: '#fff', fontSize: '18px', fontWeight: 600, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ color: item.color }}>{i + 1}.</span> {item.step}
                                    </h4>
                                    <p style={{ color: '#9CA3AF', fontSize: '14px', lineHeight: 1.6 }}>{item.desc}</p>
                                </div>
                            </div>
                        ))}

                        {/* END CARD */}
                        <div style={{ position: 'relative', marginTop: '48px', marginBottom: '20px' }}>
                            {/* Glowing Star Dot */}
                            <div style={{ position: 'absolute', left: '-34px', top: '35px', width: '20px', height: '20px', borderRadius: '50%', background: '#030303', border: `3px solid #10b981`, boxShadow: `0 0 20px #10b981` }}></div>
                            
                            <div style={{ background: 'linear-gradient(145deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.02) 100%)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '30px', borderRadius: '16px', width: '100%', transition: 'all 0.3s ease', boxShadow: '0 10px 40px rgba(16, 185, 129, 0.1)' }}>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px' }}>Current Architecture</div>
                                <h3 style={{ fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: 700, color: '#fff', marginBottom: '20px', letterSpacing: '-0.02em' }}>Production-Ready Multi-Agent AI</h3>
                                
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#D1D5DB', fontSize: '15px', lineHeight: 2, fontWeight: 500 }}>
                                    {['Autonomous routing', 'Tool orchestration', 'Memory & Statefulness', 'Human-in-the-loop', 'Security', 'Data Privacy', 'Enterprise deployment'].map((feat, idx) => (
                                        <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                            {feat}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
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
                            <FadeIn key={i} delay={i * 0.1}>
                            <div style={{
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
                            </FadeIn>
                        )})}
                    </div>
                </div>
            </section>



            {/* ══════════════════ TECH STACK MARQUEE (MERCOR STYLE) ══════════════════ */}
            <style>{`
                @keyframes marquee-scroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .marquee-wrapper {
                    position: relative;
                    background: #0a0a0a;
                    border-top: 1px solid rgba(255,255,255,0.04);
                    border-bottom: 1px solid rgba(255,255,255,0.04);
                    overflow: hidden;
                }
                .marquee-container {
                    display: flex;
                    align-items: center;
                    padding: 18px 0;
                    position: relative;
                }
                .marquee-label-box {
                    position: absolute;
                    left: 0;
                    top: 0;
                    bottom: 0;
                    display: flex;
                    align-items: center;
                    padding: 0 40px;
                    background: linear-gradient(90deg, #0a0a0a 80%, transparent 100%);
                    z-index: 10;
                }
                .marquee-label-text {
                    font-size: 11px;
                    color: #4B5563;
                    text-transform: uppercase;
                    letter-spacing: 0.25em;
                    font-weight: 700;
                }
                .marquee-track {
                    display: flex;
                    width: max-content;
                    animation: marquee-scroll 45s linear infinite;
                    padding-left: 200px;
                }
                .marquee-track:hover { animation-play-state: paused; }
                .marquee-item {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    margin: 0 24px;
                    font-size: 14px;
                    font-weight: 600;
                    white-space: nowrap;
                    transition: opacity 0.2s;
                    cursor: default;
                }
                .marquee-item:hover { opacity: 0.7; }
                .marquee-icon { display: flex; align-items: center; font-size: 16px; }
                .marquee-icon img { height: 16px; width: auto; object-fit: contain; }
                
                /* Right fade out gradient */
                .marquee-gradient-right {
                    position: absolute;
                    right: 0;
                    top: 0;
                    bottom: 0;
                    width: 60px;
                    background: linear-gradient(-90deg, #0a0a0a 0%, transparent 100%);
                    z-index: 10;
                    pointer-events: none;
                }
            `}</style>
            <section className="marquee-wrapper" style={{ zIndex: 10 }}>
                <div className="marquee-container">
                    <div className="marquee-label-box">
                        <span className="marquee-label-text">Tech Stack</span>
                    </div>
                    <div className="marquee-gradient-right"></div>
                    
                    <div className="marquee-track">
                        {[...Array(2)].map((_, setIdx) => (
                            [
                                { name: 'FastAPI', emoji: '⚡', color: '#009688' },
                                { name: 'LangChain', emoji: '🔗', color: '#1E88E5' },
                                { name: 'Pinecone', emoji: '🌲', color: '#D1D5DB' },
                                { name: 'Redis', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/redis/redis-original.svg', color: '#FF4438' },
                                { name: 'MongoDB', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/mongodb/mongodb-original.svg', color: '#47A248' },
                                { name: 'Presidio', emoji: '🛡️', color: '#0078D4' },
                                { name: 'Langfuse', emoji: '📈', color: '#F59E0B' },
                                { name: 'Jina AI', emoji: '🧬', color: '#009193' },
                                { name: 'React', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg', color: '#61DAFB' },
                                { name: 'Vite', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vitejs/vitejs-original.svg', color: '#646CFF' },
                                { name: 'Docker', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/docker/docker-original.svg', color: '#2496ED' },
                                { name: 'Python', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg', color: '#3776AB' },
                                { name: 'Google Cloud', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/google/google-original.svg', color: '#4285F4' },
                                { name: 'Meta Llama', emoji: '🦙', color: '#0668E1' },
                            ].map((tech, i) => (
                                <span className="marquee-item" key={`${setIdx}-${i}`} style={{ color: tech.color }}>
                                    <span className="marquee-icon">
                                        {tech.icon ? <img src={tech.icon} alt={tech.name} /> : tech.emoji}
                                    </span>
                                    {tech.name}
                                </span>
                            ))
                        ))}
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

                <div style={{ marginTop: '60px', borderTop: '1px solid #1e1e1e', paddingTop: '40px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
                    <span style={{ fontSize: '20px' }}>🐦</span>
                    <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', letterSpacing: '1px' }}>Recognized by Hugging Face</h3>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <blockquote className="twitter-tweet" data-theme="dark">
                      <p lang="en" dir="ltr">Meet Ambuj-Tripathi-Indian-Legal-Llama-GGUF: a specialized AI model fine-tuned for Indian law. This isn&#39;t just another chatbot. It&#39;s a legal assistant trained to understand the nuances of Indian statutes, case law, and legal language. A game-changer for legal tech in India. <a href="https://t.co/SkLzeaDgpE">pic.twitter.com/SkLzeaDgpE</a></p>&mdash; Hugging Models (@HuggingModels) <a href="https://x.com/HuggingModels/status/2044027666324697451?ref_src=twsrc%5Etfw">April 14, 2026</a>
                    </blockquote>
                  </div>
                </div>

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
            <section style={{ padding: '80px 20px', position: 'relative', zIndex: 10, borderTop: '1px solid rgba(255, 255, 255, 0.05)', background: '#050505', overflow: 'hidden' }}>
                {/* Accent Gradients */}
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '100vw', height: '100%', background: 'radial-gradient(circle at 30% 50%, rgba(139, 92, 246, 0.1) 0%, transparent 50%), radial-gradient(circle at 70% 50%, rgba(6, 182, 212, 0.1) 0%, transparent 50%)', filter: 'blur(60px)', pointerEvents: 'none', zIndex: 1 }} />
                
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
                            { label: 'Portfolio', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>, link: 'https://ambuj-ai-portfolio.vercel.app/' },
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

            {/* ══════════════════ FAT FOOTER ══════════════════ */}
            <footer id="about" style={{ padding: '5rem 4rem 3rem 4rem', background: '#030303', borderTop: '1px solid rgba(255, 255, 255, 0.05)', color: '#9CA3AF', fontSize: '0.9rem' }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: '3rem' }}>
                    
                    {/* Left Column: Logo & Copyright */}
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '300px', flex: 1.5, minWidth: '250px' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
                                <img src={logo} alt="Logo" style={{ height: '40px', borderRadius: '8px' }} />
                                <span style={{ fontWeight: 700, fontSize: '1.4rem', color: '#fff', letterSpacing: '-0.5px' }}>CitizenSafety<span style={{ color: '#F59E0B' }}>AI</span></span>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <a href="https://www.linkedin.com/in/ambuj-tripathi-042b4a118/" target="_blank" rel="noreferrer" style={{ color: '#a1a1aa', transition: 'color 0.2s' }} onMouseOver={e=>e.target.style.color='#fff'} onMouseOut={e=>e.target.style.color='#a1a1aa'}><FaLinkedin size={22} /></a>
                                <a href="https://x.com/Ambuj_KTripathi" target="_blank" rel="noreferrer" style={{ color: '#a1a1aa', transition: 'color 0.2s' }} onMouseOver={e=>e.target.style.color='#fff'} onMouseOut={e=>e.target.style.color='#a1a1aa'}><FaXTwitter size={22} /></a>
                                <a href="https://github.com/Ambuj123-lab" target="_blank" rel="noreferrer" style={{ color: '#a1a1aa', transition: 'color 0.2s' }} onMouseOver={e=>e.target.style.color='#fff'} onMouseOut={e=>e.target.style.color='#a1a1aa'}><FaGithub size={22} /></a>
                                <a href="https://medium.com/@ambuj_tripathi" target="_blank" rel="noreferrer" style={{ color: '#a1a1aa', transition: 'color 0.2s' }} onMouseOver={e=>e.target.style.color='#fff'} onMouseOut={e=>e.target.style.color='#a1a1aa'}><FaMedium size={22} /></a>
                            </div>
                        </div>

                        <div style={{ marginTop: 'auto' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '1rem', fontSize: '0.8rem', color: '#6b7280' }}>
                                <span style={{ color: '#9CA3AF' }}>Version: <span style={{ color: '#fff' }}>v1.0</span></span>
                                <span style={{ color: '#9CA3AF' }}>Deployment: <span style={{ color: '#fff' }}>Vercel / AWS</span></span>
                                <span style={{ color: '#9CA3AF' }}>API Uptime: <a href="https://stats.uptimerobot.com/4tYmSQnuBE" target="_blank" rel="noreferrer" style={{ color: '#F59E0B', textDecoration: 'none' }} onMouseOver={e=>e.target.style.textDecoration='underline'} onMouseOut={e=>e.target.style.textDecoration='none'}>{uptimeData ? `${uptimeData.uptime} • ${uptimeData.latency}` : '--%'}</a></span>
                                <span style={{ color: '#9CA3AF' }}>Last Updated: <span style={{ color: '#fff' }}>July 2026</span></span>
                            </div>
                            <p style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>&copy; {new Date().getFullYear()} Ambuj Kumar Tripathi.</p>
                        </div>
                    </div>

                    {/* Columns Container */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '2rem', flex: 3 }}>
                        {/* Column 1 */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <h4 style={{ color: '#fff', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.95rem' }}>Platform</h4>
                            <a href="#pipeline" style={{ color: 'inherit', textDecoration: 'none' }} onMouseOver={e=>e.target.style.color='#fff'} onMouseOut={e=>e.target.style.color='#9CA3AF'}>RAG Engine</a>
                            <a href="#pipeline" style={{ color: 'inherit', textDecoration: 'none' }} onMouseOver={e=>e.target.style.color='#fff'} onMouseOut={e=>e.target.style.color='#9CA3AF'}>PII Anonymization</a>
                            <a href="#pipeline" style={{ color: 'inherit', textDecoration: 'none' }} onMouseOver={e=>e.target.style.color='#fff'} onMouseOut={e=>e.target.style.color='#9CA3AF'}>Semantic Caching</a>
                        </div>

                        {/* Column 2 */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <h4 style={{ color: '#fff', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.95rem' }}>Solutions</h4>
                            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }} onMouseOver={e=>e.target.style.color='#fff'} onMouseOut={e=>e.target.style.color='#9CA3AF'}>Emergency Routing</a>
                            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }} onMouseOver={e=>e.target.style.color='#fff'} onMouseOut={e=>e.target.style.color='#9CA3AF'}>Crisis Response</a>
                            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }} onMouseOver={e=>e.target.style.color='#fff'} onMouseOut={e=>e.target.style.color='#9CA3AF'}>Police Departments</a>
                        </div>
                        
                        {/* Column - Ecosystem */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <h4 style={{ color: '#fff', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.95rem' }}>Ecosystem</h4>
                            <a href="https://agentic-rag-financial-parser.onrender.com/" target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }} onMouseOver={e=>e.target.style.color='#fff'} onMouseOut={e=>e.target.style.color='#9CA3AF'}>Financial Parser</a>
                            <a href="https://indian-legal-ai-expert.onrender.com/" target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }} onMouseOver={e=>e.target.style.color='#fff'} onMouseOut={e=>e.target.style.color='#9CA3AF'}>Indian Legal AI Expert</a>
                            <a href="https://ambuj-ai-portfolio.vercel.app" target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }} onMouseOver={e=>e.target.style.color='#fff'} onMouseOut={e=>e.target.style.color='#9CA3AF'}>AI Portfolio Hub</a>
                        </div>

                        {/* Column 3 */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <h4 style={{ color: '#fff', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.95rem' }}>Resources</h4>
                            <a href="https://github.com/Ambuj123-lab" target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }} onMouseOver={e=>e.target.style.color='#fff'} onMouseOut={e=>e.target.style.color='#9CA3AF'}>GitHub</a>
                            <a href="https://ambuj-rag-docs.netlify.app/" target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }} onMouseOver={e=>e.target.style.color='#fff'} onMouseOut={e=>e.target.style.color='#9CA3AF'}>Documentation</a>
                        </div>

                        {/* Column 4 */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <h4 style={{ color: '#fff', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.95rem' }}>Legal</h4>
                            <a href="#legal" onClick={(e) => { e.preventDefault(); setLegalModal('PRIVACY'); }} style={{ color: 'inherit', textDecoration: 'none' }} onMouseOver={e=>e.target.style.color='#fff'} onMouseOut={e=>e.target.style.color='#9CA3AF'}>Privacy Policy</a>
                            <a href="#legal" onClick={(e) => { e.preventDefault(); setLegalModal('TOS'); }} style={{ color: 'inherit', textDecoration: 'none' }} onMouseOver={e=>e.target.style.color='#fff'} onMouseOut={e=>e.target.style.color='#9CA3AF'}>Terms of Service</a>
                        </div>
                    </div>
                </div>
            </footer>

            {/* ══════════════════ LEGAL MODALS ══════════════════ */}
            {legalModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', backdropFilter: 'blur(5px)' }} onClick={() => setLegalModal(null)}>
                    <div className="legal-modal-container" style={{ background: '#0f172a', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '12px', padding: '0', width: '100%', maxWidth: '800px', maxHeight: '85vh', overflowY: 'auto', position: 'relative', color: '#e5e7eb', boxShadow: '0 20px 40px rgba(0,0,0,0.7)' }} onClick={(e) => e.stopPropagation()}>
                        
                        <div style={{ position: 'sticky', top: 0, right: 0, display: 'flex', justifyContent: 'flex-end', padding: '1rem', background: 'linear-gradient(to bottom, #0f172a 80%, transparent)', zIndex: 10 }}>
                            <button onClick={() => setLegalModal(null)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#9ca3af', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} onMouseOver={e=>{e.target.style.background='rgba(255,255,255,0.1)'; e.target.style.color='#fff'}} onMouseOut={e=>{e.target.style.background='rgba(255,255,255,0.05)'; e.target.style.color='#9ca3af'}}>
                                &times;
                            </button>
                        </div>
                        
                        <div style={{ padding: '0 2rem 3rem 2rem' }}>
                            {legalModal === 'TOS' && (
                                <div>
                                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                                        <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem', letterSpacing: '-0.5px' }}>Terms of Service</h2>
                                        <p style={{ color: '#F59E0B', fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem' }}>Effective July 2026</p>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', overflow: 'hidden' }}>
                                        <div style={{ background: '#1e293b', padding: '1.5rem 2rem' }}>
                                            <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>🎓 Learning & Development Use Only</h3>
                                            <p style={{ color: '#9ca3af', fontSize: '0.95rem', lineHeight: 1.6 }}>This platform is provided exclusively for educational and learning purposes. There is no exchange of money or commercial service involved. It is an AI simulation and is NOT a replacement for official 911 or emergency dispatch services.</p>
                                        </div>
                                        <div style={{ background: '#1e293b', padding: '1.5rem 2rem' }}>
                                            <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>🛡️ PII Masking Notice</h3>
                                            <p style={{ color: '#9ca3af', fontSize: '0.95rem', lineHeight: 1.6 }}><b>While we use Microsoft Presidio for PII masking, which never reaches the LLM and sits as orphaned or stale vectors in the vector db</b>, users acknowledge that providing extremely sensitive data is at their own risk during this beta phase.</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {legalModal === 'PRIVACY' && (
                                <div>
                                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                                        <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem', letterSpacing: '-0.5px' }}>Privacy Policy</h2>
                                        <p style={{ color: '#F59E0B', fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem' }}>Effective July 2026</p>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', overflow: 'hidden' }}>
                                        <div style={{ background: '#1e293b', padding: '1.5rem 2rem' }}>
                                            <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>🔒 PII Anonymization</h3>
                                            <p style={{ color: '#9ca3af', fontSize: '0.95rem', lineHeight: 1.6 }}>All incoming emergency requests are immediately scrubbed of Personally Identifiable Information (PII) such as phone numbers, names, and locations using Microsoft Presidio before reaching the LLM layer.</p>
                                        </div>
                                        <div style={{ background: '#1e293b', padding: '1.5rem 2rem' }}>
                                            <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>🗑️ No Retention Policy</h3>
                                            <p style={{ color: '#9ca3af', fontSize: '0.95rem', lineHeight: 1.6 }}>We do not store your emergency prompts. Data is processed in-memory for routing purposes and instantly discarded.</p>
                                        </div>
                                        <div style={{ background: '#1e293b', padding: '1.5rem 2rem' }}>
                                            <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>👁️ Telemetry & Observability</h3>
                                            <p style={{ color: '#9ca3af', fontSize: '0.95rem', lineHeight: 1.6 }}>We use Langfuse for system observability (latency, token usage) with strict zero-user tracking configurations. Your identity is never logged.</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}            {/* ══════════════════ BACK TO TOP ══════════════════ */}
            <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                style={{
                    position: 'fixed',
                    bottom: '24px',
                    right: '24px',
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: 'rgba(7, 9, 15, 0.9)',
                    border: '1px solid rgba(245, 158, 11, 0.2)',
                    color: '#F59E0B',
                    fontSize: '20px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    opacity: showBackToTop ? 1 : 0,
                    pointerEvents: showBackToTop ? 'auto' : 'none',
                    transform: showBackToTop ? 'translateY(0)' : 'translateY(20px)',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(8px)'
                }}
                title="Back to Top"
            >↑</button>
        </div>
    );
};

export default Login;
