import { Link } from 'react-router-dom';
import PublicLayout from '../../components/public/PublicLayout';

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

            {/* Marquee Logos */}
            <section className="py-20 border-y border-white/5 bg-[#0d0d0f] overflow-hidden">
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

            {/* Features Bento Grid */}
            <section id="features" className="py-32 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-20">
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Built for scale. Designed for speed.</h2>
                        <p className="text-lg text-zinc-400 max-w-2xl mx-auto">Everything you need to manage thousands of conversations without dropping the ball.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 border border-white/10 rounded-3xl p-10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[80px] rounded-full group-hover:bg-indigo-500/30 transition-colors"></div>
                            <h3 className="text-2xl font-bold text-white mb-4 relative z-10">Agentic AI Workflows</h3>
                            <p className="text-zinc-400 leading-relaxed mb-8 relative z-10 max-w-md">Train AI models on your own knowledge base to handle customer queries, qualify leads, and close tickets entirely autonomously.</p>
                            {/* Mock UI */}
                            <div className="bg-[#18181b] border border-white/10 rounded-xl p-4 shadow-2xl relative z-10 translate-y-4 group-hover:-translate-y-2 transition-transform duration-500">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 rounded bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">AI</div>
                                    <div className="flex-1 h-3 rounded bg-white/5"></div>
                                </div>
                                <div className="space-y-2">
                                    <div className="w-3/4 h-2 rounded bg-white/5"></div>
                                    <div className="w-1/2 h-2 rounded bg-white/5"></div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-3xl p-10 relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
                            <h3 className="text-2xl font-bold text-white mb-4">Smart Inbox</h3>
                            <p className="text-zinc-400 leading-relaxed mb-8">A collaborative workspace to manage WhatsApp threads as a team. Tag, assign, and resolve.</p>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-3xl p-10 relative overflow-hidden group hover:border-purple-500/30 transition-colors">
                            <h3 className="text-2xl font-bold text-white mb-4">Visual Automations</h3>
                            <p className="text-zinc-400 leading-relaxed mb-8">Drag-and-drop workflow builder. React to triggers, send templates, and sync with your CRM.</p>
                        </div>

                        <div className="md:col-span-2 bg-[#0f0f12] border border-white/10 rounded-3xl p-10 relative overflow-hidden group">
                            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-emerald-500/10 to-transparent blur-[50px] pointer-events-none"></div>
                            <h3 className="text-2xl font-bold text-white mb-4">Bulk Campaigns that Convert</h3>
                            <p className="text-zinc-400 leading-relaxed max-w-lg">Send personalized broadcast messages to segments of thousands. Track delivery, reads, and replies in real-time without risking bans.</p>
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
