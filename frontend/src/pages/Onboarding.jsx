import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import { ChevronRightIcon, ChevronLeftIcon, LockClosedIcon } from '@heroicons/react/24/outline';

const INDUSTRIES = [
    'E-commerce', 'Education', 'Healthcare', 'Real Estate', 'Technology',
    'Financial Services', 'Travel & Hospitality', 'Food & Beverage',
    'Automotive', 'Professional Services', 'Government', 'Other',
];

const ORG_SIZES = ['1-10', '11-20', '21-50', '51-200', '201-1,000', 'More than 1,000'];

const CUSTOMER_TYPES = ['B2B (Business)', 'B2C (Consumer)', 'Both B2B and B2C'];

const CHAT_PURPOSES = [
    'Assist with online checkout',
    'Booking appointments',
    'Sending quotations',
    'Booking a free or trial class',
    'Customer support',
    'Receive payment',
    'Sending bulk broadcasts',
    'Others',
];

const ROLES = [
    'Founder / CEO', 'CTO / Technical Lead', 'Marketing Manager',
    'Sales Manager', 'Customer Support Manager', 'Product Manager',
    'Developer', 'Other',
];

const REFERRAL_SOURCES = [
    'Google Search', 'Social Media', 'Friend / Colleague',
    'Blog / Article', 'Event / Conference', 'Other',
];

