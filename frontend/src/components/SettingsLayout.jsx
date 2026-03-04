import { NavLink, Outlet } from 'react-router-dom';
import {
    Cog6ToothIcon,
    UsersIcon,
    TagIcon,
    QueueListIcon,
    AdjustmentsVerticalIcon,
    ArrowPathRoundedSquareIcon,
    DocumentTextIcon,
    BookOpenIcon,
    BoltIcon
} from '@heroicons/react/24/outline';

const settingsNav = [
    { name: 'General Settings', path: '/settings/general', icon: Cog6ToothIcon },
    { name: 'Users & Roles', path: '/settings/users', icon: UsersIcon },
    { name: 'Contact Fields', path: '/settings/contact-fields', icon: AdjustmentsVerticalIcon },
    { name: 'Tags', path: '/settings/tags', icon: TagIcon },
    { name: 'Lifecycle Stages', path: '/settings/lifecycle', icon: QueueListIcon },
    { name: 'Stage Automation', path: '/settings/automation', icon: BoltIcon },
    { name: 'Snippets', path: '/settings/snippets', icon: DocumentTextIcon },
    { name: 'AI Knowledge', path: '/settings/ai-knowledge', icon: BookOpenIcon },
    { name: 'Integrations', path: '/settings/integrations', icon: ArrowPathRoundedSquareIcon },
];

export default function SettingsLayout() {
    return (
        <div className="flex h-full gap-8">
            {/* Settings Internal Sidebar */}
            <aside className="w-64 shrink-0 bg-[#0f0f11] rounded-2xl border border-white/5 p-4 self-start">
                <h2 className="text-xs font-black text-zinc-500 uppercase tracking-widest px-3 mb-4 italic">
                    Workspace Settings
                </h2>
                <nav className="space-y-1">
                    {settingsNav.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${isActive
                                    ? 'bg-indigo-600/10 text-indigo-400 font-bold border border-indigo-600/20 shadow-[0_0_15px_rgba(99,102,241,0.05)]'
                                    : 'text-zinc-400 hover:bg-white/5 hover:text-white border border-transparent'
                                }`
                            }
                        >
                            <item.icon className="w-4 h-4" />
                            <span>{item.name}</span>
                        </NavLink>
                    ))}
                </nav>
            </aside>

            {/* Settings Content Area */}
            <div className="flex-1 min-w-0 h-full overflow-y-auto pr-2 custom-scrollbar">
                <Outlet />
            </div>
        </div>
    );
}
