import PublicLayout from '../../../components/public/PublicLayout';

export default function Learn() {
    return (
        <PublicLayout>
            <div className="pt-32 pb-24 min-h-screen bg-black text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h1 className="text-4xl font-extrabold mb-4">Value chat Blog</h1>
                    <p className="text-xl text-zinc-400 mb-12">Insights, tutorials, and strategies to scale your marketing.</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Article 1 */}
                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-colors cursor-pointer group">
                            <div className="h-48 bg-zinc-800 animate-pulse group-hover:bg-zinc-700 transition-colors"></div>
                            <div className="p-6">
                                <span className="text-blue-400 text-xs font-bold uppercase tracking-wider mb-2 block">AI Strategies</span>
                                <h3 className="text-xl font-bold mb-3">How to reduce support tickets by 40% with RAG.</h3>
                                <p className="text-zinc-400 text-sm mb-4 line-clamp-2">Learn how feeding your company documentation into an AI agent can drastically drop your team's workload.</p>
                                <div className="flex items-center text-sm text-zinc-500">
                                    <span>Mar 4, 2026</span>
                                    <span className="mx-2">•</span>
                                    <span>5 min read</span>
                                </div>
                            </div>
                        </div>

                        {/* Article 2 */}
                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-colors cursor-pointer group">
                            <div className="h-48 bg-zinc-800 animate-pulse group-hover:bg-zinc-700 transition-colors"></div>
                            <div className="p-6">
                                <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2 block">Automation</span>
                                <h3 className="text-xl font-bold mb-3">Building a Lead Qualification Workflow</h3>
                                <p className="text-zinc-400 text-sm mb-4 line-clamp-2">A step-by-step guide to separating the signal from the noise when running ad campaigns.</p>
                                <div className="flex items-center text-sm text-zinc-500">
                                    <span>Feb 28, 2026</span>
                                    <span className="mx-2">•</span>
                                    <span>8 min read</span>
                                </div>
                            </div>
                        </div>

                        {/* Article 3 */}
                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-colors cursor-pointer group">
                            <div className="h-48 bg-zinc-800 animate-pulse group-hover:bg-zinc-700 transition-colors"></div>
                            <div className="p-6">
                                <span className="text-purple-400 text-xs font-bold uppercase tracking-wider mb-2 block">Product Update</span>
                                <h3 className="text-xl font-bold mb-3">Introducing: Custom LLM Providers</h3>
                                <p className="text-zinc-400 text-sm mb-4 line-clamp-2">Now you can bring your own OpenAI API key or use local models via Ollama.</p>
                                <div className="flex items-center text-sm text-zinc-500">
                                    <span>Feb 15, 2026</span>
                                    <span className="mx-2">•</span>
                                    <span>3 min read</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
