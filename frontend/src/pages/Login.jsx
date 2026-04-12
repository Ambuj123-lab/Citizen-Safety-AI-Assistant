import { Shield, Lock, Scale, ArrowRight, Zap, Database, Eye } from 'lucide-react';
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

            {/* Inline Styles */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

                .hero-gradient {
                    background: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(6,182,212,0.08), transparent),
                                radial-gradient(ellipse 60% 40% at 80% 60%, rgba(59,130,246,0.04), transparent);
                }
                .text-gradient-hero {
                    background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 30%, #06b6d4 70%, #0891b2 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                .btn-shine {
                    position: relative;
                    overflow: hidden;
                }
                .btn-shine::after {
                    content: '';
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: linear-gradient(transparent, rgba(255,255,255,0.03), transparent);
                    transform: rotate(45deg);
                    animation: shine 4s ease-in-out infinite;
                }
                @keyframes shine {
                    0%, 100% { transform: translateX(-100%) rotate(45deg); }
                    50% { transform: translateX(100%) rotate(45deg); }
                }
                .noise-overlay {
                    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.02'/%3E%3C/svg%3E");
                }
            `}</style>

            {/* ===== LEFT — Cinematic Panel ===== */}
            <div className="hidden lg:flex w-[58%] relative flex-col text-white overflow-hidden bg-[#020617] hero-gradient h-screen">

                {/* Ambient Light Effects */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan-500/[0.03] rounded-full blur-[120px]" />
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/[0.02] rounded-full blur-[100px]" />
                    <div className="absolute inset-0 noise-overlay opacity-30" />
                </div>

                {/* Content Container */}
                <div className="relative z-10 flex flex-col h-full p-12 lg:p-16">

                    {/* Brand Header */}
                    <div className="flex items-center gap-4 animate-fade-in-down">
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <img src={logo} alt="Logo" className="relative w-10 h-10 object-contain" />
                        </div>
                        <div>
                            <span className="block text-[9px] font-semibold tracking-[0.2em] text-slate-500 uppercase">Architected by</span>
                            <span className="block text-sm font-bold tracking-wide text-white/90">Ambuj Kumar Tripathi</span>
                        </div>
                    </div>

                    {/* Hero Content */}
                    <div className="flex-1 flex flex-col justify-center max-w-2xl mt-4">

                        {/* Status Badge */}
                        <div className="animate-fade-in-up mb-8" style={{ animationDelay: '100ms' }}>
                            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.06] text-[10px] font-medium text-slate-400 tracking-wider uppercase backdrop-blur-sm">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                </span>
                                System Active — Agentic RAG v1.0
                            </div>
                        </div>

                        {/* Main Title */}
                        <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                            <h1 className="text-5xl lg:text-[4.25rem] font-black leading-[1.05] tracking-tight text-white mb-6">
                                Citizen Safety &{' '}
                                <span className="text-gradient-hero">
                                    Awareness AI
                                </span>
                            </h1>
                        </div>

                        <div className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                            <p className="text-base text-slate-400 max-w-lg leading-relaxed font-normal mb-12">
                                AI-powered legal intelligence covering the Constitution of India, BNS, Motor Vehicles Act, and citizen rights. Built with enterprise-grade PII protection and deterministic citations.
                            </p>
                        </div>

                        {/* Separator */}
                        <div className="w-16 h-px bg-gradient-to-r from-slate-700 to-transparent mb-10 animate-fade-in-up" style={{ animationDelay: '350ms' }} />

                        {/* Capability Cards */}
                        <div className="space-y-3 mb-12">
                            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.15em] mb-4 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                                Core Capabilities
                            </p>

                            {[
                                { icon: Shield, title: 'Cyber Fraud & Digital Arrest', desc: 'Real-time advisories on financial scams & safety protocols', delay: '450ms' },
                                { icon: Scale, title: 'Legal Framework Intelligence', desc: 'BNS, POSH, POCSO, Consumer Protection — simplified', delay: '500ms' },
                                { icon: Lock, title: 'Privacy-First Architecture', desc: 'Microsoft Presidio PII masking, GDPR-compliant data handling', delay: '550ms' },
                            ].map(({ icon: Icon, title, desc, delay }) => (
                                <div key={title} className="group flex items-center gap-5 p-4 -ml-2 rounded-xl hover:bg-white/[0.02] transition-all duration-300 cursor-default animate-fade-in-up" style={{ animationDelay: delay }}>
                                    <div className="w-10 h-10 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center flex-shrink-0 group-hover:border-cyan-500/20 transition-colors">
                                        <Icon className="w-[18px] h-[18px] text-slate-400 group-hover:text-cyan-400 transition-colors" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-white/90 mb-0.5">{title}</h3>
                                        <p className="text-xs text-slate-500 font-normal">{desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Tech Stack Marquee */}
                    <div className="border-t border-white/[0.04] pt-6 animate-fade-in-up" style={{ animationDelay: '650ms' }}>
                        <p className="text-[9px] text-slate-600 uppercase tracking-[0.2em] font-medium mb-4">Production Stack</p>
                        <div className="overflow-hidden mask-fade-x">
                            <div className="flex whitespace-nowrap animate-marquee items-center gap-10">
                                {[
                                    'React 19', 'FastAPI', 'Pinecone', 'Jina Embeddings',
                                    'LangChain', 'Qwen3 235B', 'MongoDB Atlas', 'Upstash Redis',
                                    'Microsoft Presidio', 'Langfuse', 'Google OAuth',
                                    'React 19', 'FastAPI', 'Pinecone', 'Jina Embeddings',
                                    'LangChain', 'Qwen3 235B', 'MongoDB Atlas', 'Upstash Redis',
                                    'Microsoft Presidio', 'Langfuse', 'Google OAuth',
                                ].map((tech, i) => (
                                    <span key={i} className="text-[11px] font-medium text-slate-600 hover:text-slate-400 transition-colors flex-shrink-0 cursor-default">
                                        {tech}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ===== RIGHT — Authentication Panel ===== */}
            <div className="w-full lg:w-[42%] bg-white flex flex-col items-center relative z-20 h-screen">

                {/* Mobile Brand */}
                <div className="lg:hidden w-full flex flex-col items-center pt-10 pb-6 px-6">
                    <img src={logo} alt="Logo" className="w-12 h-12 mb-3" />
                    <h2 className="text-xl font-bold text-slate-900 text-center">Citizen Safety AI</h2>
                    <p className="text-xs text-slate-500 mt-1">by Ambuj Kumar Tripathi</p>
                </div>

                {/* Auth Form — Centered */}
                <div className="flex-1 flex flex-col justify-center w-full max-w-[380px] px-6">

                    <div className="text-center mb-10">
                        <div className="hidden lg:flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 mx-auto mb-6">
                            <Shield className="w-6 h-6 text-slate-700" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
                            Welcome back
                        </h2>
                        <p className="text-sm text-slate-500 font-normal">
                            Sign in to access your dashboard
                        </p>
                    </div>

                    <div className="space-y-3">
                        {/* Google Button */}
                        <button
                            onClick={handleGoogleLogin}
                            className="w-full h-[52px] bg-slate-900 text-white flex items-center justify-center gap-3 rounded-xl hover:bg-slate-800 transition-all duration-200 group shadow-sm"
                        >
                            <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            <span className="font-medium text-sm tracking-wide">Sign in with Google</span>
                        </button>

                        {/* GitHub Button */}
                        <button
                            onClick={handleGitHubLogin}
                            className="w-full h-[52px] bg-white border border-slate-200 text-slate-700 flex items-center justify-center gap-3 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                            </svg>
                            <span className="font-medium text-sm tracking-wide">Sign in with GitHub</span>
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-3 my-8">
                        <div className="flex-1 h-px bg-slate-100" />
                        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Secured by OAuth 2.0</span>
                        <div className="flex-1 h-px bg-slate-100" />
                    </div>

                    {/* Trust Indicators */}
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { icon: Lock, label: 'PII Masking' },
                            { icon: Database, label: 'Encrypted' },
                            { icon: Eye, label: 'GDPR Ready' },
                        ].map(({ icon: Icon, label }) => (
                            <div key={label} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                <Icon className="w-4 h-4 text-slate-400" />
                                <span className="text-[9px] font-medium text-slate-500 uppercase tracking-wider">{label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="w-full text-center py-5 text-[11px] text-slate-400 font-normal border-t border-slate-100">
                    &copy; 2026 Ambuj Kumar Tripathi. All rights reserved.
                </div>
            </div>
        </div>
    );
};

export default Login;
