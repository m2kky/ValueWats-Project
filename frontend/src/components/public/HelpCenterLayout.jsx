import { NavLink } from 'react-router-dom';
import PublicLayout from './PublicLayout';

const helpLinks = [
    { name: 'Help Center Home', path: '/resources/support' },
    { name: 'Getting Started', path: '/resources/support/getting-started' },
    { name: 'Smart Inbox', path: '/resources/support/inbox' },
    { name: 'Campaigns & Broadcasts', path: '/resources/support/campaigns' },
    { name: 'AI Agents', path: '/resources/support/agents' },
    { name: 'Settings & Automations', path: '/resources/support/settings' },
];

export default function HelpCenterLayout({ children, title, lastUpdated }) {
    return (
        <PublicLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 lg:flex lg:gap-16">

                {/* Sidebar Nav */}
                <aside className="lg:w-64 shrink-0 mb-12 lg:mb-0">
                    <div className="sticky top-32">
                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">
                            Help Center
                        </h3>
                        <nav className="flex flex-col gap-1">
                            {helpLinks.map((link) => (
                                <NavLink
                                    key={link.name}
                                    to={link.path}
                                    end={link.path === '/resources/support'}
                                    className={({ isActive }) =>
                                        `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                                            ? 'bg-blue-500/10 text-blue-400'
                                            : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                        }`
                                    }
                                >
                                    {link.name}
                                </NavLink>
                            ))}
                        </nav>

                        <div className="mt-8 pt-6 border-t border-white/5">
                            <p className="text-xs text-zinc-500">
                                Still need help? Contact our support team at <a href="mailto:support@valuewats.com" className="text-blue-400 hover:text-blue-300">support@valuewats.com</a>
                            </p>
                        </div>
                    </div>
                </aside>

                {/* Content Area */}
                <div className="flex-1 bg-[#111113] rounded-3xl border border-white/5 p-8 md:p-12 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2"></div>

                    <div className="relative z-10">
                        <header className="mb-10 pb-8 border-b border-white/5">
                            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                                {title}
                            </h1>
                            {lastUpdated && (
                                <p className="text-sm text-zinc-500">
                                    Last Updated: {lastUpdated}
                                </p>
                            )}
                        </header>

                        <div className="prose prose-invert prose-blue max-w-none text-zinc-300">
                            {children}
                        </div>
                    </div>
                </div>

            </div>
        </PublicLayout>
    );
}
