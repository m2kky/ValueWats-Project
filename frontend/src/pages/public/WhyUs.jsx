import PublicLayout from '../../components/public/PublicLayout';

export default function WhyUs() {
    return (
        <PublicLayout>
            <div className="pt-32 pb-24 min-h-screen bg-black text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <h1 className="text-5xl font-extrabold tracking-tight mb-6">
                            Why Choose Value chat?
                        </h1>
                        <p className="text-xl text-zinc-400">
                            We're not just another WhatsApp inbox. We are an Agentic CRM built to handle the scale and complexity of modern sales and support.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
                        <div>
                            <h2 className="text-3xl font-bold mb-4">Fragmented Tools vs. All-in-One</h2>
                            <p className="text-lg text-zinc-400 mb-6">
                                Stop juggling between a CRM, a shared inbox, an automation builder, and a separate AI platform. Value chat brings all these capabilities into a single, cohesive interface.
                            </p>
                            <ul className="space-y-4 text-zinc-300">
                                <li className="flex items-center"><svg className="w-5 h-5 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> Unified Customer View</li>
                                <li className="flex items-center"><svg className="w-5 h-5 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> Reduced Context Switching</li>
                                <li className="flex items-center"><svg className="w-5 h-5 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> Lower Total Cost of Ownership</li>
                            </ul>
                        </div>
                        <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800 shadow-2xl">
                            <div className="flex justify-between items-center mb-6 pb-6 border-b border-zinc-800">
                                <span className="text-zinc-400">Features</span>
                                <span className="text-white font-semibold flex items-center"><svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd"></path></svg> Value chat</span>
                                <span className="text-zinc-500 text-sm">Competitors</span>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span>Omnichannel Inbox</span>
                                    <span className="text-emerald-400">Built-in</span>
                                    <span className="text-red-400">Add-on</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span>Visual Workflows</span>
                                    <span className="text-emerald-400">Unlimited</span>
                                    <span className="text-red-400">Tiered</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span>Custom AI Agents</span>
                                    <span className="text-emerald-400">Native</span>
                                    <span className="text-red-400">Third-party</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </PublicLayout>
    );
}
