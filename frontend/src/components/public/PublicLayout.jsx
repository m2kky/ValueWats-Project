import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const MegaMenuDropdown = ({ title, children, isOpen, onMouseEnter, onMouseLeave }) => {
  return (
    <div
      className="relative"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <button className={`flex items-center space-x-1 px-4 py-2 rounded-md text-[15px] font-medium transition-colors ${isOpen ? 'text-white bg-white/5' : 'text-zinc-300 hover:text-white'}`}>
        <span>{title}</span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-white' : 'text-zinc-500'}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Content */}
      <div
        className={`absolute top-full left-1/2 -translate-x-1/2 pt-2 transition-all duration-200 ease-out origin-top ${isOpen ? 'opacity-100 scale-y-100 translate-y-0 visible' : 'opacity-0 scale-y-95 -translate-y-2 invisible'}`}
        style={{ zIndex: 100 }}
      >
        <div className="bg-[#111111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden w-[92vw] max-w-sm sm:max-w-md md:max-w-lg lg:max-w-4xl xl:max-w-[1000px] p-8 relative before:absolute before:-top-4 before:left-0 before:w-full before:h-4 before:bg-transparent">
          {children}
        </div>
      </div>
    </div>
  );
};

const MegaMenuItem = ({ to, icon, title, badge, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className="flex items-center p-3 -mx-3 rounded-lg hover:bg-white/5 transition-colors group cursor-pointer relative z-10"
  >
    <div className="flex-shrink-0 text-zinc-400 group-hover:text-white transition-colors">
      {icon}
    </div>
    <div className="ml-3 flex items-center">
      <h4 className="text-[15px] font-medium text-zinc-300 group-hover:text-white transition-colors">{title}</h4>
      {badge && (
        <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-500">
          {badge}
        </span>
      )}
    </div>
  </Link>
);

function PublicLayout({ children }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setActiveMenu(null);
  }, [location.pathname]);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const handleMenuEnter = (menu) => setActiveMenu(menu);
  const handleMenuLeave = () => setActiveMenu(null);

  return (
    <div className="min-h-screen bg-[#232318] text-zinc-300 font-sans selection:bg-[#e2f300]/30 selection:text-[#232318] flex flex-col">
      {/* Dynamic Navbar */}
      <nav
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${isScrolled
          ? 'bg-[#232318]/90 backdrop-blur-xl border-b border-white/5 py-4'
          : 'bg-transparent py-6'
          }`}
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">

            {/* Logo container + Main Nav (Desktop) */}
            <div className="flex items-center">
              {/* Logo */}
              {/* Logo */}
              <Link to="/" className="flex items-center group mr-8">
                <img src="/main-logo.svg" alt="Value chat" className="w-8 h-8 mr-2" />
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400 group-hover:to-white transition-colors">
                  Value chat
                </span>
              </Link>

              {/* Desktop Navigation - Mega Menus */}
              <div className="hidden md:flex items-center space-x-2">

                {/* Product Mega Menu */}
                <MegaMenuDropdown
                  title="Product"
                  isOpen={activeMenu === 'product'}
                  onMouseEnter={() => handleMenuEnter('product')}
                  onMouseLeave={handleMenuLeave}
                >
                  <div className="grid grid-cols-4 gap-x-8 gap-y-4">
                    {/* Column 1 */}
                    <div>
                      <h3 className="text-xs font-semibold text-zinc-500 mb-4">Capture Leads</h3>
                      <div className="space-y-1">
                        <MegaMenuItem onClick={handleMenuLeave} to="/#features" title="Omnichannel Inbox" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>} />
                        <MegaMenuItem onClick={handleMenuLeave} to="/#features" title="WhatsApp Business" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>} />
                        <MegaMenuItem onClick={handleMenuLeave} to="/#features" title="Web Chat widgets" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>} />
                      </div>
                    </div>

                    {/* Column 2 */}
                    <div>
                      <h3 className="text-xs font-semibold text-zinc-500 mb-4">Convert Leads</h3>
                      <div className="space-y-1">
                        <MegaMenuItem onClick={handleMenuLeave} to="/#ai" title="AI Agents" badge="NEW" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>} />
                        <MegaMenuItem onClick={handleMenuLeave} to="/#features" title="Visual Workflows" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>} />
                        <MegaMenuItem onClick={handleMenuLeave} to="/#features" title="Team Inbox" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>} />
                      </div>
                    </div>

                    {/* Column 3 */}
                    <div>
                      <h3 className="text-xs font-semibold text-zinc-500 mb-4">Retain Customers</h3>
                      <div className="space-y-1">
                        <MegaMenuItem onClick={handleMenuLeave} to="/#features" title="Bulk Campaigns" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path></svg>} />
                        <MegaMenuItem onClick={handleMenuLeave} to="/#features" title="Conversational Support" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>} />
                      </div>
                    </div>

                    {/* Column 4 */}
                    <div>
                      <h3 className="text-xs font-semibold text-zinc-500 mb-4">Scale with Value chat</h3>
                      <div className="space-y-1">
                        <MegaMenuItem onClick={handleMenuLeave} to="/api-docs" title="Developer API" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>} />
                        <MegaMenuItem onClick={handleMenuLeave} to="/integrations" title="Integrations" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>} />
                      </div>
                    </div>
                  </div>
                </MegaMenuDropdown>

                {/* Resources Mega Menu */}
                <MegaMenuDropdown
                  title="Resources"
                  isOpen={activeMenu === 'resources'}
                  onMouseEnter={() => handleMenuEnter('resources')}
                  onMouseLeave={handleMenuLeave}
                >
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <h3 className="text-xs font-semibold text-zinc-500 mb-4">Learn</h3>
                      <div className="space-y-1">
                        <MegaMenuItem onClick={handleMenuLeave} to="/resources/learn" title="Blog" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-.2-2.7l-4-4"></path></svg>} />
                        <MegaMenuItem onClick={handleMenuLeave} to="/resources/support" title="Help Center" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>} />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-zinc-500 mb-4">Discover</h3>
                      <div className="space-y-1">
                        <MegaMenuItem onClick={handleMenuLeave} to="/resources/tools" title="Free Tools" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>} />
                        <MegaMenuItem onClick={handleMenuLeave} to="/success-stories" title="Success Stories" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"></path></svg>} />
                      </div>
                    </div>
                    <div className="bg-zinc-800/20 -m-8 p-8 ml-0 border-l border-white/5 flex flex-col justify-between">
                      <div>
                        <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider block mb-3">Latest Guide</span>
                        <h4 className="text-white font-medium text-[15px] mb-2 leading-snug">Scaling Support with Generative AI Agents</h4>
                        <p className="text-zinc-400 text-sm leading-relaxed">Discover how to deflect 40% of queries safely on WhatsApp using our new Agentic AI features.</p>
                      </div>
                      <Link to="/resources/learn" className="text-[#e2f300] text-sm font-medium hover:text-[#f2ff4f] mt-4 inline-flex items-center group">Read guide <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg></Link>
                    </div>
                  </div>
                </MegaMenuDropdown>

                <Link to="/pricing" className="px-4 py-2 text-[15px] font-medium text-zinc-300 hover:text-white transition-colors">Pricing</Link>
                <Link to="/why-us" className="px-4 py-2 text-[15px] font-medium text-zinc-300 hover:text-white transition-colors">Why Us</Link>
              </div>
            </div>

            {/* CTA Buttons (Desktop) */}
            <div className="hidden md:flex items-center space-x-3">
              <Link className="px-2 py-2 text-zinc-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </Link>
              <Link to="/login" className="px-3 py-2 text-[15px] font-medium text-zinc-300 hover:text-white transition-colors">
                Login
              </Link>
              <Link to="/contact" className="px-4 py-2 rounded-md text-[15px] font-medium text-white border border-white/10 hover:bg-white/5 transition-colors">
                Talk to Sales
              </Link>
              <Link to="/register" className="px-4 py-2 rounded-md text-[15px] font-medium bg-[#e2f300] text-[#232318] hover:bg-[#f2ff4f] transition-colors shadow-lg shadow-[rgba(226,243,0,0.25)]">
                Start Free Trial
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={toggleMobileMenu}
                className="text-zinc-400 hover:text-white focus:outline-none p-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-zinc-900 border-b border-zinc-800 shadow-2xl py-4 px-4 overflow-y-auto max-h-[80vh]">
            <div className="flex flex-col space-y-2">
              <div className="text-xs font-bold tracking-wider text-zinc-500 uppercase px-3 py-2 mt-2">Product</div>
              <Link to="/#features" className="block px-3 py-2 rounded-md text-base font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 pl-6">Omnichannel Inbox</Link>
              <Link to="/#features" className="block px-3 py-2 rounded-md text-base font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 pl-6">Workflows</Link>
              <Link to="/#features" className="block px-3 py-2 rounded-md text-base font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 pl-6">AI Agents</Link>

              <div className="text-xs font-bold tracking-wider text-zinc-500 uppercase px-3 py-2 mt-4">Resources</div>
              <Link to="/resources/learn" className="block px-3 py-2 rounded-md text-base font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 pl-6">Blog & Guides</Link>
              <Link to="/resources/support" className="block px-3 py-2 rounded-md text-base font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 pl-6">Help Center</Link>
              <Link to="/resources/tools" className="block px-3 py-2 rounded-md text-base font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 pl-6">Free Tools</Link>

              <div className="text-xs font-bold tracking-wider text-zinc-500 uppercase px-3 py-2 mt-4">Company</div>
              <Link to="/about" className="block px-3 py-2 rounded-md text-base font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 pl-6">About Us</Link>
              <Link to="/why-us" className="block px-3 py-2 rounded-md text-base font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 pl-6">Why Us?</Link>
              <Link to="/roadmap" className="block px-3 py-2 rounded-md text-base font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 pl-6">Roadmap</Link>

              <div className="border-t border-zinc-800 my-4 pt-4">
                <Link to="/pricing" className="block px-3 py-2 rounded-md text-base font-medium text-zinc-300 hover:text-white">Pricing</Link>
              </div>

              <div className="flex flex-col space-y-3 pt-4 border-t border-zinc-800">
                <Link to="/login" className="block w-full text-center px-4 py-3 rounded-lg text-base font-medium border border-zinc-700 text-white hover:bg-zinc-800">
                  Log in
                </Link>
                <Link to="/register" className="block w-full text-center px-4 py-3 rounded-lg text-base font-bold bg-white text-black hover:bg-zinc-200">
                  Try for free
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col pt-[72px]">
        {children}
      </main>

      <footer className="bg-black border-t border-zinc-900 py-16 px-4 sm:px-6 lg:px-8 mt-auto z-10 relative">
        <div className="max-w-7xl mx-auto">
          {/* Top CTA Section (Optional, keeping it simple for now) */}
          <div className="pb-16 mb-16 border-b border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-8">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Ready to transform your communication?</h3>
              <p className="text-zinc-500">Join forward-thinking teams using AI to scale on WhatsApp.</p>
            </div>
            <div className="flex space-x-4">
              <Link to="/register" className="px-6 py-3 rounded-lg font-semibold bg-white text-black hover:bg-zinc-200 transition-colors shadow-lg">Start free trial</Link>
              <Link to="/contact" className="px-6 py-3 rounded-lg font-semibold bg-zinc-900 text-white border border-zinc-800 hover:bg-zinc-800 transition-colors">Contact Sales</Link>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12">
            {/* Brand Column */}
            <div className="col-span-2 lg:col-span-1 border-r-0 lg:border-r border-zinc-900 pr-0 lg:pr-8">
              <Link to="/" className="flex items-center group mb-6">
                <img src="/main-logo.svg" alt="Value chat" className="w-8 h-8 mr-2" />
                <span className="text-xl font-bold text-white">Value chat</span>
              </Link>
              <p className="text-sm text-zinc-500 leading-relaxed max-w-xs">
                The Agentic CRM for WhatsApp. Automate conversations, train AI agents, and manage your inbox at scale.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">Product</h3>
              <ul className="space-y-3">
                <li><Link to="/#features" className="text-sm text-zinc-400 hover:text-white transition-colors">Features</Link></li>
                <li><Link to="/roadmap" className="text-sm text-zinc-400 hover:text-white transition-colors">Roadmap</Link></li>
                <li><Link to="/integrations" className="text-sm text-zinc-400 hover:text-white transition-colors">Integrations</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">Company</h3>
              <ul className="space-y-3">
                <li><Link to="/about" className="text-sm text-zinc-400 hover:text-white transition-colors">About Us</Link></li>
                <li><Link to="/contact" className="text-sm text-zinc-400 hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">Security & Legal</h3>
              <ul className="space-y-3">
                <li><Link to="/privacy" className="text-sm text-zinc-400 hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="text-sm text-zinc-400 hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link to="/cookie-policy" className="text-sm text-zinc-400 hover:text-white transition-colors">Cookie Policy</Link></li>
                <li><Link to="/security" className="text-sm text-zinc-400 hover:text-white transition-colors">Security</Link></li>
                <li><Link to="/subprocessors" className="text-sm text-zinc-400 hover:text-white transition-colors">Subprocessors</Link></li>
                <li><Link to="/dpa" className="text-sm text-zinc-400 hover:text-white transition-colors">DPA</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-zinc-500">
              &copy; {new Date().getFullYear()} Value chat. All rights reserved.
            </p>
            <div className="flex gap-4">
              <span className="flex items-center gap-2 text-xs text-zinc-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> All systems operational
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default PublicLayout;

