import { Shield, Lock, Scale } from 'lucide-react';
import { authAPI } from '../api';
import logo from '../assets/logo.png';

const Login = () => {

    const handleGoogleLogin = () => {
        window.location.href = authAPI.getLoginUrl();
    };

    const handleGitHubLogin = () => {
        window.location.href = `${authAPI.getLoginUrl().replace('google', 'github')}`;
    };

    return (
        <div className="min-h-screen flex font-sans overflow-hidden bg-[#020617]">

            {/* Styles */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Inter:wght@300;400;500;600&display=swap');
                .font-serif-display { font-family: 'Playfair Display', serif; }
                
                @keyframes scroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-scroll {
                    animation: scroll 30s linear infinite;
                }
                .mask-fade {
                    mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
                }
                
                /* GOD RAYS ANIMATION */
                @keyframes ray-shift {
                    0% { transform: rotate(-45deg) list(50% 0%); opacity: 0.3; }
                    50% { transform: rotate(-45deg) translate(20px, 20px); opacity: 0.5; }
                    100% { transform: rotate(-45deg) translate(0, 0); opacity: 0.3; }
                }
            `}</style>

            {/* ===== LEFT SIDE (Cinematic Spotlight) ===== */}
            <div className="hidden lg:flex w-[60%] relative flex-col p-20 text-white overflow-hidden bg-black justify-between h-screen">

                {/* 1. GOD RAYS EFFECT */}
                <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                    <div className="absolute -top-[50%] -right-[50%] w-[200%] h-[200%] bg-gradient-to-b from-white/10 via-white/5 to-transparent blur-[80px] transform -rotate-45 origin-bottom-left" />
                    <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[150%] bg-gradient-to-r from-transparent via-white/5 to-transparent blur-[40px] transform -rotate-[35deg]" />
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 mix-blend-overlay"></div>
                </div>

                {/* 2. Top Branding */}
                <div className="relative z-20 flex items-center gap-4">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <img src={logo} alt="Ambuj AI Logo" className="relative w-11 h-11 object-contain drop-shadow-2xl" />
                    </div>
                    <div>
                        <span className="block text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase mb-0.5">ARCHITECTED BY</span>
                        <span className="block text-sm font-bold tracking-widest text-white uppercase">Ambuj Kumar Tripathi</span>
                    </div>
                </div>

                {/* 3. Main Content */}
                <div className="relative z-10 flex-1 flex flex-col justify-center max-w-2xl pl-2 mt-8">

                    {/* Hero Title */}
                    <div className="mb-20">
                        <div className="inline-block px-3 py-1 rounded-full bg-white/10 border border-white/10 text-slate-300 text-[10px] font-bold tracking-widest uppercase mb-6 backdrop-blur-md">
                            Public Beta v1.0
                        </div>
                        <h1 className="font-serif-display text-6xl lg:text-7xl leading-[1.05] text-white mb-6 drop-shadow-2xl">
                            Citizen Safety & <br />
                            <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-slate-200 via-white to-slate-200">
                                Awareness AI
                            </span>
                        </h1>
                        <p className="text-xl text-slate-300 font-light max-w-lg leading-relaxed">
                            A sovereign AI infrastructure protecting digital identities and simplifying legal frameworks.
                        </p>
                    </div>

                    {/* Separator */}
                    <div className="w-20 h-px bg-slate-700 mb-12"></div>

                    {/* Pillars */}
                    <div className="grid gap-6">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Platform Capabilities</p>

                        {/* 1 */}
                        <div className="group flex items-center gap-6 p-4 -ml-4 rounded-2xl hover:bg-white/5 transition-all cursor-default border border-transparent hover:border-white/5">
                            <Shield className="w-6 h-6 text-white group-hover:text-blue-300 transition-colors" />
                            <div>
                                <h2 className="text-lg font-bold text-white mb-1">
                                    Cyber Fraud & Digital Arrest
                                </h2>
                                <p className="text-slate-400 text-sm font-light">
                                    Curated advisories on latest financial scams & safety protocols.
                                </p>
                            </div>
                        </div>

                        {/* 2 */}
                        <div className="group flex items-center gap-6 p-4 -ml-4 rounded-2xl hover:bg-white/5 transition-all cursor-default border border-transparent hover:border-white/5">
                            <Scale className="w-6 h-6 text-white group-hover:text-purple-300 transition-colors" />
                            <div>
                                <h2 className="text-lg font-bold text-white mb-1">
                                    Legal Protection (POSH Act)
                                </h2>
                                <p className="text-slate-400 text-sm font-light">
                                    Simplified knowledge base on Workplace Safety & POCSO.
                                </p>
                            </div>
                        </div>

                        {/* 3 */}
                        <div className="group flex items-center gap-6 p-4 -ml-4 rounded-2xl hover:bg-white/5 transition-all cursor-default border border-transparent hover:border-white/5">
                            <Lock className="w-6 h-6 text-white group-hover:text-green-300 transition-colors" />
                            <div>
                                <h2 className="text-lg font-bold text-white mb-1">
                                    Data Privacy & Security
                                </h2>
                                <p className="text-slate-400 text-sm font-light">
                                    Enterprise-grade PII masking & GDPR-compliant handling.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. Tech Stack MARQUEE - Adjusted Height & Padding */}
                <div className="relative z-10 w-full overflow-hidden mask-fade mt-auto pt-8 border-t border-white/10 pb-6">
                    <div className="flex justify-between items-end mb-6">
                        <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-semibold">Native AI Stack</p>
                    </div>

                    {/* Added 'py-2' to prevent clipping */}
                    <div className="flex whitespace-nowrap animate-scroll items-center gap-16 py-2">
                        <TechItem src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/1200px-React-icon.svg.png" label="React" />
                        <TechItem src="https://upload.wikimedia.org/wikipedia/commons/d/d5/Tailwind_CSS_Logo.svg" label="Tailwind" />
                        <TechItem src="https://fastapi.tiangolo.com/img/logo-margin/logo-teal.png" label="FastAPI" />
                        <TechItem src="https://cdn.worldvectorlogo.com/logos/mongodb-icon-1.svg" label="MongoDB" />
                        <TechItem emoji="🦜🔗" label="LangChain" />
                        <TechItem src="https://www.svgrepo.com/show/475656/google-color.svg" label="Gemini 2.0" />
                        <TechItem color="bg-purple-600" label="ChromaDB" />
                        <TechItem color="bg-black" label="Langfuse" />
                        {/* Dupes */}
                        <TechItem src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/1200px-React-icon.svg.png" label="React" />
                        <TechItem src="https://upload.wikimedia.org/wikipedia/commons/d/d5/Tailwind_CSS_Logo.svg" label="Tailwind" />
                        <TechItem src="https://fastapi.tiangolo.com/img/logo-margin/logo-teal.png" label="FastAPI" />
                        <TechItem src="https://cdn.worldvectorlogo.com/logos/mongodb-icon-1.svg" label="MongoDB" />
                        <TechItem emoji="🦜🔗" label="LangChain" />
                        <TechItem src="https://www.svgrepo.com/show/475656/google-color.svg" label="Gemini 2.0" />
                        <TechItem color="bg-purple-600" label="ChromaDB" />
                        <TechItem color="bg-black" label="Langfuse" />
                    </div>
                </div>
            </div>

            {/* ===== RIGHT SIDE (Clean Auth) ===== */}
            <div className="w-full lg:w-[40%] bg-white flex flex-col items-center relative shadow-2xl z-20 h-screen">

                {/* 1. Mobile Branding */}
                <div className="lg:hidden w-full flex justify-center py-8">
                    <img src={logo} alt="Logo" className="w-12 h-12" />
                </div>

                {/* 2. Login Form (Centered Vertically) */}
                <div className="flex-1 flex flex-col justify-center w-full max-w-[360px] px-4">
                    <div className="text-center mb-12">
                        <h2 className="font-serif-display text-4xl text-slate-900 mb-3">
                            Welcome Back
                        </h2>
                        <p className="text-slate-500 text-sm font-light">
                            Sign in to access your dashboard
                        </p>
                    </div>

                    <div className="space-y-4">
                        <button
                            onClick={handleGoogleLogin}
                            className="w-full h-12 bg-[#1a1f36] text-white flex items-center justify-center gap-3 transition-all hover:bg-[#2e354f] shadow-lg shadow-slate-200 rounded-lg group"
                        >
                            <svg className="w-5 h-5 bg-white rounded-full p-1 box-content group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            <span className="font-medium tracking-wide text-sm">Sign in with Google</span>
                        </button>

                        <button
                            onClick={handleGitHubLogin}
                            className="w-full h-12 bg-white border border-slate-200 text-slate-800 flex items-center justify-center gap-3 transition-all hover:bg-slate-50 rounded-lg"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                            </svg>
                            <span className="font-medium tracking-wide text-sm">Sign in with GitHub</span>
                        </button>
                    </div>

                    <div className="mt-8 text-center">
                        <p className="text-xs text-slate-500 font-semibold tracking-widest uppercase">
                            Secured by OAuth 2.0
                        </p>
                    </div>
                </div>

                {/* 3. Footer (Copyright) - Fixed at Bottom */}
                <div className="w-full text-center py-6 text-xs text-slate-400 font-medium border-t border-slate-100/50">
                    &copy; 2026 Ambuj Kumar Tripathi. All rights reserved.
                </div>
            </div>
        </div>
    );
};

// Helper for Marquee Item
const TechItem = ({ src, emoji, color, label }) => (
    <div className="flex items-center gap-3 px-6 filter group hover:brightness-125 transition-all">
        {src ? (
            <img src={src} className="h-7 w-auto object-contain" alt={label} />
        ) : emoji ? (
            <span className="text-2xl">{emoji}</span>
        ) : (
            <div className={`h-6 w-6 rounded-md ${color} flex items-center justify-center text-[8px] text-white font-bold`}>
                {label[0]}
            </div>
        )}
        <span className="text-sm font-semibold text-slate-400 group-hover:text-blue-200 transition-colors">{label}</span>
    </div>
);

export default Login;
