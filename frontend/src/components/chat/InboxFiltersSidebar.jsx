import {
    InboxIcon,
    UserIcon,
    UserMinusIcon,
    PhoneArrowDownLeftIcon,
    CpuChipIcon,
    PlusIcon,
    Cog6ToothIcon
} from '@heroicons/react/24/outline';

export default function InboxFiltersSidebar({ conversations }) {
    const allCount = conversations.length;
    // Mock counts based on screenshot
    const unassignedCount = conversations.filter(c => !c.assignedTo).length;
    const mineCount = conversations.length - unassignedCount;

    return (
        <aside className="w-[260px] bg-[#0f0f11] border-r border-white/5 flex flex-col h-full shrink-0">
            <div className="p-4 flex items-center justify-between mb-2 mt-2">
                <h2 className="text-[1.1rem] font-bold text-white tracking-wide">Inbox</h2>
                <button className="text-zinc-500 hover:text-white transition-colors">
                    <Cog6ToothIcon className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 space-y-6 pb-4 custom-scrollbar">
                {/* Main Filters */}
                <div className="space-y-0.5">
                    <button className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 text-white">
                        <div className="flex items-center gap-3">
                            <InboxIcon className="w-[18px] h-[18px] text-zinc-400" />
                            <span className="text-sm font-medium">All</span>
                        </div>
                        <span className="text-xs text-zinc-500 font-medium">{allCount}</span>
                    </button>

                    <button className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-zinc-400 hover:bg-white/5 hover:text-white transition-colors">
                        <div className="flex items-center gap-3">
                            <UserIcon className="w-[18px] h-[18px]" />
                            <span className="text-sm font-medium">Mine</span>
                        </div>
                        <span className="text-xs text-zinc-500 font-medium">{mineCount}</span>
                    </button>

                    <button className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-zinc-400 hover:bg-white/5 hover:text-white transition-colors">
                        <div className="flex items-center gap-3">
                            <UserMinusIcon className="w-[18px] h-[18px]" />
                            <span className="text-sm font-medium">Unassigned</span>
                        </div>
                        <span className="text-xs text-zinc-500 font-medium">{unassignedCount}</span>
                    </button>

                    <button className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-zinc-400 hover:bg-white/5 hover:text-white transition-colors">
                        <div className="flex items-center gap-3">
                            <PhoneArrowDownLeftIcon className="w-[18px] h-[18px]" />
                            <span className="text-sm font-medium">Incoming Calls</span>
                        </div>
                    </button>

                    <button className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-zinc-400 hover:bg-white/5 hover:text-white transition-colors mt-2">
                        <div className="flex items-center gap-3">
                            <CpuChipIcon className="w-[18px] h-[18px]" />
                            <span className="text-sm font-medium">Create AI Agent</span>
                        </div>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 uppercase tracking-wider border border-blue-500/20">Auto</span>
                    </button>
                </div>

                {/* Lifecycle */}
                <div>
                    <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-3 mb-2">Lifecycle</h3>
                    <div className="space-y-0.5">
                        <button className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-zinc-400 hover:bg-white/5 hover:text-white transition-colors">
                            <div className="flex items-center gap-3">
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                                <span className="text-sm font-medium">New Lead</span>
                            </div>
                            <span className="text-xs text-zinc-500 font-medium">1</span>
                        </button>
                        <button className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-zinc-400 hover:bg-white/5 hover:text-white transition-colors">
                            <div className="flex items-center gap-3">
                                <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                                <span className="text-sm font-medium">Hot Lead</span>
                            </div>
                        </button>
                        <button className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-zinc-400 hover:bg-white/5 hover:text-white transition-colors">
                            <div className="flex items-center gap-3">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                                <span className="text-sm font-medium">Payment</span>
                            </div>
                        </button>
                        <button className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-zinc-400 hover:bg-white/5 hover:text-white transition-colors">
                            <div className="flex items-center gap-3">
                                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                                <span className="text-sm font-medium">Customer</span>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Folders */}
                <div className="space-y-1">
                    <button className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-zinc-400 hover:bg-white/5 hover:text-white transition-colors group">
                        <span className="text-xs font-semibold uppercase tracking-wider">Team Inbox</span>
                        <PlusIcon className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                    <button className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-zinc-400 hover:bg-white/5 hover:text-white transition-colors group">
                        <span className="text-xs font-semibold uppercase tracking-wider">AI Instance emulator</span>
                        <PlusIcon className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                    <button className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-zinc-400 hover:bg-white/5 hover:text-white transition-colors group">
                        <span className="text-xs font-semibold uppercase tracking-wider">Custom Inbox</span>
                        <PlusIcon className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                </div>
            </div>
        </aside>
    );
}
