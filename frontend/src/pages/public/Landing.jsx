import { Link } from 'react-router-dom';
import PublicLayout from '../../components/public/PublicLayout';
import { OrbitingCircles } from '../../components/ui/OrbitingCircles';

const Icons = {
    gitHub: () => (
        <svg width="100%" height="100%" viewBox="0 0 438.549 438.549">
            <path fill="currentColor" d="M409.132 114.573c-19.608-33.596-46.205-60.194-79.798-79.8-33.598-19.607-70.277-29.408-110.063-29.408-39.781 0-76.472 9.804-110.063 29.408-33.596 19.605-60.192 46.204-79.8 79.8C9.803 148.168 0 184.854 0 224.63c0 47.78 13.94 90.745 41.827 128.906 27.884 38.164 63.906 64.572 108.063 79.227 5.14.954 8.945.283 11.419-1.996 2.475-2.282 3.711-5.14 3.711-8.562 0-.571-.049-5.708-.144-15.417a2549.81 2549.81 0 01-.144-25.406l-6.567 1.136c-4.187.767-9.469 1.092-15.846 1-6.374-.089-12.991-.757-19.842-1.999-6.854-1.231-13.229-4.086-19.13-8.559-5.898-4.473-10.085-10.328-12.56-17.556l-2.855-6.57c-1.903-4.374-4.899-9.233-8.992-14.559-4.093-5.331-8.232-8.945-12.419-10.848l-1.999-1.431c-1.332-.951-2.568-2.098-3.711-3.429-1.142-1.331-1.997-2.663-2.568-3.997-.572-1.335-.098-2.43 1.427-3.289 1.525-.859 4.281-1.276 8.28-1.276l5.708.853c3.807.763 8.516 3.042 14.133 6.851 5.614 3.806 10.229 8.754 13.846 14.842 4.38 7.806 9.657 13.754 15.846 17.847 6.184 4.093 12.419 6.136 18.699 6.136 6.28 0 11.704-.476 16.274-1.423 4.565-.952 8.848-2.383 12.847-4.285 1.713-12.758 6.377-22.559 13.988-29.41-10.848-1.14-20.601-2.857-29.264-5.14-8.658-2.286-17.605-5.996-26.835-11.14-9.235-5.137-16.896-11.516-22.985-19.126-6.09-7.614-11.088-17.61-14.987-29.979-3.901-12.374-5.852-26.648-5.852-42.826 0-23.035 7.52-42.637 22.557-58.817-7.044-17.318-6.379-36.732 1.997-58.24 5.52-1.715 13.706-.428 24.554 3.853 10.85 4.283 18.794 7.952 23.84 10.994 5.046 3.041 9.089 5.618 12.135 7.708 17.705-4.947 35.976-7.421 54.818-7.421s37.117 2.474 54.823 7.421l10.849-6.849c7.419-4.57 16.18-8.758 26.262-12.565 10.088-3.805 17.802-4.853 23.134-3.138 8.562 21.509 9.325 40.922 2.279 58.24 15.036 16.18 22.559 35.787 22.559 58.817 0 16.178-1.958 30.497-5.853 42.966-3.9 12.471-8.941 22.457-15.125 29.979-6.191 7.521-13.901 13.85-23.131 18.986-9.232 5.14-18.182 8.85-26.84 11.136-8.662 2.286-18.415 4.004-29.263 5.146 9.894 8.562 14.842 22.077 14.842 40.539v60.237c0 3.422 1.19 6.279 3.572 8.562 2.379 2.279 6.136 2.95 11.276 1.995 44.163-14.653 80.185-41.062 108.068-79.226 27.88-38.161 41.825-81.126 41.825-128.906-.01-39.771-9.818-76.454-29.414-110.049z" />
        </svg>
    ),
    notion: () => (
        <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6.017 4.313l55.333 -4.087c6.797 -0.583 8.543 -0.19 12.817 2.917l17.663 12.443c2.913 2.14 3.883 2.723 3.883 5.053v68.243c0 4.277 -1.553 6.807 -6.99 7.193L24.467 99.967c-4.08 0.193 -6.023 -0.39 -8.16 -3.113L3.3 79.94c-2.333 -3.113 -3.3 -5.443 -3.3 -8.167V11.113c0 -3.497 1.553 -6.413 6.017 -6.8z" fill="#ffffff" />
            <path d="M61.35 0.227l-55.333 4.087C1.553 4.7 0 7.617 0 11.113v60.66c0 2.723 0.967 5.053 3.3 8.167l13.007 16.913c2.137 2.723 4.08 3.307 8.16 3.113l64.257 -3.89c5.433 -0.387 6.99 -2.917 6.99 -7.193V20.64c0 -2.21 -0.873 -2.847 -3.443 -4.733L74.167 3.143c-4.273 -3.107 -6.02 -3.5 -12.817 -2.917zM25.92 19.523c-5.247 0.353 -6.437 0.433 -9.417 -1.99L8.927 11.507c-0.77 -0.78 -0.383 -1.753 1.557 -1.947l53.193 -3.887c4.467 -0.39 6.793 1.167 8.54 2.527l9.123 6.61c0.39 0.197 1.36 1.36 0.193 1.36l-54.933 3.307 -0.68 0.047zM19.803 88.3V30.367c0 -2.53 0.777 -3.697 3.103 -3.893L86 22.78c2.14 -0.193 3.107 1.167 3.107 3.693v57.547c0 2.53 -0.39 4.67 -3.883 4.863l-60.377 3.5c-3.493 0.193 -5.043 -0.97 -5.043 -4.083zm59.6 -54.827c0.387 1.75 0 3.5 -1.75 3.7l-2.91 0.577v42.773c-2.527 1.36 -4.853 2.137 -6.797 2.137 -3.107 0 -3.883 -0.973 -6.21 -3.887l-19.03 -29.94v28.967l6.02 1.363s0 3.5 -4.857 3.5l-13.39 0.777c-0.39 -0.78 0 -2.723 1.357 -3.11l3.497 -0.97v-38.3L30.48 40.667c-0.39 -1.75 0.58 -4.277 3.3 -4.473l14.367 -0.967 19.8 30.327v-26.83l-5.047 -0.58c-0.39 -2.143 1.163 -3.7 3.103 -3.89l13.4 -0.78z" fill="#000000" fillRule="evenodd" clipRule="evenodd" />
        </svg>
    ),
    openai: () => (
        <svg width="100%" height="100%" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="fill-black dark:fill-white">
            <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
        </svg>
    ),
    googleDrive: () => (
        <svg width="100%" height="100%" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
            <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da" />
            <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47" />
            <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335" />
            <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d" />
            <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc" />
            <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00" />
        </svg>
    ),
    whatsapp: () => (
        <svg width="100%" height="100%" viewBox="0 0 175.216 175.552" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="b" x1="85.915" x2="86.535" y1="32.567" y2="137.092" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="#57d163" />
                    <stop offset="1" stopColor="#23b33a" />
                </linearGradient>
                <filter id="a" width="1.115" height="1.114" x="-.057" y="-.057" colorInterpolationFilters="sRGB">
                    <feGaussianBlur stdDeviation="3.531" />
                </filter>
            </defs>
            <path d="m54.532 138.45 2.235 1.324c9.387 5.571 20.15 8.518 31.126 8.523h.023c33.707 0 61.139-27.426 61.153-61.135.006-16.335-6.349-31.696-17.895-43.251A60.75 60.75 0 0 0 87.94 25.983c-33.733 0-61.166 27.423-61.178 61.13a60.98 60.98 0 0 0 9.349 32.535l1.455 2.312-6.179 22.558zm-40.811 23.544L24.16 123.88c-6.438-11.154-9.825-23.808-9.821-36.772.017-40.556 33.021-73.55 73.578-73.55 19.681.01 38.154 7.669 52.047 21.572s21.537 32.383 21.53 52.037c-.018 40.553-33.027 73.553-73.578 73.553h-.032c-12.313-.005-24.412-3.094-35.159-8.954zm0 0" fill="#b3b3b3" filter="url(#a)" />
            <path d="m12.966 161.238 10.439-38.114a73.42 73.42 0 0 1-9.821-36.772c.017-40.556 33.021-73.55 73.578-73.55 19.681.01 38.154 7.669 52.047 21.572s21.537 32.383 21.53 52.037c-.018 40.553-33.027 73.553-73.578 73.553h-.032c-12.313-.005-24.412-3.094-35.159-8.954z" fill="#ffffff" />
            <path d="M87.184 25.227c-33.733 0-61.166 27.423-61.178 61.13a60.98 60.98 0 0 0 9.349 32.535l1.455 2.312-6.179 22.559 23.146-6.069 2.235 1.324c9.387 5.571 20.15 8.518 31.126 8.524h.023c33.707 0 61.14-27.426 61.153-61.135a60.75 60.75 0 0 0-17.895-43.251 60.75 60.75 0 0 0-43.235-17.929z" fill="url(#linearGradient1780)" />
            <path d="M87.184 25.227c-33.733 0-61.166 27.423-61.178 61.13a60.98 60.98 0 0 0 9.349 32.535l1.455 2.313-6.179 22.558 23.146-6.069 2.235 1.324c9.387 5.571 20.15 8.517 31.126 8.523h.023c33.707 0 61.14-27.426 61.153-61.135a60.75 60.75 0 0 0-17.895-43.251 60.75 60.75 0 0 0-43.235-17.928z" fill="url(#b)" />
            <path d="M68.772 55.603c-1.378-3.061-2.828-3.123-4.137-3.176l-3.524-.043c-1.226 0-3.218.46-4.902 2.3s-6.435 6.287-6.435 15.332 6.588 17.785 7.506 19.013 12.718 20.381 31.405 27.75c15.529 6.124 18.689 4.906 22.061 4.6s10.877-4.447 12.408-8.74 1.532-7.971 1.073-8.74-1.685-1.226-3.525-2.146-10.877-5.367-12.562-5.981-2.91-.919-4.137.921-4.746 5.979-5.819 7.206-2.144 1.381-3.984.462-7.76-2.861-14.784-9.124c-5.465-4.873-9.154-10.891-10.228-12.73s-.114-2.835.808-3.751c.825-.824 1.838-2.147 2.759-3.22s1.224-1.84 1.836-3.065.307-2.301-.153-3.22-4.032-10.011-5.666-13.647" fill="#ffffff" fillRule="evenodd" />
        </svg>
    ),
};

