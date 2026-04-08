import { useState } from 'react';
import PublicLayout from '../../components/public/PublicLayout';

export default function Contact() {
    const [status, setStatus] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        // Simulate sending
        setStatus('sending');
        setTimeout(() => {
            setStatus('success');
            e.target.reset();
        }, 1500);
    };

    return (
        <PublicLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
                <div className="grid lg:grid-cols-2 gap-16 items-start">

                    <div>
                        <h1 className="text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-6">
                            Let's <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Talk</span>
                        </h1>
                        <p className="text-xl text-zinc-400 mb-12">
                            Have questions about pricing, enterprise plans, or how Value chat can fit into your specific workflow? Drop us a line.
                        </p>

                        <div className="space-y-8">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                                    <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                </div>
                                <div>
                                    <h3 className="font-bold text-white mb-1">Email Us</h3>
                                    <a href="mailto:support@valuechat.app" className="text-zinc-400 hover:text-indigo-400 transition-colors">support@valuechat.app</a>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                                    <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                </div>
                                <div>
                                    <h3 className="font-bold text-white mb-1">Office</h3>
                                    <p className="text-zinc-400">123 Innovation Drive<br />Tech District, San Francisco, CA</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#111113] border border-white/5 p-8 md:p-12 rounded-3xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none"></div>

                        {status === 'success' ? (
                            <div className="text-center py-20 relative z-10">
                                <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">Message Sent</h3>
                                <p className="text-zinc-400">We'll get back to you within 24 hours.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                                <div>
                                    <label className="block text-sm font-bold text-zinc-400 mb-2">Name</label>
                                    <input required type="text" className="w-full bg-[#18181b] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" placeholder="Jane Doe" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-zinc-400 mb-2">Email</label>
                                    <input required type="email" className="w-full bg-[#18181b] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" placeholder="jane@company.com" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-zinc-400 mb-2">Message</label>
                                    <textarea required rows="4" className="w-full bg-[#18181b] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none" placeholder="How can we help you?"></textarea>
                                </div>
                                <button
                                    type="submit"
                                    disabled={status === 'sending'}
                                    className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-lg hover:from-indigo-400 hover:to-purple-500 transition-all disabled:opacity-50"
                                >
                                    {status === 'sending' ? 'Sending...' : 'Send Message'}
                                </button>
                            </form>
                        )}
                    </div>

                </div>
            </div>
        </PublicLayout>
    );
}
