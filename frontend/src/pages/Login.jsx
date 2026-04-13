import { authAPI } from '../api';
import logo from '../assets/logo.png';
import { useState, useEffect, useRef } from 'react';

/* ── Counter Hook ── */
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

/* ── Stat Card Component ── */
const StatCard = ({ value, suffix, label, delay }) => {
    const { count, ref } = useCountUp(value, 2000);

    return (
        <div ref={ref} className={`fade-up ${delay} relative flex flex-col items-center justify-center p-4 transition-colors`}>
            <p className="text-3xl md:text-4xl font-semibold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70 tracking-tight tabular-nums relative z-10">
                {count.toLocaleString()}{suffix}
            </p>
            <p className="text-[13px] font-medium text-neutral-500 mt-1 relative z-10">{label}</p>
        </div>
    );
};

/* ── Main Landing Page ── */
const Login = () => {
    const handleGoogleLogin = () => {
        window.location.href = authAPI.getLoginUrl();
    };

    return (
        <div className="min-h-screen bg-[#000000] text-white overflow-hidden selection:bg-cyan-500/30 font-sans relative">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

                /* Animations */
                @keyframes fade-up {
                    0% { opacity: 0; transform: translateY(20px); filter: blur(4px); }
                    100% { opacity: 1; transform: translateY(0); filter: blur(0); }
                }
                .fade-up {
                    opacity: 0;
                    animation: fade-up 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .d-1 { animation-delay: 0.1s; }
                .d-2 { animation-delay: 0.2s; }
                .d-3 { animation-delay: 0.3s; }
                .d-4 { animation-delay: 0.4s; }
                .d-5 { animation-delay: 0.5s; }

                /* Custom Grid Background */
                .bg-grid {
                    background-size: 40px 40px;
                    background-image: linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                                      linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
                    mask-image: linear-gradient(to bottom, transparent, black 10%, black 70%, transparent);
                    -webkit-mask-image: linear-gradient(to bottom, transparent, black 10%, black 70%, transparent);
                }
            `}</style>

            {/* ════ BACKGROUND EFFECTS ════ */}
            <div className="absolute inset-0 bg-grid pointer-events-none" />
            
            {/* Glowing Orb */}
            <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] opacity-[0.15] pointer-events-none">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 blur-[100px] mix-blend-screen" />
            </div>

            {/* ════ NAVBAR ════ */}
            <nav className="relative z-50 flex items-center justify-between px-8 py-6 fade-up d-1">
                <div className="flex items-center gap-3">
                    <img src={logo} alt="Logo" className="w-8 h-8 object-contain" />
                    <span className="text-[14px] font-semibold tracking-tight text-white/90">Citizen Safety AI</span>
                </div>
                <button
                    onClick={handleGoogleLogin}
                    className="px-5 py-2 text-[13px] font-medium text-white bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] rounded-full transition-all backdrop-blur-md"
                >
                    Sign In
                </button>
            </nav>

            {/* ════ HERO SECTION ════ */}
            <main className="relative z-10 flex flex-col items-center justify-center px-6 pt-12 pb-24 text-center max-w-[1200px] mx-auto min-h-[85vh]">
                
                {/* Badges / Tech Stack */}
                <div className="flex flex-wrap justify-center gap-3 mb-8 fade-up d-2">
                    <span className="px-3 py-1 text-[12px] font-medium text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 rounded-full flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                        Qwen3 235B
                    </span>
                    <span className="px-3 py-1 text-[12px] font-medium text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-full flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        GDPR Compliant
                    </span>
                    <span className="px-3 py-1 text-[12px] font-medium text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-full">
                        Pinecone + Jina V2
                    </span>
                </div>

                {/* Typography */}
                <h1 className="fade-up d-2 text-[56px] sm:text-[72px] lg:text-[88px] font-bold tracking-[-0.04em] leading-[1.1] mb-6 max-w-4xl">
                    <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">
                        Legal Intelligence.
                    </span>
                    <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-b from-neutral-500 to-neutral-700">
                        Enterprise Scale.
                    </span>
                </h1>

                <p className="fade-up d-3 text-[16px] sm:text-[18px] text-neutral-400 leading-relaxed max-w-2xl mb-12">
                    An advanced retrieval-augmented generation pipeline tailored for Indian legal frameworks. Real-time PII redaction ensures absolute privacy.
                </p>

                {/* Main Feature Cards - Ultra Clean */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 w-full max-w-5xl mb-16 fade-up d-4">
                    
                    {/* Card 1 */}
                    <div className="text-left relative">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/[0.03] border border-white/[0.08] mb-6">
                            <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <h3 className="text-[18px] font-medium text-white mb-3 tracking-tight">Agentic RAG</h3>
                        <p className="text-[14px] text-neutral-500 leading-relaxed font-light">
                            Multi-turn retrieval pipeline built on LangChain with Pinecone vector search and deterministic source citations across 20+ legal frameworks.
                        </p>
                    </div>

                    {/* Card 2 */}
                    <div className="text-left relative">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/[0.03] border border-white/[0.08] mb-6">
                            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <h3 className="text-[18px] font-medium text-white mb-3 tracking-tight">PII Shield</h3>
                        <p className="text-[14px] text-neutral-500 leading-relaxed font-light">
                            Microsoft Presidio masks personal identifiers before they reach the LLM. 7-layer security with GDPR-compliant 30-day auto-delete.
                        </p>
                    </div>

                    {/* Card 3 */}
                    <div className="text-left relative">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/[0.03] border border-white/[0.08] mb-6">
                            <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <h3 className="text-[18px] font-medium text-white mb-3 tracking-tight">Rapid Scale</h3>
                        <p className="text-[14px] text-neutral-500 leading-relaxed font-light">
                            Optimized for 512MB RAM constraints with Redis semantic caching, circuit breakers, and Jina MRL embeddings achieving 75% savings.
                        </p>
                    </div>

                </div>

                {/* Stats Grid - Ultra Minimalist */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 w-full max-w-5xl mb-20 fade-up d-4 border-t border-white/[0.05] pt-12">
                    <StatCard delay="d-1" value={31500} suffix="+" label="Total Chunks Indexed" />
                    <StatCard delay="d-2" value={28000} suffix="+" label="Child Vectors" />
                    <StatCard delay="d-3" value={75} suffix="%" label="Storage Saved" />
                    <StatCard delay="d-4" value={7} suffix=" Layers" label="Security Compliance" />
                </div>

                {/* Login Button - Single & Focused */}
                <div className="fade-up d-5 flex items-center justify-center">
                    <button
                        onClick={handleGoogleLogin}
                        className="group relative flex items-center justify-center gap-3 h-12 w-72 bg-white hover:bg-neutral-100 text-black text-[14px] font-semibold rounded-full transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                    >
                        {/* Shimmer effect inside button */}
                        <div className="absolute inset-0 overflow-hidden rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-[-20deg] animate-[shimmer_2s_infinite]" />
                        </div>
                        <svg className="w-5 h-5 relative z-10" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        <span className="relative z-10">Continue with Google</span>
                    </button>
                </div>
                
                <style>{`
                    @keyframes shimmer {
                        0% { transform: translateX(-100%) skewX(-20deg); }
                        100% { transform: translateX(200%) skewX(-20deg); }
                    }
                `}</style>
            </main>

            {/* ════ FOOTER ════ */}
            <footer className="absolute bottom-0 left-0 right-0 py-6 text-center z-10">
                <p className="text-[12px] text-neutral-600 font-medium">
                    &copy; 2026 Ambuj Kumar Tripathi. All rights reserved.
                </p>
            </footer>

        </div>
    );
};

export default Login;
