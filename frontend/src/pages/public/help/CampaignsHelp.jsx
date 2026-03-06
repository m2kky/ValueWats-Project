import React from 'react';
import { Link } from 'react-router-dom';
import HelpCenterLayout from '../../../components/public/HelpCenterLayout';
import { 
    MegaphoneIcon, 
    ShieldCheckIcon, 
    ArrowUpTrayIcon,
    ChevronRightIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export default function CampaignsHelp() {
    return (
        <HelpCenterLayout title="Campaigns & Broadcasts Guide" lastUpdated="March 2026">
            <div className="flex items-center gap-2 mb-10 text-sm font-medium">
                <Link to="/help" className="text-zinc-500 hover:text-white transition-colors">Help Center</Link>
                <ChevronRightIcon className="w-4 h-4 text-zinc-700" />
                <span className="text-zinc-300">Campaigns</span>
            </div>

            <h1 className="text-4xl font-black text-white mb-6 tracking-tight">Running High-Impact Campaigns</h1>
            <p className="text-lg text-zinc-400 mb-12 leading-relaxed max-w-3xl">
                Broadcasting is the most powerful way to reach your customers. ValueWats uses a proprietary Anti-Ban engine to ensure your messages land safely.
            </p>

            <div className="space-y-16">
                {/* Anti-Ban */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <ShieldCheckIcon className="w-8 h-8 text-emerald-400" />
                        <h2 className="text-2xl font-bold text-white">The Anti-Ban System</h2>
                    </div>
                    <p className="text-zinc-500 mb-6 leading-relaxed">
                        To protect your WhatsApp account from being flagged as "Spam", ValueWats mimics human behavior through several advanced techniques:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                            <h4 className="text-white font-bold mb-2 text-sm uppercase tracking-wide">Dynamic Delays</h4>
                            <p className="text-xs text-zinc-500">Adds random pauses between messages (e.g. 15-30s) so delivery isn't perfectly rhythmic.</p>
                        </div>
                        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                            <h4 className="text-white font-bold mb-2 text-sm uppercase tracking-wide">Human Simulation</h4>
                            <p className="text-xs text-zinc-500">Shows a "typing..." status for several seconds before actually sending the message.</p>
                        </div>
                        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                            <h4 className="text-white font-bold mb-2 text-sm uppercase tracking-wide">Text Variation</h4>
                            <p className="text-xs text-zinc-500">Injects invisible markers and uses Spintax to ensure every message is unique.</p>
                        </div>
                    </div>
                </section>

                {/* Safety Tips */}
                <section className="bg-red-500/5 border border-red-500/10 rounded-3xl p-8">
                    <div className="flex items-center gap-3 mb-4">
                        <ExclamationTriangleIcon className="w-6 h-6 text-red-400" />
                        <h3 className="text-xl font-bold text-white">Safety Tips & Best Practices</h3>
                    </div>
                    <ul className="space-y-4 list-none p-0 m-0">
                        <li className="flex gap-4">
                            <div className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 shrink-0"></div>
                            <p className="text-sm text-zinc-400"><strong>Start Slow:</strong> New accounts should start with 50-100 messages/day and gradually ramp up.</p>
                        </li>
                        <li className="flex gap-4">
                            <div className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 shrink-0"></div>
                            <p className="text-sm text-zinc-400"><strong>Use Variables:</strong> Always personalize your messages with <code>{"{{name}}"}</code> to increase engagement and reduce spam reports.</p>
                        </li>
                    </ul>
                </section>

                {/* Launching */}
                <section>
                    <h2 className="text-2xl font-bold text-white mb-6">Launching a Campaign</h2>
                    <div className="flex flex-col md:flex-row gap-8">
                        <div className="flex-1">
                            <div className="flex gap-4 mb-4">
                                <ArrowUpTrayIcon className="w-6 h-6 text-blue-400" />
                                <h4 className="text-white font-bold">1. Upload Audience</h4>
                            </div>
                            <p className="text-sm text-zinc-500">Import your list via CSV/Excel or select from your existing CRM contacts and labels.</p>
                        </div>
                        <div className="flex-1">
                            <div className="flex gap-4 mb-4">
                                <MegaphoneIcon className="w-6 h-6 text-indigo-400" />
                                <h4 className="text-white font-bold">2. Track Results</h4>
                            </div>
                            <p className="text-sm text-zinc-500">Monitor deliveries, reads, and failed messages in real-time on your Campaign Dashboard.</p>
                        </div>
                    </div>
                </section>
            </div>
        </HelpCenterLayout>
    );
}
