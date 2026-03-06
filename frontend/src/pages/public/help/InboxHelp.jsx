import React from 'react';
import { Link } from 'react-router-dom';
import HelpCenterLayout from '../../../components/public/HelpCenterLayout';
import { 
    ChatBubbleBottomCenterTextIcon, 
    UserIcon, 
    SparklesIcon,
    ChevronRightIcon
} from '@heroicons/react/24/outline';

export default function InboxHelp() {
    return (
        <HelpCenterLayout title="Smart Inbox Guide" lastUpdated="March 2026">
            <div className="flex items-center gap-2 mb-10 text-sm font-medium">
                <Link to="/help" className="text-zinc-500 hover:text-white transition-colors">Help Center</Link>
                <ChevronRightIcon className="w-4 h-4 text-zinc-700" />
                <span className="text-zinc-300">Smart Inbox</span>
            </div>

            <h1 className="text-4xl font-black text-white mb-6 tracking-tight">Mastering the Smart Inbox</h1>
            <p className="text-lg text-zinc-400 mb-12 leading-relaxed max-w-3xl">
                The Smart Inbox is your command center. It unifies messages from all channels into a single, high-speed interface designed for efficiency and team collaboration.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
                <div className="p-8 bg-[#111113] border border-white/5 rounded-3xl">
                    <UserIcon className="w-8 h-8 text-blue-400 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Assigning Chats</h3>
                    <p className="text-sm text-zinc-500 leading-relaxed">
                        Manually assign conversations to team members or let AI handle the triage. Assigned chats move from "Unassigned" to your personal view.
                    </p>
                </div>
                <div className="p-8 bg-[#111113] border border-white/5 rounded-3xl">
                    <ChatBubbleBottomCenterTextIcon className="w-8 h-8 text-emerald-400 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Internal Notes</h3>
                    <p className="text-sm text-zinc-500 leading-relaxed">
                        Collaborate behind the scenes. Leave notes for team members that are invisible to the customer—perfect for handing over complex cases.
                    </p>
                </div>
            </div>

            <div className="space-y-12">
                <section>
                    <h2 className="text-2xl font-bold text-white mb-6">Productivity Superpowers</h2>
                    <div className="space-y-6">
                        <div className="flex gap-6 p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                            <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center shrink-0">
                                <span className="font-black text-indigo-400 text-lg">/</span>
                            </div>
                            <div>
                                <h4 className="text-white font-bold mb-1">Snippets & Quick Replies</h4>
                                <p className="text-sm text-zinc-500">Type "/" to instantly pull up templated answers. Save hours of repetitive typing every week.</p>
                            </div>
                        </div>
                        <div className="flex gap-6 p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                            <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center shrink-0">
                                <SparklesIcon className="w-6 h-6 text-amber-400" />
                            </div>
                            <div>
                                <h4 className="text-white font-bold mb-1">AI Assist (Contextual Generation)</h4>
                                <p className="text-sm text-zinc-500">Stuck on a reply? Our AI analyzes the thread context and generates the perfect response for you to review and send.</p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </HelpCenterLayout>
    );
}
