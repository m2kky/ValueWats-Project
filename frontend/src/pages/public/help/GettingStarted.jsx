import React from 'react';
import { Link } from 'react-router-dom';
import HelpCenterLayout from '../../../components/public/HelpCenterLayout';
import { 
    RocketLaunchIcon, 
    UserPlusIcon, 
    ChatBubbleLeftRightIcon,
    ChevronRightIcon
} from '@heroicons/react/24/outline';

export default function GettingStarted() {
    return (
        <HelpCenterLayout title="Quick Start Guide" lastUpdated="March 2026">
            <div className="flex items-center gap-2 mb-10 text-sm font-medium">
                <Link to="/help" className="text-zinc-500 hover:text-white transition-colors">Help Center</Link>
                <ChevronRightIcon className="w-4 h-4 text-zinc-700" />
                <span className="text-zinc-300">Quick Start</span>
            </div>

            <h1 className="text-4xl font-black text-white mb-6 tracking-tight">Welcome to Value chat</h1>
            <p className="text-lg text-zinc-400 mb-12 leading-relaxed max-w-3xl">
                Value chat is your ultimate Agentic CRM for WhatsApp and Omni-channel messaging. Follow these three simple steps to go live with your team in minutes.
            </p>

            <div className="space-y-16">
                {/* Step 1 */}
                <section className="relative pl-12">
                    <div className="absolute left-0 top-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center font-black text-white shadow-lg shadow-blue-600/20">1</div>
                    <div className="flex items-start gap-6">
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-white mb-4">Connect Your First Channel</h2>
                            <p className="text-zinc-400 mb-6">
                                The heart of Value chat is your messaging connections. We use high-performance gateways to link your WhatsApp, Messenger, and Instagram accounts.
                            </p>
                            <div className="bg-[#111113] border border-white/5 rounded-2xl p-6 mb-6">
                                <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                                    <RocketLaunchIcon className="w-5 h-5 text-blue-400" />
                                    WhatsApp Scanning (Evolution API)
                                </h4>
                                <p className="text-sm text-zinc-500 m-0 leading-relaxed">
                                    Unlike complex Cloud APIs, Value chat allows you to connect any WhatsApp account by simply scanning a QR code. It's safe, instant, and supports full multimedia.
                                </p>
                            </div>
                            <Link to="/help/channels/whatsapp/connect" className="text-blue-400 hover:underline font-bold text-sm inline-flex items-center gap-1">
                                Learn how to connect WhatsApp <ChevronRightIcon className="w-3 h-3" />
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Step 2 */}
                <section className="relative pl-12">
                    <div className="absolute left-0 top-0 w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center font-black text-white border border-white/5">2</div>
                    <div className="flex items-start gap-6">
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-white mb-4">Invite Your Team</h2>
                            <p className="text-zinc-400 mb-6">
                                Value chat is designed for collaboration. Invite agents to manage specific channels or collaborate on a unified team inbox.
                            </p>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 list-none p-0 mb-6">
                                <li className="bg-white/5 border border-white/5 rounded-xl p-4 flex items-center gap-3">
                                    <UserPlusIcon className="w-5 h-5 text-indigo-400 shrink-0" />
                                    <span className="text-sm text-zinc-300">Invite via Magic Link</span>
                                </li>
                                <li className="bg-white/5 border border-white/5 rounded-xl p-4 flex items-center gap-3">
                                    <ChatBubbleLeftRightIcon className="w-5 h-5 text-emerald-400 shrink-0" />
                                    <span className="text-sm text-zinc-300">Shared Inbox View</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Step 3 */}
                <section className="relative pl-12">
                    <div className="absolute left-0 top-0 w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center font-black text-white border border-white/5">3</div>
                    <div className="flex items-start gap-6">
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-white mb-4">Launch Your First AI Agent</h2>
                            <p className="text-zinc-400 mb-6">
                                Don't just chat—automate. Use our No-Code Agent builder to create an AI that answers customer questions, qualifies leads, and book appointments 24/7.
                            </p>
                            <Link to="/help/ai-agents" className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-all border border-white/10">
                                Explore AI Agents
                            </Link>
                        </div>
                    </div>
                </section>
            </div>

            <div className="mt-20 p-8 rounded-3xl bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-500/20 relative overflow-hidden">
                <div className="relative z-10">
                    <h3 className="text-xl font-bold text-white mb-2">Need a demo?</h3>
                    <p className="text-zinc-300 mb-6 max-w-xl">
                        Schedule a 15-minute onboarding call with our technical team to help you set up your first 10 automations.
                    </p>
                    <a href="https://cal.com/valuewats" className="text-white bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-lg font-bold transition-all inline-block">
                        Book Onboarding
                    </a>
                </div>
            </div>
        </HelpCenterLayout>
    );
}
