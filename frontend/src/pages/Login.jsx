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

/* ── Stat Card Component (Clean & Borderless) ── */
const StatCard = ({ value, suffix, label, delay }) => {
    const { count, ref } = useCountUp(value, 2000);

    return (
        <div ref={ref} className={`fade-up ${delay} flex flex-col items-center justify-center p-4`}>
            <p className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70 tracking-tight tabular-nums">
                {count.toLocaleString()}{suffix}
            </p>
            <p className="text-[14px] font-medium text-neutral-500 mt-2">{label}</p>
        </div>
    );
};

/* ── Main Landing Page ── */
const Login = () => {
    const handleGoogleLogin = () => {
        window.location.href = authAPI.getLoginUrl();
    };

    return (
        <div className="bg-[#000000] text-white selection:bg-cyan-500/30 font-sans relative">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

                html, body {
                    scroll-behavior: smooth;
                }

                /* Animations */
                @keyframes fade-up {
                    0% { opacity: 0; transform: translateY(30px); filter: blur(8px); }
                    100% { opacity: 1; transform: translateY(0); filter: blur(0); }
                }
                .fade-up {
                    opacity: 0;
                    animation: fade-up 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .d-1 { animation-delay: 0.1s; }
                .d-2 { animation-delay: 0.2s; }
                .d-3 { animation-delay: 0.3s; }
                .d-4 { animation-delay: 0.4s; }
                .d-5 { animation-delay: 0.5s; }

                /* Custom Grid Background (Fixed to prevent stretching on scroll) */
                .bg-grid {
                    background-size: 50px 50px;
                    background-image: linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                                      linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
                    mask-image: linear-gradient(to bottom, transparent, black 5%, black 95%, transparent);
                    -webkit-mask-image: linear-gradient(to bottom, transparent, black 10%, black 90%, transparent);
                }
                
                @keyframes shimmer {
                    0% { transform: translateX(-100%) skewX(-20deg); }
                    100% { transform: translateX(200%) skewX(-20deg); }
                }
            `}</style>

            {/* ════ FIXED BACKGROUND EFFECTS ════ */}
            <div className="fixed inset-0 bg-grid pointer-events-none z-0" />
            
            {/* Glowing Top Orb */}
            <div className="fixed top-[-20%] left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] opacity-[0.12] pointer-events-none z-0">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 blur-[120px] mix-blend-screen" />
            </div>

            {/* Glowing Bottom Orb */}
            <div className="fixed bottom-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] opacity-[0.08] pointer-events-none z-0">
                <div className="absolute inset-0 rounded-full bg-gradient-to-t from-emerald-500 to-transparent blur-[120px] mix-blend-screen" />
            </div>

            {/* ════ NAVBAR ════ */}
            <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-6 backdrop-blur-xl border-b border-white/[0.02]">
                <div className="flex items-center gap-3">
                    <img src={logo} alt="Logo" className="w-8 h-8 object-contain" />
                    <span className="text-[14px] font-semibold tracking-tight text-white/90">Citizen Safety AI</span>
                </div>
                <button
                    onClick={handleGoogleLogin}
                    className="px-5 py-2 text-[13px] font-medium text-white bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] rounded-full transition-all"
                >
                    Sign In
                </button>
            </nav>

            <div className="relative z-10 font-[Inter]">
                
                {/* ════ SECTION 1: HERO (Full Height) ════ */}
                <section className="min-h-screen flex flex-col items-center justify-center px-6 text-center max-w-5xl mx-auto pt-20">
                    
                    {/* Badges */}
                    <div className="flex flex-wrap justify-center gap-3 mb-10 fade-up d-1">
                        <span className="px-3 py-1.5 text-[12px] font-medium text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 rounded-full flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                            Qwen3 235B
                        </span>
                        <span className="px-3 py-1.5 text-[12px] font-medium text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-full flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            GDPR Compliant
                        </span>
                        <span className="px-3 py-1.5 text-[12px] font-medium text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-full">
                            Pinecone + Jina V2
                        </span>
                    </div>

                    {/* Massive Typography */}
                    <h1 className="fade-up d-2 text-[64px] sm:text-[84px] lg:text-[100px] font-bold tracking-[-0.04em] leading-[1.05] mb-8">
                        <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70">
                            Legal Intelligence.
                        </span>
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-b from-neutral-500 to-neutral-800">
                            Enterprise Scale.
                        </span>
                    </h1>

                    <p className="fade-up d-3 text-[18px] sm:text-[20px] text-neutral-400 leading-[1.8] font-light max-w-2xl mb-14">
                        An advanced retrieval-augmented generation pipeline tailored for Indian legal frameworks. Real-time PII redaction ensures absolute privacy.
                    </p>

                    {/* Primary Hero CTA */}
                    <div className="fade-up d-4">
                        <button
                            onClick={handleGoogleLogin}
                            className="group relative flex items-center justify-center gap-3 h-14 w-80 bg-white hover:bg-neutral-100 text-black text-[15px] font-semibold rounded-full transition-all active:scale-[0.98] shadow-[0_0_30px_rgba(255,255,255,0.15)]"
                        >
                            <div className="absolute inset-0 overflow-hidden rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-[-20deg] animate-[shimmer_2s_infinite]" />
                            </div>
                            <svg className="w-5 h-5 relative z-10" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            <span className="relative z-10">Sign in with Google to Begin</span>
                        </button>
                    </div>
                </section>

                {/* ════ SECTION 2: FEATURES (Scroll Down) ════ */}
                <section className="py-32 px-6 bg-[#000000]">
                    <div className="max-w-6xl mx-auto">
                        
                        {/* Section Header */}
                        <div className="text-center mb-20 fade-up d-1 flex flex-col items-center">
                            <span className="px-4 py-1.5 text-[12px] font-medium text-neutral-300 border border-white/10 rounded-full mb-8">
                                Capabilities
                            </span>
                            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-6">
                                Designed for scale and safety.
                            </h2>
                            <p className="text-[16px] text-neutral-500 font-light max-w-2xl mx-auto">
                                Every architectural decision prioritize zero-latency retrieval while completely isolating user identity from the model payload.
                            </p>
                        </div>

                        {/* Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 fade-up d-2">
                            
                            {/* Card 1 */}
                            <div className="bg-[#0A0D14] border border-white/[0.04] rounded-[24px] p-8 text-left transition-all hover:bg-[#0F131C] group">
                                <svg className="w-5 h-5 text-white/70 mb-5 group-hover:text-cyan-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                                <h3 className="text-[18px] font-medium text-white mb-3 tracking-tight">Agentic RAG Engine</h3>
                                <p className="text-[14px] text-neutral-400 leading-[1.6] font-light">
                                    Powered by LangChain and Pinecone. Delivers deterministic source citations across 20+ legal frameworks with contextual multi-turn reasoning.
                                </p>
                            </div>

                            {/* Card 2 */}
                            <div className="bg-[#0A0D14] border border-white/[0.04] rounded-[24px] p-8 text-left transition-all hover:bg-[#0F131C] group">
                                <svg className="w-5 h-5 text-white/70 mb-5 group-hover:text-emerald-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                <h3 className="text-[18px] font-medium text-white mb-3 tracking-tight">Zero-Trust PII Shield</h3>
                                <p className="text-[14px] text-neutral-400 leading-[1.6] font-light">
                                    Microsoft Presidio intercepts and redacts all personal identifiers before they hit the cloud model. Backed by a strict 30-day auto-delete policy.
                                </p>
                            </div>

                            {/* Card 3 */}
                            <div className="bg-[#0A0D14] border border-white/[0.04] rounded-[24px] p-8 text-left transition-all hover:bg-[#0F131C] group">
                                <svg className="w-5 h-5 text-white/70 mb-5 group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                <h3 className="text-[18px] font-medium text-white mb-3 tracking-tight">Hyper-Optimized RunTime</h3>
                                <p className="text-[14px] text-neutral-400 leading-[1.6] font-light">
                                    Engineered for 512MB RAM constraints utilizing Redis semantic caching and Jina MRL embeddings, cutting total storage overhead by 75%.
                                </p>
                            </div>

                        </div>
                    </div>
                </section>

                {/* ════ SECTION 3: METRICS ════ */}
                <section className="py-32 px-6 border-t border-white/[0.05]">
                    <div className="max-w-5xl mx-auto">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-16 gap-x-8">
                            <StatCard delay="d-1" value={31500} suffix="+" label="Total Legal Chunks" />
                            <StatCard delay="d-2" value={28000} suffix="+" label="Child Vectors" />
                            <StatCard delay="d-3" value={75} suffix="%" label="Storage Reduced" />
                            <StatCard delay="d-4" value={7} suffix=" Layers" label="Of Identity Shielding" />
                        </div>
                    </div>
                </section>

                {/* ════ FOOTER / FINAL CTA ════ */}
                <footer className="py-12 border-t border-white/[0.05] bg-black text-center">
                    <p className="text-[14px] text-neutral-600 font-medium">
                        &copy; 2026 Ambuj Kumar Tripathi. Designed to scale.
                    </p>
                </footer>

            </div>
        </div>
    );
};

export default Login;