/* Custom Select Component */
function Select({ label, required, value, onChange, options, placeholder = 'Choose one' }) {
    return (
        <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
                {label} {required && <span className="text-rose-400">*</span>}
            </label>
            <div className="relative">
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full appearance-none px-4 py-3 bg-[#2a2a1f] border border-white/10 rounded-xl focus:outline-none focus:border-[#e2f300] focus:ring-1 focus:ring-[#e2f300] text-white transition-colors cursor-pointer pr-10"
                >
                    <option value="" className="text-zinc-500">{placeholder}</option>
                    {options.map((opt) => (
                        <option key={opt} value={opt} className="bg-[#2a2a1f]">{opt}</option>
                    ))}
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </div>
        </div>
    );
}

/* Main Onboarding Component */
export default function Onboarding() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Step 1
    const [organizationName, setOrganizationName] = useState('');
    const [website, setWebsite] = useState('');
    const [industry, setIndustry] = useState('');
    const [orgSize, setOrgSize] = useState('');

    // Step 2
    const [customerType, setCustomerType] = useState('');
    const [chatPurposes, setChatPurposes] = useState([]);

    // Step 3
    const [role, setRole] = useState('');
    const [phone, setPhone] = useState('');
    const [referralSource, setReferralSource] = useState('');

    // Get user name from localStorage
    const [userName, setUserName] = useState('');
    const [userNameInput, setUserNameInput] = useState('');

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            const user = JSON.parse(userData);
            const name = user.name || user.email?.split('@')[0] || '';
            setUserName(name);
            setUserNameInput(name);
        }
    }, []);

    const toggleChatPurpose = (purpose) => {
        setChatPurposes((prev) =>
            prev.includes(purpose) ? prev.filter((p) => p !== purpose) : [...prev, purpose]
        );
    };

    const canProceedStep1 = organizationName && industry && orgSize;
    const canProceedStep2 = customerType && chatPurposes.length > 0;
    const canProceedStep3 = role;

    const handleSubmit = async () => {
        setError('');
        setLoading(true);
        try {
            const res = await api.post('/onboarding', {
                organizationName,
                website,
                industry,
                orgSize,
                customerType,
                chatPurposes,
                role,
                phone,
                name: userNameInput || userName,
                referralSource,
            });

            // Update localStorage with new tenant data
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            userData.onboardingCompleted = true;
            userData.name = userNameInput || userName;
            localStorage.setItem('user', JSON.stringify(userData));

            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#232318] flex flex-col font-sans text-white relative selection:bg-[#e2f300]/30 selection:text-[#232318]">
            {/* Top Logo */}
            <div className="absolute top-6 left-6 flex items-center gap-2.5">
                <img src="/main-logo.svg" alt="Value chat" className="w-9 h-9 rounded-lg shadow-[0_0_15px_rgba(226,243,0,0.35)]" />
                <span className="text-xl font-bold tracking-tight text-white">Value chat</span>
            </div>

            {/* Language toggle mock */}
            <div className="absolute top-6 right-6 hidden sm:flex items-center gap-4">
                <button className="text-zinc-400 hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
                </button>
                <button className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors border border-white/10 rounded-md px-3 py-1.5 bg-white/5">
                    <span>EN</span>
                    <span>Language</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-20">
                <div className="w-full max-w-[560px]">

                    {error && (
                        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    {/* Step 1 */}
                    {step === 1 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <p className="text-zinc-400 text-sm mb-1">Hello {userName || 'there'}</p>
                            <h1 className="text-2xl font-bold text-white mb-8">Tell us more about your business</h1>

                            <div className="space-y-5">
                                {/* Organization name */}
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                                        Organization name <span className="text-rose-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={organizationName}
                                        onChange={(e) => setOrganizationName(e.target.value)}
                                        placeholder="E.g. Value chat"
                                        className="w-full px-4 py-3 bg-[#2a2a1f] border border-white/10 rounded-xl focus:outline-none focus:border-[#e2f300] focus:ring-1 focus:ring-[#e2f300] text-white placeholder-zinc-500 transition-colors"
                                    />
                                </div>

                                {/* Website */}
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-2">Website</label>
                                    <input
                                        type="url"
                                        value={website}
                                        onChange={(e) => setWebsite(e.target.value)}
                                        placeholder="E.g. www.valuechat.app"
                                        className="w-full px-4 py-3 bg-[#2a2a1f] border border-white/10 rounded-xl focus:outline-none focus:border-[#e2f300] focus:ring-1 focus:ring-[#e2f300] text-white placeholder-zinc-500 transition-colors"
                                    />
                                </div>

                                {/* Industry */}
                                <Select
                                    label="Industry"
                                    required
                                    value={industry}
                                    onChange={setIndustry}
                                    options={INDUSTRIES}
                                />

                                {/* Org size */}
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-3">
                                        How many people work at your organization? <span className="text-rose-400">*</span>
                                    </label>
                                    <div className="space-y-2">
                                        {ORG_SIZES.map((size) => (
                                            <label
                                                key={size}
                                                onClick={() => setOrgSize(size)}
                                                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer transition-all ${orgSize === size
                                                    ? 'bg-[#e2f300]/10 border border-[#e2f300]/30'
                                                    : 'hover:bg-white/5 border border-transparent'
                                                    }`}
                                            >
                                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${orgSize === size ? 'border-[#e2f300]' : 'border-zinc-600'
                                                    }`}>
                                                    {orgSize === size && <div className="w-2 h-2 rounded-full bg-[#e2f300]" />}
                                                </div>
                                                <span className="text-sm text-zinc-300">{size}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2 */}
                    {step === 2 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <h1 className="text-2xl font-bold text-white mb-8">Help us get to know your organization</h1>

                            <div className="space-y-6">
                                {/* Customer type */}
                                <Select
                                    label="Who are your main customers?"
                                    required
                                    value={customerType}
                                    onChange={setCustomerType}
                                    options={CUSTOMER_TYPES}
                                />

                                {/* Chat purposes */}
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-3">
                                        Why do you chat with customers? <span className="text-rose-400">*</span>
                                    </label>
                                    <div className="space-y-2">
                                        {CHAT_PURPOSES.map((purpose) => {
                                            const isChecked = chatPurposes.includes(purpose);
                                            return (
                                                <label
                                                    key={purpose}
                                                    onClick={() => toggleChatPurpose(purpose)}
                                                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer transition-all ${isChecked
                                                        ? 'bg-[#e2f300]/10 border border-[#e2f300]/30'
                                                        : 'hover:bg-white/5 border border-transparent'
                                                        }`}
                                                >
                                                    <div className={`w-4 h-4 rounded flex items-center justify-center transition-all border ${isChecked
                                                        ? 'bg-[#e2f300] border-[#e2f300]'
                                                        : 'border-zinc-600 bg-transparent'
                                                        }`}>
                                                        {isChecked && (
                                                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <span className="text-sm text-zinc-300">{purpose}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3 */}
                    {step === 3 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <h1 className="text-2xl font-bold text-white mb-8">Last step, let's set up your profile</h1>

                            <div className="space-y-5">
                                {/* Role */}
                                <Select
                                    label="What is your role at your organization?"
                                    required
                                    value={role}
                                    onChange={setRole}
                                    options={ROLES}
                                />

                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-2">Your name</label>
                                    <input
                                        type="text"
                                        value={userNameInput}
                                        onChange={(e) => setUserNameInput(e.target.value)}
                                        placeholder="Your full name"
                                        className="w-full px-4 py-3 bg-[#2a2a1f] border border-white/10 rounded-xl focus:outline-none focus:border-[#e2f300] focus:ring-1 focus:ring-[#e2f300] text-white placeholder-zinc-500 transition-colors"
                                    />
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-2">What is your phone number?</label>
                                    <div className="flex gap-2">
                                        <div className="flex items-center gap-2 px-3 py-3 bg-[#2a2a1f] border border-white/10 rounded-xl text-sm text-zinc-300 shrink-0">
                                            <span>EG</span>
                                            <span className="text-zinc-500">+20</span>
                                        </div>
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="Phone number"
                                            className="flex-1 px-4 py-3 bg-[#2a2a1f] border border-white/10 rounded-xl focus:outline-none focus:border-[#e2f300] focus:ring-1 focus:ring-[#e2f300] text-white placeholder-zinc-500 transition-colors"
                                        />
                                    </div>
                                    {/* Privacy note */}
                                    <div className="mt-3 flex items-center gap-2 px-4 py-3 bg-[#e2f300]/5 border border-[#e2f300]/20 rounded-xl">
                                        <LockClosedIcon className="w-4 h-4 text-[#e2f300] shrink-0" />
                                        <p className="text-xs text-zinc-400">We won't share your phone number with anyone.</p>
                                    </div>
                                </div>

                                {/* Referral source */}
                                <Select
                                    label="How did you hear about us?"
                                    value={referralSource}
                                    onChange={setReferralSource}
                                    options={REFERRAL_SOURCES}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Navigation */}
            <div className="sticky bottom-0 bg-[#232318]/80 backdrop-blur-xl border-t border-white/5">
                <div className="max-w-[560px] mx-auto flex items-center justify-between px-4 sm:px-6 py-4">
                    {/* Step indicator */}
                    <div className="flex flex-col">
                        <span className="text-sm text-zinc-500 font-medium">Step {step} of 3</span>
                        {step === 1 && (
                            <span className="text-xs text-zinc-600 mt-0.5">
                                Have an account? <Link to="/login" className="text-[#e2f300] hover:text-[#f2ff4f]">Sign in</Link>
                            </span>
                        )}
                    </div>

                    {/* Navigation buttons */}
                    <div className="flex items-center gap-3">
                        {step > 1 && (
                            <button
                                onClick={() => { setStep(step - 1); setError(''); }}
                                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                            >
                                <ChevronLeftIcon className="w-4 h-4" />
                                Back
                            </button>
                        )}

                        {step < 3 ? (
                            <button
                                onClick={() => { setStep(step + 1); setError(''); }}
                                disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}
                                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold rounded-xl bg-white/10 text-white hover:bg-white/15 border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                Next
                                <ChevronRightIcon className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={!canProceedStep3 || loading}
                                className="inline-flex items-center gap-1.5 px-6 py-2.5 text-sm font-semibold rounded-xl bg-[#e2f300] text-[#232318] hover:bg-[#d0df00] disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(226,243,0,0.3)]"
                            >
                                {loading ? (
                                    <img src="/icon-blue-animated.svg" alt="" className="w-5 h-5" />
                                ) : (
                                    <>
                                        Get started
                                        <ChevronRightIcon className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Step progress bar */}
            <div className="fixed top-0 left-0 right-0 h-1 bg-white/5 z-50">
                <div
                    className="h-full bg-gradient-to-r from-[#e2f300] to-[#7a7839] transition-all duration-500 ease-out"
                    style={{ width: `${(step / 3) * 100}%` }}
                />
            </div>
        </div>
    );
}


