import { useState } from 'react';
import PublicLayout from '../../components/public/PublicLayout';

const plans = [
    {
        status: 'In Progress',
        color: 'emerald',
        items: [
            { title: 'Mobile App', desc: 'Manage your inbox from iOS and Android devices.' },
            { title: 'Shopify Integration', desc: 'Sync orders and automatically trigger WhatsApp updates.' },
        ]
    },
    {
        status: 'Planned (Q3)',
        color: 'indigo',
        items: [
            { title: 'Advanced Chatbots', desc: 'RAG-powered conversational bots grounded in your custom data.' },
            { title: 'Omnichannel Inbox', desc: 'Unify Instagram, Messenger, and WhatsApp in one view.' },
            { title: 'Campaign A/B Testing', desc: 'A/B test templates and audiences to maximize conversion.' },
        ]
    },
    {
        status: 'Under Consideration',
        color: 'purple',
        items: [
            { title: 'Native Calling', desc: 'VoIP calls directly from the ValueWats dashboard.' },
            { title: 'Salesforce AppExchange', desc: 'Native integration package for Salesforce.' },
        ]
    }
];

export default function Roadmap() {
    return (
        <PublicLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-6">
                        Product <span className="text-indigo-400">Roadmap</span>
                    </h1>
                    <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
                        See what we're building next to make ValueWats the most powerful conversational platform in the world.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {plans.map((column, idx) => (
                        <div key={idx} className="bg-[#111113] border border-white/5 rounded-3xl p-6">
                            <div className="flex items-center gap-3 mb-8">
                                <div className={`w-3 h-3 rounded-full bg-${column.color}-500 shadow-[0_0_10px_rgba(var(--color-${column.color}-500),0.8)]`}></div>
                                <h2 className="text-lg font-bold text-white uppercase tracking-wider">{column.status}</h2>
                            </div>

                            <div className="space-y-4">
                                {column.items.map((item, i) => (
                                    <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors">
                                        <h3 className="font-bold text-white mb-2">{item.title}</h3>
                                        <p className="text-sm text-zinc-400 leading-relaxed">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </PublicLayout>
    );
}
