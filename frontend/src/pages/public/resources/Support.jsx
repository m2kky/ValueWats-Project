import PublicLayout from '../../../components/public/PublicLayout';

export default function Support() {
    return (
        <PublicLayout>
            <div className="pt-32 pb-24 min-h-screen bg-black text-white">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl font-extrabold mb-6">How can we help?</h1>
                    <div className="relative max-w-2xl mx-auto mb-16">
                        <input
                            type="text"
                            placeholder="Search for articles, guides, or troubleshooting..."
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 pl-12 pr-4 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                        <svg className="w-6 h-6 text-zinc-500 absolute left-4 top-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                        <a href="#" className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl hover:border-zinc-700 transition-colors block">
                            <svg className="w-8 h-8 text-blue-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                            <h3 className="text-xl font-semibold mb-2">Getting Started</h3>
                            <p className="text-zinc-400 text-sm">Learn the basics of setting up your account and inviting your team.</p>
                        </a>
                        <a href="#" className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl hover:border-zinc-700 transition-colors block">
                            <svg className="w-8 h-8 text-purple-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                            <h3 className="text-xl font-semibold mb-2">Automations</h3>
                            <p className="text-zinc-400 text-sm">Master the visual workflow builder to automate your communications.</p>
                        </a>
                        <a href="#" className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl hover:border-zinc-700 transition-colors block">
                            <svg className="w-8 h-8 text-emerald-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                            <h3 className="text-xl font-semibold mb-2">AI Agents</h3>
                            <p className="text-zinc-400 text-sm">Train your custom agents and connect them to WhatsApp.</p>
                        </a>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
