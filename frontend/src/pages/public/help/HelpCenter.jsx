import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from '../../../components/public/PublicLayout';
import { 
    MagnifyingGlassIcon, 
    RocketLaunchIcon, 
    ChatBubbleLeftRightIcon, 
    MegaphoneIcon, 
    BeakerIcon, 
    Cog6ToothIcon,
    ArrowRightIcon
} from '@heroicons/react/24/outline';

const categories = [
    {
        id: 'getting-started',
        title: 'Getting Started',
        description: 'New to ValueWats? Start here to set up your account and send your first message.',
        icon: RocketLaunchIcon,
        color: 'text-blue-400',
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/20',
        link: '/help/getting-started'
    },
    {
        id: 'inbox',
        title: 'Smart Inbox',
        description: 'Master the unified multi-channel inbox. Manage WhatsApp, FB, and Instagram chats.',
        icon: ChatBubbleLeftRightIcon,
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20',
        link: '/help/inbox'
    },
    {
        id: 'campaigns',
        title: 'Campaigns & Broadcasts',
        description: 'Learn how to run bulk marketing campaigns, use spintax, and schedule messages.',
        icon: MegaphoneIcon,
        color: 'text-indigo-400',
        bg: 'bg-indigo-500/10',
        border: 'border-indigo-500/20',
        link: '/help/campaigns'
    },
    {
        id: 'agents',
        title: 'AI Agents (Neural Lab)',
        description: 'Build autonomous agents with RAG (Knowledge base) and custom action tools.',
        icon: BeakerIcon,
        color: 'text-fuchsia-400',
        bg: 'bg-fuchsia-500/10',
        border: 'border-fuchsia-500/20',
        link: '/help/agents'
    },
    {
        id: 'settings',
        title: 'Settings & API',
        description: 'Configure your instances, team members, and webhooks for external integrations.',
        icon: Cog6ToothIcon,
        color: 'text-zinc-400',
        bg: 'bg-white/5',
        border: 'border-white/10',
        link: '/help/settings'
    },
];

export default function HelpCenter() {
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <PublicLayout>
            <div className="bg-[#09090b] min-h-screen">
                {/* Hero Section */}
                <div className="relative pt-32 pb-20 overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b from-blue-600/10 via-transparent to-transparent"></div>
                    
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
                            How can we <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">help</span>?
                        </h1>
                        <p className="text-lg text-zinc-400 mb-10 max-w-2xl mx-auto">
                            Search our documentation for guides, tutorials, and technical references to help you scale your WhatsApp marketing.
                        </p>

                        {/* Search Bar */}
                        <div className="relative max-w-2xl mx-auto">
                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                <MagnifyingGlassIcon className="h-6 w-6 text-zinc-500" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search for articles (e.g. spintax, AI knowledge base)..."
                                className="w-full bg-[#18181b] border border-white/10 rounded-2xl py-4 pl-14 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all shadow-2xl text-lg"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Categories Grid */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {categories.map((cat) => (
                            <Link 
                                key={cat.id} 
                                to={cat.link}
                                className="group bg-[#111113] border border-white/5 rounded-3xl p-8 hover:bg-white/[0.03] hover:border-white/10 transition-all duration-300 relative overflow-hidden"
                            >
                                <div className={`w-14 h-14 ${cat.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                    <cat.icon className={`w-7 h-7 ${cat.color}`} />
                                </div>
                                
                                <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                                    {cat.title}
                                    <ArrowRightIcon className="w-4 h-4 text-zinc-600 group-hover:text-blue-400 transition-colors group-hover:translate-x-1 duration-300" />
                                </h3>
                                <p className="text-zinc-400 text-[15px] leading-relaxed">
                                    {cat.description}
                                </p>

                                <div className="mt-8">
                                    <span className="text-sm font-semibold text-blue-400 group-hover:underline">
                                        View Guides
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* Support Section */}
                    <div className="mt-20 p-10 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-3xl border border-blue-500/20 text-center">
                        <h2 className="text-2xl font-bold text-white mb-4">Still can't find what you're looking for?</h2>
                        <p className="text-zinc-400 mb-8 max-w-xl mx-auto">
                            Our team is available 24/7 to help you with any technical issues or feature requests. Reach out to us directly via WhatsApp or Email.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <a 
                                href="https://wa.me/your-number" 
                                target="_blank" 
                                rel="noreferrer"
                                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg"
                            >
                                Chat Support
                            </a>
                            <a 
                                href="mailto:support@valuewats.com"
                                className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all border border-white/10"
                            >
                                Open Ticket
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