const logos = [
    { name: 'Notion', url: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png' },
    { name: 'Supabase', url: 'https://supabase.com/_next/image?url=https%3A%2F%2Favatars.githubusercontent.com%2Fu%2F54469296%3Fs%3D200%26v%3D4&w=256&q=75' },
    { name: 'HubSpot', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/HubSpot_Logo.png/800px-HubSpot_Logo.png' },
    { name: 'Zapier', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Zapier_logo.png/800px-Zapier_logo.png' },
    { name: 'n8n', url: 'https://n8n.io/n8n-logo.png' },
    { name: 'WhatsApp', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/512px-WhatsApp.svg.png' },
    { name: 'Meta', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Meta_Platforms_Inc._logo.svg/512px-Meta_Platforms_Inc._logo.svg.png' },
    { name: 'Shopify', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Shopify_logo_2018.svg/512px-Shopify_logo_2018.svg.png' },
    { name: 'GitHub', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Octicons-mark-github.svg/512px-Octicons-mark-github.svg.png' },
];

export default function Landing() {
    return (
        <PublicLayout>
            {/* Hero Section */}
            <section className="relative pt-20 pb-32 overflow-hidden">
                {/* Abstract Background Elements */}
                <div className="absolute top-0 left-1/2 w-full max-w-5xl -translate-x-1/2 h-[500px] bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-transparent blur-[120px] rounded-full pointer-events-none -z-10"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md">
                        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-sm font-medium text-zinc-300">ValueWats Platform v2.0 is Live</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-8 leading-[1.1]">
                        Enterprise WhatsApp
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                            Automation & Agentic AI
                        </span>
                    </h1>

                    <p className="mt-6 text-xl text-zinc-400 max-w-3xl mx-auto mb-10 leading-relaxed">
                        Unify your communications, trigger powerful no-code workflows, and deploy intelligent AI agents that handle sales and support on autopilot. All inside one centralized platform.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            to="/register"
                            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white text-black font-bold text-lg hover:bg-zinc-200 transition-all shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:shadow-[0_0_60px_rgba(255,255,255,0.25)] hover:-translate-y-1"
                        >
                            Start for Free
                        </Link>
                        <Link
                            to="/contact"
                            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/5 text-white font-bold text-lg border border-white/10 hover:bg-white/10 transition-all"
                        >
                            Book a Demo
                        </Link>
                    </div>
                </div>
            </section>

            {/* Interactive Video Tour */}
            <section className="relative px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto -mt-10 mb-20 z-20">
                <div className="rounded-2xl border border-white/10 bg-black/50 overflow-hidden shadow-2xl backdrop-blur-xl group cursor-pointer relative aspect-video flex items-center justify-center transition-transform hover:scale-[1.01] duration-500">
                    <video
                        className="w-full h-full object-cover"
                        src="/Seraphina Room 0304.mp4"
                        controls
                        playsInline
                        disablePictureInPicture
                    />
                    <div className="absolute inset-0 bg-indigo-500/10 group-hover:bg-indigo-500/0 transition-colors flex flex-col items-center justify-center z-10 pointer-events-none">
                        {/* Optional overlay play button or text can go here if needed, but video auto-plays */}
                    </div>
                </div>
            </section>

            {/* 3 Pillars Strategy */}
            <section className="py-24 relative bg-[#0a0a0c]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Conversation-Led Growth</h2>
                        <p className="text-lg text-zinc-400 max-w-2xl mx-auto">Turn conversations into revenue across the entire customer lifecycle.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Capture */}
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:bg-white/[0.07] transition-colors relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-[50px] rounded-full p-4"></div>
                            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-6 text-blue-400">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-3">1. Capture</h3>
                            <p className="text-zinc-400 leading-relaxed">Generate more leads from every channel. Use WhatsApp widgets, QR codes, and click-to-chat links to ingest prospects instantly.</p>
                        </div>

                        {/* Convert */}
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:bg-white/[0.07] transition-colors relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 blur-[50px] rounded-full p-4"></div>
                            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-6 text-purple-400">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-3">2. Convert</h3>
                            <p className="text-zinc-400 leading-relaxed">Qualify and route leads at lightning speed using AI agents and visual workflows. Close deals faster in a shared team inbox.</p>
                        </div>

                        {/* Retain */}
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:bg-white/[0.07] transition-colors relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 blur-[50px] rounded-full p-4"></div>
                            <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center mb-6 text-emerald-400">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-3">3. Retain</h3>
                            <p className="text-zinc-400 leading-relaxed">Build loyalty with automated updates, proactive outreach, and 24/7 AI-driven support that resolves tickets instantly.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ROI Metrics */}
            <section className="py-20 border-y border-white/5 bg-[#0d0d0f]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-white/5">
                        <div className="text-center px-4">
                            <p className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 mb-2">3x</p>
                            <p className="text-zinc-400 font-medium">Higher Conversion</p>
                        </div>
                        <div className="text-center px-4">
                            <p className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 mb-2">60%</p>
                            <p className="text-zinc-400 font-medium">Faster Resolutions</p>
                        </div>
                        <div className="text-center px-4">
                            <p className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">40+</p>
                            <p className="text-zinc-400 font-medium">Hours Saved/Wk</p>
                        </div>
                        <div className="text-center px-4">
                            <p className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400 mb-2">24/7</p>
                            <p className="text-zinc-400 font-medium">AI Support</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Marquee Logos */}
            <section className="pt-20 pb-32 border-y border-white/5 bg-[#0d0d0f] overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10 text-center">
                    <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Connects seamlessly with your favorite tools</p>
                </div>

                {/* Infinite Scroll Carousel mapping */}
                <div className="relative flex overflow-x-hidden group">
                    <div className="animate-marquee whitespace-nowrap flex items-center gap-16 py-4 px-8">
                        {logos.map((logo, idx) => (
                            <div key={idx} className="flex items-center justify-center grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                                <img src={logo.url} alt={logo.name} className="h-10 object-contain max-w-[140px]" />
                            </div>
                        ))}
                        {/* Duplicate for infinite effect */}
                        {logos.map((logo, idx) => (
                            <div key={`dup-${idx}`} className="flex items-center justify-center grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                                <img src={logo.url} alt={logo.name} className="h-10 object-contain max-w-[140px]" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Social Proof Badges */}
            <section className="py-20 border-y border-white/5 bg-[#0a0a0c]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Recognized as an Industry Leader</h2>
                        <p className="text-zinc-500">Trusted by modern teams worldwide.</p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-80">
                        <div className="flex flex-col items-center">
                            <div className="w-24 h-32 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-t-full rounded-b-xl border border-orange-500/30 flex items-center justify-center text-white font-bold text-xl mb-3 shadow-[0_0_20px_rgba(249,115,22,0.1)] backdrop-blur-sm relative overflow-hidden">
                                <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-orange-500/40 to-transparent"></div>
                                <span className="relative z-10 text-orange-400">G2</span>
                            </div>
                            <span className="text-xs text-zinc-400 uppercase tracking-widest font-bold">High Performer</span>
                            <span className="text-xs text-zinc-500">Spring 2026</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-24 h-32 bg-gradient-to-br from-indigo-500/20 to-blue-500/20 rounded-t-full rounded-b-xl border border-indigo-500/30 flex flex-col items-center justify-center text-white font-bold text-lg mb-3 shadow-[0_0_20px_rgba(99,102,241,0.1)] backdrop-blur-sm relative overflow-hidden">
                                <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-indigo-500/40 to-transparent"></div>
                                <span className="relative z-10 text-xs text-indigo-300">Leader</span>
                                <span className="relative z-10 text-indigo-400">CRM</span>
                            </div>
                            <span className="text-xs text-zinc-400 uppercase tracking-widest font-bold">Leader</span>
                            <span className="text-xs text-zinc-500">Spring 2026</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-24 h-32 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-t-full rounded-b-xl border border-emerald-500/30 flex items-center justify-center text-white font-bold text-center leading-tight p-2 mb-3 shadow-[0_0_20px_rgba(16,185,129,0.1)] backdrop-blur-sm relative overflow-hidden">
                                <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-emerald-500/40 to-transparent"></div>
                                <span className="relative z-10 text-emerald-400 text-sm">Users<br />Love Us</span>
                            </div>
                            <span className="text-xs text-zinc-400 uppercase tracking-widest font-bold">Customer Choice</span>
                            <span className="text-xs text-zinc-500">2026</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-24 h-32 bg-gradient-to-br from-pink-500/20 to-rose-500/20 rounded-t-full rounded-b-xl border border-pink-500/30 flex items-center justify-center text-white font-bold text-center leading-tight p-2 mb-3 shadow-[0_0_20px_rgba(244,63,94,0.1)] backdrop-blur-sm relative overflow-hidden">
                                <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-pink-500/40 to-transparent"></div>
                                <span className="relative z-10 text-pink-400 text-sm">Best<br />Support</span>
                            </div>
                            <span className="text-xs text-zinc-400 uppercase tracking-widest font-bold">Best Support</span>
                            <span className="text-xs text-zinc-500">Winter 2026</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Unified Omnichannel Inbox Visualization */}
            <section className="py-32 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div className="order-2 lg:order-1 relative">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-transparent blur-[80px] rounded-full pointer-events-none -z-10"></div>

                            <div className="relative h-[400px] w-full rounded-2xl border border-white/10 bg-[#0a0a0c] overflow-hidden shadow-2xl flex items-center p-8">
                                {/* Left side: Channels */}
                                <div className="flex flex-col gap-4 w-1/3 z-10">
                                    <div className="bg-[#111116] border border-white/5 p-3 rounded-lg flex items-center gap-3 animate-[pulse_3s_ease-in-out_infinite]">
                                        <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" /></svg>
                                        <span className="text-sm font-medium text-white">WhatsApp</span>
                                    </div>
                                    <div className="bg-[#111116] border border-white/5 p-3 rounded-lg flex items-center gap-3 animate-[pulse_3s_ease-in-out_infinite_500ms]">
                                        <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.898 1.498 5.485 3.824 7.151-.157 1.488-.707 3.03-2.181 4.545 1.554 0 3.031-.15 4.383-.448C9.284 23.361 10.603 23.516 12 23.516c5.523 0 10-4.145 10-9.258S17.523 2 12 2zm1.758 13.064l-2.098-2.227-4.045 2.227 4.441-4.717 2.142 2.227 3.999-2.227-4.439 4.717z" /></svg>
                                        <span className="text-sm font-medium text-white">Messenger</span>
                                    </div>
                                    <div className="bg-[#111116] border border-white/5 p-3 rounded-lg flex items-center gap-3 animate-[pulse_3s_ease-in-out_infinite_1000ms]">
                                        <svg className="w-5 h-5 text-pink-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" /></svg>
                                        <span className="text-sm font-medium text-white">Instagram</span>
                                    </div>
                                </div>

                                {/* Connection Lines */}
                                <div className="absolute inset-0 flex items-center justify-center p-8 pointer-events-none">
                                    <svg className="w-full h-full stroke-white/20" fill="none">
                                        <path d="M 33% 25% C 50% 25%, 50% 50%, 66% 50%" strokeWidth="2" strokeDasharray="4 4" className="animate-[dash_20s_linear_infinite]" />
                                        <path d="M 33% 50% C 50% 50%, 50% 50%, 66% 50%" strokeWidth="2" strokeDasharray="4 4" className="animate-[dash_20s_linear_infinite]" />
                                        <path d="M 33% 75% C 50% 75%, 50% 50%, 66% 50%" strokeWidth="2" strokeDasharray="4 4" className="animate-[dash_20s_linear_infinite]" />
                                    </svg>
                                </div>

                                {/* Right side: Unified Inbox */}
                                <div className="flex-1 bg-white/[0.03] backdrop-blur-md border border-white/5 rounded-xl h-full p-4 flex flex-col shadow-inner z-10 ml-8">
                                    <div className="border-b border-white/5 pb-3 mb-3 flex items-center gap-3">
                                        <span className="font-bold text-white">Unified Inbox</span>
                                        <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-semibold uppercase tracking-wider">Live</span>
                                    </div>
                                    <div className="flex-1 flex flex-col gap-3">
                                        {/* Mock Messages */}
                                        <div className="flex gap-3">
                                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 text-xs font-bold">W</div>
                                            <div className="bg-white/5 rounded-r-xl rounded-bl-xl p-3 text-sm text-zinc-300">I need help with my order #12345.</div>
                                        </div>
                                        <div className="flex gap-3 self-end flex-row-reverse">
                                            <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 text-xs font-bold">AI</div>
                                            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-l-xl rounded-br-xl p-3 text-sm text-indigo-200">Hello! I've located your order. It is currently in transit and will arrive tomorrow by 5 PM.</div>
                                        </div>
                                        <div className="flex gap-3 mt-auto opacity-50">
                                            <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 text-xs font-bold">M</div>
                                            <div className="bg-white/5 rounded-r-xl rounded-bl-xl p-3 text-sm text-zinc-300">Is this item in stock?</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="order-1 lg:order-2">
                            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">One Inbox. <br />Every Channel.</h2>
                            <p className="text-lg text-zinc-400 mb-8 leading-relaxed">
                                Stop switching tabs. ValueWats brings WhatsApp, Instagram, Messenger, and more into a single, collaborative workspace.
                                Equip your team with customer context from your CRM, auto-assign conversations, and resolve issues faster.
                            </p>
                            <ul className="space-y-4">
                                {['Unified Omnichannel Context', 'AI-Assisted Drafting', 'Internal Team Collaboration', 'CRM Data Syncing'].map((feature, idx) => (
                                    <li key={idx} className="flex items-center gap-3 text-zinc-300 font-medium">
                                        <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                        </div>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                <style dangerouslySetInnerHTML={{
                    __html: `
                    @keyframes dash {
                      to {
                        stroke-dashoffset: -1000;
                      }
                    }
                  `}} />
            </section>

            {/* Features Bento Grid */}
            <section id="features" className="py-32 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-20">
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Built for scale. Designed for speed.</h2>
                        <p className="text-lg text-zinc-400 max-w-2xl mx-auto">Everything you need to manage thousands of conversations without dropping the ball.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Row 1: Agentic AI Workflows (col-2) + Smart Inbox (col-1) */}
                        <div className="md:col-span-2 bg-[#0f0f12] border border-white/10 rounded-3xl p-10 flex flex-col md:flex-row gap-8 relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[80px] rounded-full group-hover:bg-indigo-500/30 transition-colors pointer-events-none"></div>
                            <div className="md:w-1/2 flex flex-col justify-center">
                                <h3 className="text-2xl font-bold text-white mb-4 relative z-10">Agentic AI Workflows</h3>
                                <p className="text-zinc-400 leading-relaxed mb-8 relative z-10">Train AI models on your own knowledge base to handle customer queries, qualify leads, and close tickets entirely autonomously.</p>
                            </div>
                            <div className="md:w-1/2 relative rounded-xl overflow-hidden border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] group-hover:scale-[1.02] transition-transform duration-500 group-hover:shadow-indigo-500/20 mt-8 md:mt-0">
                                <img src="/neural-lab-page.png" alt="Neural Lab AI" className="w-full h-full object-cover object-left-top opacity-80 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-3xl p-10 flex flex-col justify-between relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-4 z-10 relative">Smart Inbox</h3>
                                <p className="text-zinc-400 leading-relaxed mb-8 z-10 relative">A collaborative workspace to manage WhatsApp threads as a team. Tag, assign, and resolve seamlessly.</p>
                            </div>
                            <div className="mt-auto relative rounded-xl overflow-hidden border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] group-hover:scale-[1.03] transition-transform duration-500 group-hover:shadow-indigo-500/20">
                                <img src="/contacts-page.png" alt="Smart Inbox" className="w-full h-auto object-cover object-top opacity-80 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </div>

                        {/* Row 2: Visual Automations (col-1) + Powerful Dashboard (col-2) */}
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-10 flex flex-col justify-between relative overflow-hidden group hover:border-purple-500/30 transition-colors">
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-4 z-10 relative">Visual Automations</h3>
                                <p className="text-zinc-400 leading-relaxed mb-8 z-10 relative">Build complex AI workflows and agents. React to triggers, send templates, and sync with your CRM without coding.</p>
                            </div>
                            <div className="mt-auto relative rounded-xl overflow-hidden border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] group-hover:scale-[1.03] transition-transform duration-500 group-hover:shadow-purple-500/20">
                                <img src="/Automations-page.png" alt="Visual Automations & AI" className="w-full h-auto object-cover object-left-top opacity-80 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </div>

                        <div className="md:col-span-2 bg-[#0f0f12] border border-white/10 rounded-3xl p-10 flex flex-col md:flex-row gap-8 relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
                            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-emerald-500/10 to-transparent blur-[50px] pointer-events-none text-emerald-500/30 group-hover:text-emerald-500/40"></div>
                            <div className="md:w-1/2 flex flex-col justify-center">
                                <h3 className="text-2xl font-bold text-white mb-4 relative z-10">Powerful Dashboard & Analytics</h3>
                                <p className="text-zinc-400 leading-relaxed relative z-10">Get a bird's eye view of your entire operation. Track campaign deliveries, AI performance, and team metrics in real-time.</p>
                            </div>
                            <div className="md:w-1/2 relative rounded-xl overflow-hidden border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] group-hover:scale-[1.02] transition-transform duration-500 group-hover:shadow-emerald-500/20 mt-8 md:mt-0">
                                <img src="/dashboard.png" alt="Analytics Dashboard" className="w-full h-full object-cover object-left-top opacity-80 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </div>

                        {/* Row 3: Advanced Module Configuration (col-2) + Dynamic CRM (col-1) */}
                        <div className="md:col-span-2 bg-[#0f0f12] border border-white/10 rounded-3xl p-10 flex flex-col md:flex-row gap-8 relative overflow-hidden group hover:border-blue-500/30 transition-colors">
                            <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full group-hover:bg-blue-500/20 transition-colors pointer-events-none"></div>
                            <div className="md:w-1/2 flex flex-col justify-center">
                                <h3 className="text-2xl font-bold text-white mb-4 relative z-10">Advanced AI Module Configuration</h3>
                                <p className="text-zinc-400 leading-relaxed relative z-10">Fine-tune your AI Agent behaviors, instructions, and module handoffs. Total control over exactly how your AI represents your business.</p>
                            </div>
                            <div className="md:w-1/2 relative rounded-xl overflow-hidden border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] group-hover:scale-[1.02] transition-transform duration-500 group-hover:shadow-blue-500/20 mt-8 md:mt-0">
                                <img src="/module-configuration.png" alt="AI Module Configuration" className="w-full h-full object-cover object-left-top opacity-80 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-3xl p-10 flex flex-col justify-between relative overflow-hidden group hover:border-pink-500/30 transition-colors">
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-4 z-10 relative">Dynamic CRM</h3>
                                <p className="text-zinc-400 leading-relaxed mb-8 z-10 relative">Every chat is tied to a rich contact profile with custom fields, tags, and lifecycle stages (Lead → Customer).</p>
                            </div>
                            <div className="mt-auto relative rounded-xl overflow-hidden border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] group-hover:scale-[1.03] transition-transform duration-500 group-hover:shadow-pink-500/20">
                                <img src="/lifecycle-stages.png" alt="Dynamic CRM & Lifecycle Stages" className="w-full h-auto object-cover object-left-top opacity-80 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-32 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-indigo-900/20 pointer-events-none"></div>
                <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                    <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-8 tracking-tight">Ready to transform your communication?</h2>
                    <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">Join the forward-thinking teams using ValueWats to automate workflows and drive revenue on WhatsApp.</p>
                    <Link
                        to="/register"
                        className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-white text-black font-bold text-lg hover:bg-zinc-200 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
                    >
                        Create Your Account
                    </Link>
                </div>
            </section>

            {/* Custom CSS for Marquee in this component (since index.css might not have it yet) */}
            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}} />
        </PublicLayout>
    );
}
