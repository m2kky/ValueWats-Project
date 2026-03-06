import { useState } from 'react';
import PublicLayout from '../../../components/public/PublicLayout';

const helpCategories = [
    {
        title: 'Getting Started',
        description: 'Account setup, Meta Cloud API connection, and team invitations.',
        path: '/resources/support/getting-started',
        icon: (
            <svg className="w-8 h-8 text-blue-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
        )
    },
    {
        title: 'Smart Inbox',
        description: 'Chat assignment, internal notes, rich messages, and chat snippets.',
        path: '/resources/support/inbox',
        icon: (
            <svg className="w-8 h-8 text-indigo-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
        )
    },
    {
        title: 'Campaigns & Broadcasts',
        description: 'Bulk messaging, avoiding WhatsApp bans, and delivery analytics.',
        path: '/resources/support/campaigns',
        icon: (
            <svg className="w-8 h-8 text-emerald-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path></svg>
        )
    },
    {
        title: 'AI Agents',
        description: 'Configuring Neural Labs, autonomous actions, and RAG knowledge bases.',
        path: '/resources/support/agents',
        icon: (
            <svg className="w-8 h-8 text-amber-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"></path></svg>
        )
    },
    {
        title: 'Settings & Automations',
        description: 'Managing custom fields, lifecycle stages, tags, and workflow automations.',
        path: '/resources/support/settings',
        icon: (
            <svg className="w-8 h-8 text-rose-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
        )
    }
];

export default function Support() {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredCategories = helpCategories.filter(c => 
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <PublicLayout>
            <div className="pt-32 pb-24 min-h-screen bg-black text-white">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl font-extrabold mb-6">How can we help?</h1>
                    <div className="relative max-w-2xl mx-auto mb-16">
                        <input
                            type="text"
                            placeholder="Search for articles, guides, or troubleshooting..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 pl-12 pr-4 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                        <svg className="w-6 h-6 text-zinc-500 absolute left-4 top-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
                        {filteredCategories.length > 0 ? (
                            filteredCategories.map((category) => (
                                <a key={category.title} href={category.path} className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl hover:border-zinc-700 hover:bg-zinc-800 transition-all block">
                                    {category.icon}
                                    <h3 className="text-xl font-semibold mb-2">{category.title}</h3>
                                    <p className="text-zinc-400 text-sm">{category.description}</p>
                                </a>
                            ))
                        ) : (
                            <div className="col-span-full text-center py-12 text-zinc-500">
                                No articles found matching "{searchQuery}"
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
