import { NavLink } from 'react-router-dom';
import PublicLayout from './PublicLayout';

const legalLinks = [
    { name: 'Privacy Policy', path: '/privacy' },
    { name: 'Terms of Service', path: '/terms' },
    { name: 'Cookie Policy', path: '/cookie-policy' },
    { name: 'Security', path: '/security' },
    { name: 'Subprocessors', path: '/subprocessors' },
    { name: 'Data Protection Addendum', path: '/dpa' },
];

export default function LegalLayout({ children, title, lastUpdated }) {
    return (
        <PublicLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 lg:flex lg:gap-16">

                {/* Sidebar Nav */}
                <aside className="lg:w-64 shrink-0 mb-12 lg:mb-0">
                    <div className="sticky top-32">
                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">
                            Legal & Security Hub
                        </h3>
                        <nav className="flex flex-col gap-1">
                            {legalLinks.map((link) => (
                                <NavLink
                                    key={link.name}
                                    to={link.path}
                                    className={({ isActive }) =>
                                        `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                                            ? 'bg-indigo-500/10 text-indigo-400'
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
                                Have questions about our policies? Contact our legal team at <a href="mailto:legal@valuewats.com" className="text-indigo-400 hover:text-indigo-300">legal@valuewats.com</a>
                            </p>
                        </div>
                    </div>
                </aside>

                {/* Content Area */}
                <div className="flex-1 bg-[#111113] rounded-3xl border border-white/5 p-8 md:p-12 shadow-2xl relative overflow-hidden">
                    {/* Subtle glow */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2"></div>

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

                        <div className="prose prose-invert prose-indigo max-w-none text-zinc-300">
                            {children}
                        </div>
                    </div>
                </div>

            </div>
        </PublicLayout>
    );
}
