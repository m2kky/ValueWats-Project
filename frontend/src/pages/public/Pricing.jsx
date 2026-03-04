import PublicLayout from '../../components/public/PublicLayout';

export default function Pricing() {
    return (
        <PublicLayout>
            <div className="pt-32 pb-24 border-b border-zinc-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center bg-black min-h-screen text-white">
                    <h1 className="text-5xl font-extrabold tracking-tight mb-6">
                        Simple, transparent pricing
                    </h1>
                    <p className="text-xl text-zinc-400 mb-12 max-w-2xl mx-auto">
                        Choose the plan that best fits your business needs. Scale up as you grow.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Starter Plan */}
                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 flex flex-col text-left">
                            <h3 className="text-2xl font-semibold mb-2">Starter</h3>
                            <div className="flex items-baseline mb-4">
                                <span className="text-4xl font-extrabold">$29</span>
                                <span className="text-zinc-400 ml-2">/month</span>
                            </div>
                            <p className="text-zinc-400 mb-6">Perfect for small businesses just getting started with WhatsApp automation.</p>
                            <ul className="space-y-4 mb-8 flex-1">
                                <li className="flex items-start">
                                    <svg className="w-5 h-5 text-emerald-400 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                    <span>Up to 1,000 Contacts</span>
                                </li>
                                <li className="flex items-start">
                                    <svg className="w-5 h-5 text-emerald-400 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                    <span>1 Team Member</span>
                                </li>
                                <li className="flex items-start">
                                    <svg className="w-5 h-5 text-emerald-400 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                    <span>Basic Broadcasts</span>
                                </li>
                            </ul>
                            <button className="w-full py-3 px-4 rounded-lg font-medium bg-zinc-800 hover:bg-zinc-700 transition-colors">Get Started</button>
                        </div>

                        {/* Growth Plan */}
                        <div className="bg-blue-600 border border-blue-500 rounded-2xl p-8 flex flex-col text-left relative transform md:-translate-y-4 shadow-xl shadow-blue-900/20">
                            <div className="absolute top-0 right-0 bg-blue-400 text-blue-900 text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-xl uppercase tracking-wider">Most Popular</div>
                            <h3 className="text-2xl font-semibold mb-2">Growth</h3>
                            <div className="flex items-baseline mb-4">
                                <span className="text-4xl font-extrabold">$99</span>
                                <span className="text-blue-200 ml-2">/month</span>
                            </div>
                            <p className="text-blue-100 mb-6">For growing teams that need advanced automation and AI capabilities.</p>
                            <ul className="space-y-4 mb-8 flex-1">
                                <li className="flex items-start">
                                    <svg className="w-5 h-5 text-white mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                    <span>Up to 10,000 Contacts</span>
                                </li>
                                <li className="flex items-start">
                                    <svg className="w-5 h-5 text-white mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                    <span>5 Team Members</span>
                                </li>
                                <li className="flex items-start">
                                    <svg className="w-5 h-5 text-white mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                    <span>Advanced Workflows</span>
                                </li>
                                <li className="flex items-start">
                                    <svg className="w-5 h-5 text-white mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                    <span>1 Custom AI Agent</span>
                                </li>
                            </ul>
                            <button className="w-full py-3 px-4 rounded-lg font-medium bg-white text-blue-600 hover:bg-blue-50 transition-colors">Start Free Trial</button>
                        </div>

                        {/* Enterprise Plan */}
                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 flex flex-col text-left">
                            <h3 className="text-2xl font-semibold mb-2">Enterprise</h3>
                            <div className="flex items-baseline mb-4">
                                <span className="text-4xl font-extrabold">Custom</span>
                            </div>
                            <p className="text-zinc-400 mb-6">Tailored solutions for large organizations with complex needs.</p>
                            <ul className="space-y-4 mb-8 flex-1">
                                <li className="flex items-start">
                                    <svg className="w-5 h-5 text-emerald-400 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                    <span>Unlimited Contacts</span>
                                </li>
                                <li className="flex items-start">
                                    <svg className="w-5 h-5 text-emerald-400 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                    <span>Unlimited Team Members</span>
                                </li>
                                <li className="flex items-start">
                                    <svg className="w-5 h-5 text-emerald-400 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                    <span>Unlimited AI Agents</span>
                                </li>
                                <li className="flex items-start">
                                    <svg className="w-5 h-5 text-emerald-400 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                    <span>Dedicated Success Manager</span>
                                </li>
                            </ul>
                            <button className="w-full py-3 px-4 rounded-lg font-medium bg-zinc-800 hover:bg-zinc-700 transition-colors">Contact Sales</button>
                        </div>

                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
