import PublicLayout from '../../components/public/PublicLayout';

export default function About() {
    return (
        <PublicLayout>
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
                <div className="text-center mb-20">
                    <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-6">
                        Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Mission</span>
                    </h1>
                    <p className="text-xl/relaxed text-zinc-400 max-w-3xl mx-auto">
                        We're building the infrastructure that powers the next generation of conversational commerce.
                        Value chat exists to bridge the gap between businesses and their customers on the platform they use every day.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-12 lg:gap-20 mb-32">
                    <div className="space-y-8">
                        <h2 className="text-3xl font-bold text-white">Why we started</h2>
                        <p className="text-zinc-400 leading-relaxed text-lg">
                            WhatsApp is the world's most popular messaging app, but using it at an enterprise scale has always been painfully complex. Businesses were duct-taping consumer tools to try and handle massive volumes of conversations.
                        </p>
                        <p className="text-zinc-400 leading-relaxed text-lg">
                            We saw teams struggling with dropped messages, complex API integrations, and zero automation. That's why we built Value chat.
                        </p>
                    </div>
                    <div className="bg-[#111113] border border-white/5 p-8 rounded-3xl relative overflow-hidden flex items-center shadow-2xl">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none"></div>
                        <div className="relative z-10 w-full">
                            <div className="text-6xl font-black text-white/10 mb-4">"</div>
                            <p className="text-xl font-medium text-white italic mb-6">
                                We believe that every business should interact with their customers as smoothly as friends text each other.
                            </p>
                            <div className="text-sm font-bold text-indigo-400 uppercase tracking-widest">The Value chat Team</div>
                        </div>
                    </div>
                </div>

                <div className="border-t border-white/5 py-20 text-center">
                    <h2 className="text-3xl font-bold text-white mb-8">Our Core Values</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                        <div className="p-8 bg-white/5 rounded-2xl border border-white/5">
                            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-6 mx-auto">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Speed</h3>
                            <p className="text-sm text-zinc-400">Ship fast, iterate faster. We prioritize velocity to get features into your hands.</p>
                        </div>
                        <div className="p-8 bg-white/5 rounded-2xl border border-white/5">
                            <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-6 mx-auto">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Reliability</h3>
                            <p className="text-sm text-zinc-400">When it comes to communication, downtime is not an option. We build for resilience.</p>
                        </div>
                        <div className="p-8 bg-white/5 rounded-2xl border border-white/5">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6 mx-auto">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Innovation</h3>
                            <p className="text-sm text-zinc-400">Pushing the boundaries of what's possible with AI and automation frameworks.</p>
                        </div>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
