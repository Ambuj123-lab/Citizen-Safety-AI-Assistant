import { authAPI } from '../api';
import logo from '../assets/logo.png';
import { useState, useEffect, useRef } from 'react';

/* ── Animated Counter Hook ── */
const useCountUp = (target, duration = 2000) => {
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
        }, { threshold: 0.2 });
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [target, duration]);

    return { count, ref };
};

const Login = () => {

    const handleGoogleLogin = () => {
        window.location.href = authAPI.getLoginUrl();
    };

    const handleGitHubLogin = () => {
        window.location.href = `${authAPI.getLoginUrl().replace('google', 'github')}`;
    };

    return (
        <div className="min-h-screen bg-black text-white overflow-x-hidden" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

                /* Card entrance animation */
                @keyframes card-woosh {
                    0% { opacity: 0; transform: translateY(60px) scale(0.96); }
                    60% { opacity: 1; transform: translateY(-4px) scale(1.01); }
                    100% { opacity: 1; transform: translateY(0) scale(1); }
                }
                .card-animate {
                    opacity: 0;
                    animation: card-woosh 0.9s cubic-bezier(0.22, 1, 0.36, 1) forwards;
                }
                .card-d1 { animation-delay: 0.15s; }
                .card-d2 { animation-delay: 0.3s; }
                .card-d3 { animation-delay: 0.45s; }
                .card-d4 { animation-delay: 0.6s; }
                .card-d5 { animation-delay: 0.75s; }
                .card-d6 { animation-delay: 0.9s; }

                /* Hero text animation */
                @keyframes hero-rise {
                    0% { opacity: 0; transform: translateY(30px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
                .hero-animate {
                    opacity: 0;
                    animation: hero-rise 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
                }
                .hero-d1 { animation-delay: 0s; }
                .hero-d2 { animation-delay: 0.12s; }
                .hero-d3 { animation-delay: 0.24s; }
                .hero-d4 { animation-delay: 0.36s; }

                /* Tag float animation */
                @keyframes tag-float {
                    0% { opacity: 0; transform: translateY(20px) scale(0.9); }
                    100% { opacity: 1; transform: translateY(0) scale(1); }
                }
                .tag-animate {
                    opacity: 0;
                    animation: tag-float 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
                }
                .tag-d1 { animation-delay: 0.8s; }
                .tag-d2 { animation-delay: 0.9s; }
                .tag-d3 { animation-delay: 1.0s; }
                .tag-d4 { animation-delay: 1.1s; }

                /* Stat counter animation */
                @keyframes stat-rise {
                    0% { opacity: 0; transform: translateY(40px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
                .stat-animate {
                    opacity: 0;
                    animation: stat-rise 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards;
                }
                .stat-d1 { animation-delay: 1.0s; }
                .stat-d2 { animation-delay: 1.15s; }
                .stat-d3 { animation-delay: 1.3s; }
                .stat-d4 { animation-delay: 1.45s; }

                /* Bottom ambient glow */
                .ambient-glow {
                    background: radial-gradient(ellipse 60% 40% at 50% 100%, rgba(239,68,68,0.08), transparent 70%),
                                radial-gradient(ellipse 40% 30% at 30% 100%, rgba(249,115,22,0.06), transparent 60%),
                                radial-gradient(ellipse 40% 30% at 70% 100%, rgba(168,85,247,0.04), transparent 60%);
                }
            `}</style>

            {/* Ambient bottom glow (like reference image) */}
            <div className="fixed bottom-0 left-0 right-0 h-[400px] ambient-glow pointer-events-none z-0" />

            {/* ═══════ HERO SECTION ═══════ */}
            <section className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 pt-8 pb-20">

                {/* Top nav area with logo + sign in */}
                <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-8 py-5 z-20">
                    <div className="flex items-center gap-3">
                        <img src={logo} alt="Logo" className="w-7 h-7 object-contain opacity-70" />
                        <span className="text-[13px] font-medium text-white/50 tracking-tight hidden sm:block">Ambuj Kumar Tripathi</span>
                    </div>
                    <button
                        onClick={handleGoogleLogin}
                        className="h-9 px-5 bg-white/[0.08] text-white/80 text-[13px] font-medium rounded-full hover:bg-white/[0.12] transition-all border border-white/[0.06] active:scale-95"
                    >
                        Sign In →
                    </button>
                </div>

                {/* Main Hero Content */}
                <div className="text-center max-w-4xl mx-auto mt-16">

                    {/* Title */}
                    <h1 className="hero-animate hero-d1 text-6xl sm:text-7xl lg:text-8xl font-black text-white tracking-tight leading-[1] mb-5">
                        Citizen Safety AI
                    </h1>

                    {/* Subtitle */}
                    <p className="hero-animate hero-d2 text-base sm:text-lg text-neutral-400 font-normal max-w-xl mx-auto leading-relaxed mb-16">
                        AI-powered legal intelligence for India. Enterprise-grade retrieval with real-time PII protection.
                    </p>

                    {/* ═══ Feature Cards (3 cards like reference) ═══ */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 max-w-3xl mx-auto">

                        {/* Card 1 — Agentic RAG */}
                        <div className="card-animate card-d1 group bg-[#141414] rounded-2xl p-6 text-left border border-white/[0.06] hover:border-white/[0.1] transition-all relative overflow-hidden">
                            <div className="absolute top-0 left-4 right-4 h-[2px] bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full" />
                            <h3 className="text-[17px] font-bold text-white mb-3 mt-2">Agentic RAG</h3>
                            <p className="text-[13px] text-neutral-400 leading-relaxed">
                                Multi-turn retrieval pipeline built on LangChain with Pinecone vector search and deterministic source citations across 20+ legal frameworks.
                            </p>
                        </div>

                        {/* Card 2 — PII Shield */}
                        <div className="card-animate card-d2 group bg-[#141414] rounded-2xl p-6 text-left border border-white/[0.06] hover:border-white/[0.1] transition-all relative overflow-hidden">
                            <div className="absolute top-0 left-4 right-4 h-[2px] bg-gradient-to-r from-cyan-400 to-teal-400 rounded-full" />
                            <h3 className="text-[17px] font-bold text-white mb-3 mt-2">PII Shield</h3>
                            <p className="text-[13px] text-neutral-400 leading-relaxed">
                                Microsoft Presidio masks personal identifiers before they reach the LLM. 7-layer security with GDPR-compliant 30-day auto-delete.
                            </p>
                        </div>

                        {/* Card 3 — Production Scale */}
                        <div className="card-animate card-d3 group bg-[#141414] rounded-2xl p-6 text-left border border-white/[0.06] hover:border-white/[0.1] transition-all relative overflow-hidden">
                            <div className="absolute top-0 left-4 right-4 h-[2px] bg-gradient-to-r from-emerald-400 to-green-400 rounded-full" />
                            <h3 className="text-[17px] font-bold text-white mb-3 mt-2">Production Scale</h3>
                            <p className="text-[13px] text-neutral-400 leading-relaxed">
                                Optimized for 512MB RAM constraints with Redis semantic caching, circuit breakers, and Jina MRL embeddings achieving 75% storage savings.
                            </p>
                        </div>
                    </div>

                    {/* ═══ Tag Pills (like reference) ═══ */}
                    <div className="flex flex-wrap items-center justify-center gap-3 mb-20">
                        <span className="tag-animate tag-d1 px-4 py-2 rounded-full text-[12px] font-medium border border-amber-500/40 text-amber-400 bg-amber-500/[0.04]">
                            Qwen3 235B
                        </span>
                        <span className="tag-animate tag-d2 px-4 py-2 rounded-full text-[12px] font-medium border border-cyan-500/40 text-cyan-400 bg-cyan-500/[0.04]">
                            Pinecone + Jina V2
                        </span>
                        <span className="tag-animate tag-d3 px-4 py-2 rounded-full text-[12px] font-medium border border-emerald-500/40 text-emerald-400 bg-emerald-500/[0.04]">
                            GDPR Compliant
                        </span>
                        <span className="tag-animate tag-d4 px-4 py-2 rounded-full text-[12px] font-medium border border-red-500/40 text-red-400 bg-red-500/[0.04]">
                            OAuth 2.0
                        </span>
                    </div>

                    {/* ═══ Stats Grid (Flying in) ═══ */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-16">
                        <StatCard value={31500} suffix="+" label="Total Chunks" sub="Parent-child indexed" delay="stat-d1" borderColor="from-blue-500 to-cyan-500" />
                        <StatCard value={28000} suffix="+" label="Child Vectors" sub="Dense Jina embeddings" delay="stat-d2" borderColor="from-cyan-500 to-teal-500" />
                        <StatCard value={75} suffix="%" label="Storage Saved" sub="MRL compression" delay="stat-d3" borderColor="from-emerald-500 to-green-500" />
                        <StatCard value={7} suffix=" Layer" label="Security" sub="Enterprise-grade shield" delay="stat-d4" borderColor="from-violet-500 to-purple-500" />
                    </div>

                    {/* ═══ Login CTA ═══ */}
                    <div className="hero-animate hero-d4 flex flex-col sm:flex-row items-center justify-center gap-3">
                        <button
                            onClick={handleGoogleLogin}
                            className="group h-12 px-8 bg-white text-black text-[14px] font-semibold rounded-full flex items-center gap-3 hover:bg-neutral-200 transition-all active:scale-95 shadow-lg shadow-white/5"
                        >
                            <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Continue with Google
                        </button>
                        <button
                            onClick={handleGitHubLogin}
                            className="h-12 px-8 bg-white/[0.06] text-white/80 text-[14px] font-medium rounded-full flex items-center gap-3 border border-white/[0.08] hover:bg-white/[0.1] transition-all"
                        >
                            <svg className="w-5 h-5 opacity-70" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                            </svg>
                            GitHub
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="absolute bottom-0 left-0 right-0 text-center py-5">
                    <p className="text-[11px] text-neutral-600">
                        &copy; 2026 <span className="text-neutral-500">Ambuj Kumar Tripathi</span>. All rights reserved.
                    </p>
                </div>
            </section>
        </div>
    );
};

/* ── Stat Card with Animated Counter ── */
const StatCard = ({ value, suffix, label, sub, delay, borderColor }) => {
    const { count, ref } = useCountUp(value, 2200);

    return (
        <div ref={ref} className={`stat-animate ${delay} bg-[#141414] rounded-2xl p-5 text-left border border-white/[0.06] relative overflow-hidden group hover:border-white/[0.1] transition-all`}>
            <div className={`absolute top-0 left-4 right-4 h-[2px] bg-gradient-to-r ${borderColor} rounded-full opacity-60`} />
            <p className="text-3xl font-black text-white tracking-tight mt-1 tabular-nums">
                {count.toLocaleString()}{suffix}
            </p>
            <p className="text-[13px] font-semibold text-neutral-300 mt-1.5">{label}</p>
            <p className="text-[11px] text-neutral-600 mt-0.5">{sub}</p>
        </div>
    );
};

export default Login;
