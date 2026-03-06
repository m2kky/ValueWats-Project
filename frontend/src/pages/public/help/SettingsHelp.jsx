import React from 'react';
import { Link } from 'react-router-dom';
import HelpCenterLayout from '../../../components/public/HelpCenterLayout';
import { 
    Cog6ToothIcon, 
    TableCellsIcon, 
    AdjustmentsHorizontalIcon,
    ChevronRightIcon,
    VariableIcon
} from '@heroicons/react/24/outline';

export default function SettingsHelp() {
    return (
        <HelpCenterLayout title="Settings & Customization Guide" lastUpdated="March 2026">
            <div className="flex items-center gap-2 mb-10 text-sm font-medium">
                <Link to="/help" className="text-zinc-500 hover:text-white transition-colors">Help Center</Link>
                <ChevronRightIcon className="w-4 h-4 text-zinc-700" />
                <span className="text-zinc-300">Settings</span>
            </div>

            <h1 className="text-4xl font-black text-white mb-6 tracking-tight">Platform Customization</h1>
            <p className="text-lg text-zinc-400 mb-12 leading-relaxed max-w-3xl">
                ValueWats is a modular platform. You can customize the schema, labels, and automation rules to fit your specific business industry and workflow.
            </p>

            <div className="space-y-16">
                {/* Custom Fields */}
                <section>
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center">
                            <TableCellsIcon className="w-6 h-6 text-amber-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">Contact Attributes</h2>
                    </div>
                    <p className="text-zinc-400 mb-6 leading-relaxed">
                        Capture the data that matters. In <strong>Settings {">"} Contact Fields</strong>, you can define attributes like <i>"Customer Tier"</i>, <i>"Product Interest"</i>, or <i>"Lead Score"</i>.
                    </p>
                    <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                        <div className="flex items-center gap-3 mb-2">
                            <VariableIcon className="w-4 h-4 text-zinc-500" />
                            <h4 className="text-white font-bold text-sm">Automated Injection</h4>
                        </div>
                        <p className="text-xs text-zinc-500 leading-relaxed">
                            These fields aren't just for viewing. You can use dynamic variables inside your message templates to inject contact specific data automatically.
                        </p>
                    </div>
                </section>

                {/* Pipeline Section */}
                <section>
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                            <AdjustmentsHorizontalIcon className="w-6 h-6 text-emerald-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">Lifecycle & Pipelines</h2>
                    </div>
                    <p className="text-zinc-400 mb-8 leading-relaxed">
                        Map out your customer journey. Create a custom Kanban pipeline to track leads as they move from first contact to a closed deal.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-6 bg-[#111113] border border-white/5 rounded-2xl">
                            <h4 className="text-white font-bold mb-2">Color-coded Tags</h4>
                            <p className="text-sm text-zinc-500">Visually categorize conversations using high-contrast labels for quick triage.</p>
                        </div>
                        <div className="p-6 bg-[#111113] border border-white/5 rounded-2xl">
                            <h4 className="text-white font-bold mb-2">SLA Policies</h4>
                            <p className="text-sm text-zinc-500">Define response time targets for your support team based on priority tags.</p>
                        </div>
                    </div>
                </section>
            </div>

            <div className="mt-20 p-8 rounded-3xl bg-zinc-900/50 border border-white/5 flex items-center justify-between">
                <div>
                    <h3 className="text-white font-bold mb-1">Advanced API Docs</h3>
                    <p className="text-sm text-zinc-500 m-0">Need more technical depth? Check our developer documentation.</p>
                </div>
                <Link to="/settings" className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all">
                    <Cog6ToothIcon className="w-6 h-6 text-zinc-400" />
                </Link>
            </div>
        </HelpCenterLayout>
    );
}
