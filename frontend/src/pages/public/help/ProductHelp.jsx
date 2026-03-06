import React from 'react';
import { Link } from 'react-router-dom';
import HelpCenterLayout from '../../../components/public/HelpCenterLayout';
import { 
    ChevronRightIcon,
    InformationCircleIcon,
    SparklesIcon,
    UsersIcon,
    MegaphoneIcon,
    ChatBubbleLeftRightIcon,
    BoltIcon,
    RectangleGroupIcon
} from '@heroicons/react/24/outline';

const productCollections = [
    {
        id: 'ai-agents',
        name: 'AI Agents',
        description: 'Build autonomous agents with RAG and custom action tools.',
        icon: <SparklesIcon className="w-8 h-8 text-fuchsia-500" />,
        articleCount: 12,
        link: '/help/ai-agents'
    },
    {
        id: 'inbox',
        name: 'Smart Inbox',
        description: 'Master the unified multi-channel inbox for team collaboration.',
        icon: <ChatBubbleLeftRightIcon className="w-8 h-8 text-emerald-500" />,
        articleCount: 8,
        link: '/help/inbox'
    },
    {
        id: 'contacts',
        name: 'Contacts & segments',
        description: 'Manage your audience, custom fields, and lifecycle stages.',
        icon: <UsersIcon className="w-8 h-8 text-blue-500" />,
        articleCount: 6,
        link: '/help/contacts'
    },
    {
        id: 'campaigns',
        name: 'Campaigns & Broadcasts',
        description: 'Run bulk marketing efforts with spintax and anti-ban protection.',
        icon: <MegaphoneIcon className="w-8 h-8 text-indigo-500" />,
        articleCount: 5,
        link: '/help/campaigns'
    },
    {
        id: 'workflows',
        name: 'Workflows & Automation',
        description: 'Design complex automation trees and trigger based logic.',
        icon: <BoltIcon className="w-8 h-8 text-amber-500" />,
        articleCount: 9,
        link: '/help/workflows'
    },
    {
        id: 'reporting',
        name: 'Dashboard & Reporting',
        description: 'Analyze your performance metrics and conversion rates.',
        icon: <RectangleGroupIcon className="w-8 h-8 text-zinc-400" />,
        articleCount: 4,
        link: '/help/reporting'
    }
];

export default function ProductHelp() {
    return (
        <HelpCenterLayout>
            <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6">
                {/* Breadcrumbs */}
                <nav className="flex items-center gap-2 mb-8 text-sm font-medium">
                    <Link to="/help" className="text-zinc-500 hover:text-white transition-colors">All Collections</Link>
                    <ChevronRightIcon className="w-4 h-4 text-zinc-700" />
                    <span className="text-zinc-300">Product Features</span>
                </nav>

                <div className="mb-12">
                    <h1 className="text-4xl font-black text-white mb-4 tracking-tight">Product Features</h1>
                    <p className="text-lg text-zinc-500 max-w-2xl leading-relaxed">
                        Deep dive into every feature of ValueWats. Learn how to optimize your workflows and scale your customer engagement.
                    </p>
                </div>

                {/* Product Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {productCollections.map((item) => (
                        <Link 
                            key={item.id}
                            to={item.link}
                            className="flex flex-col p-8 bg-[#111113] border border-white/5 rounded-3xl hover:bg-white/[0.03] hover:border-white/10 transition-all group"
                        >
                            <div className="flex items-start justify-between mb-6">
                                <div className="p-3 bg-white/5 rounded-2xl border border-white/5 shadow-inner group-hover:scale-110 transition-transform duration-300">
                                    {item.icon}
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                                    <InformationCircleIcon className="w-4 h-4 text-zinc-500" />
                                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">{item.articleCount} Articles</span>
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-white mb-2 leading-tight">{item.name}</h3>
                            <p className="text-zinc-500 text-[14px] leading-relaxed mb-8 flex-grow">
                                {item.description}
                            </p>

                            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                                <span>Learn more</span>
                                <ChevronRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </HelpCenterLayout>
    );
}
