import { useState } from 'react';
import PublicLayout from '../../components/public/PublicLayout';

const plans = [
    {
        status: 'Recently Launched',
        color: 'emerald',
        items: [
            { title: 'Multi-Channel Inbox', desc: 'Manage WhatsApp, Facebook Messenger, and Instagram Direct from a single view.' },
            { title: 'Enterprise Help Center', desc: 'Comprehensive self-service documentation hub integrated into the platform.' },
            { title: 'AI Agent Actions', desc: '8 distinct neural response behaviors for fully autonomous customer engagement.' },
        ]
    },
    {
        status: 'In Progress',
        color: 'indigo',
        items: [
            { title: 'Mobile App', desc: 'Native iOS and Android apps to manage your customer conversations on the go.' },
            { title: 'Shopify Integration', desc: 'Automate order tracking and shipping updates directly via WhatsApp.' },
            { title: 'Performance Dashboard', desc: 'Real-time analytics for campaign ROI and AI agent efficiency.' },
        ]
    },
    {
        status: 'Planned (Q3)',
        color: 'purple',
        items: [
            { title: 'Advanced RAG Bots', desc: 'Next-gen chatbots grounded in your custom knowledge base for higher accuracy.' },
            { title: 'Campaign A/B Testing', desc: 'Data-driven testing for message templates and audience segments.' },
            { title: 'Salesforce Connector', desc: 'Deep native integration with Salesforce CRM for enterprise workflows.' },
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
