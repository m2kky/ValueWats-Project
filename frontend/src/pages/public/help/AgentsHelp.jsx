import React from 'react';
import { Link } from 'react-router-dom';
import HelpCenterLayout from '../../../components/public/HelpCenterLayout';
import { 
    BeakerIcon, 
    BookOpenIcon, 
    AcademicCapIcon,
    ChevronRightIcon,
    CpuChipIcon
} from '@heroicons/react/24/outline';

export default function AgentsHelp() {
    return (
        <HelpCenterLayout title="AI Agents (Neural Lab) Guide" lastUpdated="March 2026">
            <div className="flex items-center gap-2 mb-10 text-sm font-medium">
                <Link to="/help" className="text-zinc-500 hover:text-white transition-colors">Help Center</Link>
                <ChevronRightIcon className="w-4 h-4 text-zinc-700" />
                <span className="text-zinc-300">AI Agents</span>
            </div>

            <h1 className="text-4xl font-black text-white mb-6 tracking-tight">Deploying Intelligent Agents</h1>
            <p className="text-lg text-zinc-400 mb-12 leading-relaxed max-w-3xl">
                The Neural Lab is where you build agents that don't just chat—they reason, learn from your docs, and perform real-world actions on your behalf.
            </p>

            <div className="space-y-16">
                {/* RAG Section */}
                <section>
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                            <BookOpenIcon className="w-6 h-6 text-blue-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">Knowledge Base (RAG)</h2>
                    </div>
                    <p className="text-zinc-400 mb-6 leading-relaxed">
                        Your agent is only as smart as the information you provide. ValueWats uses <strong>Retrieval-Augmented Generation (RAG)</strong> to give your bots a long-term memory.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-6 bg-[#111113] border border-white/5 rounded-2xl">
                            <h4 className="text-white font-bold mb-2">Multi-Format Uploads</h4>
                            <p className="text-sm text-zinc-500">Upload PDFs, text files, or paste raw notes. We automatically chunk and index your data.</p>
                        </div>
                        <div className="p-6 bg-[#111113] border border-white/5 rounded-2xl">
                            <h4 className="text-white font-bold mb-2">Semantic Search</h4>
                            <p className="text-sm text-zinc-500">Every user query triggers a semantic search through your docs to find the most relevant answer bits.</p>
                        </div>
                    </div>
                </section>

                {/* Autonomy Section */}
                <section>
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center">
                            <CpuChipIcon className="w-6 h-6 text-indigo-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">Autonomous Decision Making</h2>
                    </div>
                    <p className="text-zinc-400 mb-8 leading-relaxed">
                        Standard bots follow flowcharts. ValueWats agents follow <strong>intentions</strong>. You can give them high-level tools to manage your CRM autonomously.
                    </p>
                    <div className="space-y-4">
                        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center gap-6">
                            <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded text-[10px] font-black text-amber-400 uppercase tracking-widest">Tools</div>
                            <p className="text-sm text-zinc-300 m-0">Enable <strong>Google Calendar</strong> for appointment booking via chat.</p>
                        </div>
                        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center gap-6">
                            <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-[10px] font-black text-emerald-400 uppercase tracking-widest">Macros</div>
                            <p className="text-sm text-zinc-300 m-0">Enable automatic <strong>Lifecycle Switching</strong> based on user sentiment.</p>
                        </div>
                    </div>
                </section>
            </div>

            <div className="mt-20 flex items-center gap-6 p-8 bg-zinc-900/50 border border-white/5 rounded-3xl">
                <AcademicCapIcon className="w-10 h-10 text-zinc-600 shrink-0" />
                <div>
                    <h4 className="text-white font-bold mb-1">Advanced Neural Training</h4>
                    <p className="text-sm text-zinc-500 m-0">Learn how to fine-tune your agent's creative temperature and top-p sampling for precise customer service.</p>
                </div>
            </div>
        </HelpCenterLayout>
    );
}
