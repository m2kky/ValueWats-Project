import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import {
    InboxIcon,
    UserIcon,
    UserMinusIcon,
    UsersIcon,
    CpuChipIcon,
    PlusIcon,
    Cog6ToothIcon,
    TagIcon,
    BoltIcon
} from '@heroicons/react/24/outline';

export default function InboxFiltersSidebar({ conversations, activeFilter, setActiveFilter }) {
    const navigate = useNavigate();
    const [stages, setStages] = useState([]);
    const [labels, setLabels] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [stagesRes, labelsRes] = await Promise.all([
                    api.get('/chat/lifecycle-stages').catch(() => ({ data: { stages: [] } })),
                    api.get('/chat/labels').catch(() => ({ data: { labels: [] } }))
                ]);
                setStages(stagesRes.data.stages || []);
                setLabels(labelsRes.data.labels || []);
            } catch (error) {
                console.error('Failed to fetch filter data', error);
            }
        };
        fetchData();
    }, []);

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const allCount = conversations.length;
    const unassignedCount = conversations.filter(c => !c.assignedUserId && !c.currentAgentId).length;
    const mineCount = conversations.filter(c => c.assignedUserId === user.id).length;
    const teamCount = conversations.filter(c => !!c.assignedUserId).length;
    const botCount = conversations.filter(c => !!c.currentAgentId).length;

    const FilterBtn = ({ filterKey, icon: Icon, label, count, onClick }) => (
        <button
            onClick={onClick || (() => setActiveFilter(filterKey))}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${activeFilter === filterKey ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}
        >
            <div className="flex items-center gap-3">
                <Icon className="w-[18px] h-[18px]" />
                <span className="text-sm font-medium">{label}</span>
            </div>
            {count !== undefined && <span className="text-xs text-zinc-500 font-medium">{count}</span>}
        </button>
    );

    return (
        <aside className="w-[260px] bg-[#0f0f11] border-r border-white/5 flex flex-col h-full shrink-0">
            <div className="p-4 flex items-center justify-between mb-2 mt-2">
                <h2 className="text-[1.1rem] font-bold text-white tracking-wide">Inbox</h2>
                <div className="flex items-center gap-1">
                    <button className="text-zinc-500 hover:text-white transition-colors p-1" title="Settings">
                        <Cog6ToothIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3 space-y-6 pb-4 custom-scrollbar">
                {/* Main Filters */}
                <div className="space-y-0.5">
                    <FilterBtn filterKey="all" icon={InboxIcon} label="All Chats" count={allCount} />
                    <FilterBtn filterKey="mine" icon={UserIcon} label="Mine" count={mineCount} />
                    <FilterBtn filterKey="unassigned" icon={UserMinusIcon} label="Unassigned" count={unassignedCount} />
                    <FilterBtn filterKey="team" icon={UsersIcon} label="Team Inbox" count={teamCount} />
                    <FilterBtn filterKey="bot" icon={CpuChipIcon} label="AI Bot Chats" count={botCount} />
                </div>

                {/* Create AI Agent — navigates to /agents */}
                <div className="space-y-0.5">
                    <div className="px-3 pb-1">
                        <span className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">Automation</span>
                    </div>
                    <button
                        onClick={() => navigate('/agents')}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-zinc-400 hover:bg-indigo-500/10 hover:text-indigo-400 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <BoltIcon className="w-[18px] h-[18px]" />
                            <span className="text-sm font-medium">Create AI Agent</span>
                        </div>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 uppercase tracking-wider border border-blue-500/20">New</span>
                    </button>
                </div>

                {/* Lifecycle Stages */}
                {stages.length > 0 && (
                    <div>
                        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-3 mb-2">Lifecycle</h3>
                        <div className="space-y-0.5">
                            {stages.map(stage => {
                                const count = conversations.filter(c => c.lifecycleStageId === stage.id).length;
                                const filterKey = `stage_${stage.id}`;
                                return (
                                    <button
                                        key={stage.id}
                                        onClick={() => setActiveFilter(filterKey)}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${activeFilter === filterKey ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color || '#3b82f6' }}></span>
                                            <span className="text-sm font-medium">{stage.name}</span>
                                        </div>
                                        <span className="text-xs text-zinc-500 font-medium">{count}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Labels */}
                {labels.length > 0 && (
                    <div>
                        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-3 mb-2 flex items-center gap-1.5">
                            <TagIcon className="w-3.5 h-3.5" /> Labels
                        </h3>
                        <div className="space-y-0.5">
                            {labels.map(label => {
                                const filterKey = `label_${label}`;
                                const count = conversations.filter(c => (c.labels || []).includes(label)).length;
                                return (
                                    <button
                                        key={label}
                                        onClick={() => setActiveFilter(filterKey)}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${activeFilter === filterKey ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                            <span className="text-sm font-medium">{label}</span>
                                        </div>
                                        <span className="text-xs text-zinc-500 font-medium">{count}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Custom Inbox — Coming Soon */}
                <div className="space-y-0.5">
                    <div className="px-3 pb-1">
                        <span className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">Custom</span>
                    </div>
                    <button
                        onClick={() => alert('Custom Inbox — Coming soon! You will be able to create saved filters here.')}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-zinc-500 hover:bg-white/5 hover:text-zinc-400 transition-colors group"
                    >
                        <div className="flex items-center gap-3">
                            <InboxIcon className="w-[18px] h-[18px]" />
                            <span className="text-sm font-medium">Custom Inbox</span>
                        </div>
                        <PlusIcon className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                </div>
            </div>
        </aside>
    );
}
