import React from 'react';
import { useParams, Link } from 'react-router-dom';
import HelpCenterLayout from '../../../components/public/HelpCenterLayout';
import { 
    CheckCircleIcon,
    InformationCircleIcon,
    ArrowRightIcon,
    RocketLaunchIcon,
    ChevronRightIcon
} from '@heroicons/react/24/outline';

const channelData = {
    whatsapp: {
        name: 'WhatsApp',
        overview: {
            title: 'Everything you need to know about WhatsApp',
            content: (
                <>
                    <p>WhatsApp is the most popular messaging app in the world, with over 2 billion active users. At ValueWats, we provide a seamless way to connect your WhatsApp account and automate your customer interactions.</p>
                    
                    <h3>Key Features</h3>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>High Delivery Rates:</strong> Reach your customers directly on their preferred platform.</li>
                        <li><strong>Rich Media Support:</strong> Send images, videos, PDFs, and documents.</li>
                        <li><strong>Real-time Sync:</strong> Every message is synced instantly with your ValueWats Inbox.</li>
                        <li><strong>Anti-Ban Protection:</strong> Built-in delays and spintax to protect your account.</li>
                    </ul>

                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 my-8">
                        <div className="flex gap-4">
                            <InformationCircleIcon className="w-6 h-6 text-blue-400 shrink-0" />
                            <div>
                                <h4 className="text-blue-400 font-bold mb-1">Important Note</h4>
                                <p className="text-sm text-zinc-400 m-0">We use the <strong>Evolution API</strong> for WhatsApp connectivity. This means you connect your official WhatsApp app by scanning a QR code, similar to WhatsApp Web.</p>
                            </div>
                        </div>
                    </div>
                </>
            )
        },
        connect: {
            title: 'How to connect WhatsApp',
            content: (
                <>
                    <p>Connecting your WhatsApp account to ValueWats is as simple as linking any other device to your WhatsApp application.</p>
                    
                    <h3>Step-by-Step Connection</h3>
                    <ol className="list-decimal pl-5 space-y-4">
                        <li>
                            <strong>Open Channel Catalog:</strong> Navigate to the <Link to="/channels" className="text-blue-400">Channels</Link> page in your dashboard.
                        </li>
                        <li>
                            <strong>Select WhatsApp:</strong> Click the "Connect" button on the WhatsApp card.
                        </li>
                        <li>
                            <strong>Set Channel Name:</strong> Give your instance a recognizable name (e.g., "Sales Team" or "Support").
                        </li>
                        <li>
                            <strong>Generate QR Code:</strong> Click "Generate QR Code".
                        </li>
                        <li>
                            <strong>Scan with Phone:</strong> Open WhatsApp on your phone, go to <strong>Settings {'>'} Linked Devices</strong>, and scan the QR code displayed on your screen.
                        </li>
                    </ol>

                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 my-8">
                        <div className="flex gap-4">
                            <CheckCircleIcon className="w-6 h-6 text-emerald-400 shrink-0" />
                            <div>
                                <h4 className="text-emerald-400 font-bold mb-1">Connection Successful</h4>
                                <p className="text-sm text-zinc-400 m-0">Once scanned, your status will update to <strong>Active</strong> and you can start sending messages immediately.</p>
                            </div>
                        </div>
                    </div>
                </>
            )
        },
        video: {
            title: 'Step-by-Step Video Tutorial',
            content: (
                <>
                    <p>Coming soon! We are currently producing a series of high-quality video tutorials to help you master WhatsApp automation.</p>
                    <div className="aspect-video bg-[#111113] border border-white/5 rounded-3xl flex items-center justify-center group cursor-pointer hover:border-indigo-500/30 transition-all overflow-hidden relative">
                         <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent"></div>
                         <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform duration-500 relative z-10">
                            <RocketLaunchIcon className="w-8 h-8 text-zinc-600 group-hover:text-indigo-400 transition-colors" />
                         </div>
                         <span className="absolute bottom-8 text-zinc-500 font-bold text-xs uppercase tracking-[0.2em]">Video coming soon</span>
                    </div>
                </>
            )
        }
    },
    messenger: {
        name: 'Facebook Messenger',
        overview: {
            title: 'Everything you need to know about Messenger',
            content: (
                <>
                    <p>Facebook Messenger allows businesses to engage with their audience on one of the world's largest social platforms. ValueWats integrates directly with the Meta Graph API to manage your Page inbox.</p>
                    
                    <h3>Why use Messenger?</h3>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Social Presence:</strong> Meet customers where they already follow your brand.</li>
                        <li><strong>Persistent History:</strong> Chat history is maintained both in ValueWats and your FB Page manager.</li>
                        <li><strong>No Phone Required:</strong> Unlike WhatsApp, Messenger runs entirely via API tokens.</li>
                    </ul>
                </>
            )
        },
        connect: {
            title: 'How to connect Facebook Messenger',
            content: (
                <>
                    <p>To connect Messenger, you need to have Admin access to a Facebook Business Page.</p>
                    
                    <h3>Setup Checklist</h3>
                    <ol className="list-decimal pl-5 space-y-4">
                        <li>Navigate to the <Link to="/channels" className="text-blue-400">Channels</Link> page and select <strong>Messenger</strong>.</li>
                        <li>Select your <strong>Facebook Page</strong> from the list.</li>
                        <li>Provide your <strong>Page Access Token</strong> (You can generate this in the Meta Developers Portal).</li>
                        <li>Verify that your webhook is correctly configured to point to our endpoint.</li>
                    </ol>
                </>
            )
        },
        video: {
            title: 'Step-by-Step Video Tutorial',
            content: (
                <>
                    <p>Coming soon! We are currently producing a series of high-quality video tutorials to help you master Facebook Messenger automation.</p>
                    <div className="aspect-video bg-[#111113] border border-white/5 rounded-3xl flex items-center justify-center group cursor-pointer hover:border-blue-500/30 transition-all overflow-hidden relative">
                         <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent"></div>
                         <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform duration-500 relative z-10">
                            <RocketLaunchIcon className="w-8 h-8 text-zinc-600 group-hover:text-blue-400 transition-colors" />
                         </div>
                         <span className="absolute bottom-8 text-zinc-500 font-bold text-xs uppercase tracking-[0.2em]">Video coming soon</span>
                    </div>
                </>
            )
        }
    },
    instagram: {
        name: 'Instagram',
        overview: {
            title: 'Everything you need to know about Instagram Direct',
            content: (
                <>
                    <p>Build stronger brand connections by replying to Instagram DMs and Story mentions directly from ValueWats.</p>
                    
                    <h3>Key Advantages</h3>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Handle High Volume:</strong> Manage hundreds of DMs without getting lost in the app UI.</li>
                        <li><strong>Team Collaboration:</strong> Assign Instagram chats to specific team members.</li>
                        <li><strong>Automated Replies:</strong> Use our AI Agents to handle common Instagram inquiries.</li>
                    </ul>
                </>
            )
        },
        connect: {
            title: 'How to connect Instagram',
            content: (
                <>
                    <p>Connecting Instagram requires a <strong>Professional (Business/Creator) account</strong> linked to a Facebook Page.</p>
                    
                    <h3>Steps to Link</h3>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Ensure "Allow Access to Messages" is enabled in your Instagram app settings.</li>
                        <li>Link your IG account to your Facebook Page.</li>
                        <li>In ValueWats, select <strong>Instagram</strong> from the Catalog and provide the Page access credentials.</li>
                    </ul>
                </>
            )
        },
        video: {
            title: 'Step-by-Step Video Tutorial',
            content: (
                <>
                    <p>Coming soon! We are currently producing a series of high-quality video tutorials to help you master Instagram automation.</p>
                    <div className="aspect-video bg-[#111113] border border-white/5 rounded-3xl flex items-center justify-center group cursor-pointer hover:border-pink-500/30 transition-all overflow-hidden relative">
                         <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent"></div>
                         <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform duration-500 relative z-10">
                            <RocketLaunchIcon className="w-8 h-8 text-zinc-600 group-hover:text-pink-400 transition-colors" />
                         </div>
                         <span className="absolute bottom-8 text-zinc-500 font-bold text-xs uppercase tracking-[0.2em]">Video coming soon</span>
                    </div>
                </>
            )
        }
    },
    tiktok: {
        name: 'TikTok',
        overview: {
            title: 'Everything you need to know about TikTok Business',
            content: (
                <>
                    <p>TikTok is the fastest growing source of customer leads. ValueWats allows you to manage TikTok Business messages directly from your unified inbox.</p>
                    
                    <h3>Why use TikTok?</h3>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Viral Reach:</strong> Convert your TikTok viewers into customers instantly.</li>
                        <li><strong>Fast Responses:</strong> Don't let your leads go cold while you switch apps.</li>
                        <li><strong>Smart Automations:</strong> Use AI to categorize and tag TikTok inquiries based on your latest videos.</li>
                    </ul>
                </>
            )
        },
        connect: {
            title: 'How to connect TikTok Business',
            content: (
                <>
                    <p>To connect TikTok, you must have a <strong>TikTok Business Account</strong>.</p>
                    
                    <h3>Connection Steps</h3>
                    <ol className="list-decimal pl-5 space-y-4">
                        <li>Navigate to <Link to="/channels" className="text-blue-400">Channels</Link> and select TikTok.</li>
                        <li>Click "Connect TikTok Account".</li>
                        <li>Authorize ValueWats in the TikTok permission popup.</li>
                        <li>Select the TikTok handle you want to link.</li>
                    </ol>
                </>
            )
        },
        video: {
            title: 'Step-by-Step Video Tutorial',
            content: (
                <>
                    <p>Coming soon! We are currently producing a series of high-quality video tutorials to help you master TikTok automation.</p>
                    <div className="aspect-video bg-[#111113] border border-white/5 rounded-3xl flex items-center justify-center group cursor-pointer hover:border-red-500/30 transition-all overflow-hidden relative">
                         <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent"></div>
                         <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform duration-500 relative z-10">
                            <RocketLaunchIcon className="w-8 h-8 text-zinc-600 group-hover:text-red-400 transition-colors" />
                         </div>
                         <span className="absolute bottom-8 text-zinc-500 font-bold text-xs uppercase tracking-[0.2em]">Video coming soon</span>
                    </div>
                </>
            )
        }
    },
    telegram: {
        name: 'Telegram',
        overview: {
            title: 'Everything you need to know about Telegram Bot',
            content: (
                <>
                    <p>Telegram is a powerful messaging platform for high-speed, secure communication. ValueWats allows you to manage customer chats via a Telegram Bot.</p>
                    
                    <h3>Key Features</h3>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Global Network:</strong> Reach users worldwide with no platform fees.</li>
                        <li><strong>Bot API Power:</strong> Use custom keyboards and commands to automate workflows.</li>
                        <li><strong>Large Group Support:</strong> Manage interaction in large Telegram groups and channels.</li>
                    </ul>
                </>
            )
        },
        connect: {
            title: 'How to connect Telegram Bot',
            content: (
                <>
                    <p>To connect Telegram, you need to create a bot via <strong>@BotFather</strong> on Telegram.</p>
                    
                    <h3>Connection Guide</h3>
                    <ol className="list-decimal pl-5 space-y-4">
                        <li>Open Telegram and search for <strong>@BotFather</strong>.</li>
                        <li>Send `/newbot` and follow the instructions to get your <strong>Bot API Token</strong>.</li>
                        <li>Navigate to <Link to="/channels" className="text-blue-400">Channels</Link> and select Telegram.</li>
                        <li>Enter your Bot Token and click "Connect".</li>
                    </ol>
                </>
            )
        },
        video: {
            title: 'Step-by-Step Video Tutorial',
            content: (
                <>
                    <p>Coming soon! We are currently producing a series of high-quality video tutorials to help you master Telegram automation.</p>
                    <div className="aspect-video bg-[#111113] border border-white/5 rounded-3xl flex items-center justify-center group cursor-pointer hover:border-sky-500/30 transition-all overflow-hidden relative">
                         <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent"></div>
                         <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform duration-500 relative z-10">
                            <RocketLaunchIcon className="w-8 h-8 text-zinc-600 group-hover:text-sky-400 transition-colors" />
                         </div>
                         <span className="absolute bottom-8 text-zinc-500 font-bold text-xs uppercase tracking-[0.2em]">Video coming soon</span>
                    </div>
                </>
            )
        }
    },
    viber: {
        name: 'Viber',
        overview: {
            title: 'Everything about Viber Business',
            content: (
                <>
                    <p>Viber is a major messaging platform in Eastern Europe and Southeast Asia. Connect your Viber Business account to reach millions of users.</p>
                    <h3>Features</h3>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Verified Sender:</strong> Get a blue badge for your business profile.</li>
                        <li><strong>Rich Engagement:</strong> Use buttons and links inside your messages.</li>
                    </ul>
                </>
            )
        },
        connect: {
            title: 'How to connect Viber',
            content: <p>Register for a Viber Business account via a local partner and enter your API key in the Channels section.</p>
        },
        video: {
            title: 'Video Tutorial',
            content: <p>Coming soon!</p>
        }
    },
    line: {
        name: 'LINE',
        overview: {
            title: 'Everything about LINE Official Accounts',
            content: <p>LINE is the leading messaging app in Japan, Thailand, and Taiwan. Manage your LINE Official Account directly from ValueWats.</p>
        },
        connect: {
            title: 'How to connect LINE',
            content: <p>Provide your Channel ID and Channel Secret from the LINE Developers Console.</p>
        },
        video: {
            title: 'Video Tutorial',
            content: <p>Coming soon!</p>
        }
    },
    wechat: {
        name: 'WeChat',
        overview: {
            title: 'Everything about WeChat Service Accounts',
            content: <p>Access over 1 billion users in China. ValueWats supports WeChat Service Accounts for business messaging.</p>
        },
        connect: {
            title: 'How to connect WeChat',
            content: <p>Authorize your WeChat Service Account through our verified application portal.</p>
        },
        video: {
            title: 'Video Tutorial',
            content: <p>Coming soon!</p>
        }
    },
    whatsapp_cloud: {
        name: 'WhatsApp Cloud API',
        overview: {
            title: 'Everything about WhatsApp Cloud API',
            content: (
                <>
                    <p>The WhatsApp Cloud API is Meta's official, cloud-hosted API for businesses to send and receive messages at scale. Unlike the QR-based WhatsApp connection (via Evolution API), the Cloud API provides enterprise-grade reliability, official message templates, and direct integration with Meta's infrastructure.</p>
                    
                    <h3>WhatsApp QR vs Cloud API — What's the difference?</h3>
                    <div className="overflow-x-auto my-6">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="py-3 px-4 text-zinc-400 font-bold">Feature</th>
                                    <th className="py-3 px-4 text-zinc-400 font-bold">WhatsApp QR (Evolution API)</th>
                                    <th className="py-3 px-4 text-zinc-400 font-bold">WhatsApp Cloud API (Meta)</th>
                                </tr>
                            </thead>
                            <tbody className="text-zinc-300">
                                <tr className="border-b border-white/5"><td className="py-2 px-4">Connection</td><td className="py-2 px-4">Scan QR code</td><td className="py-2 px-4">API credentials from Meta</td></tr>
                                <tr className="border-b border-white/5"><td className="py-2 px-4">Host</td><td className="py-2 px-4">Self-hosted (Evolution)</td><td className="py-2 px-4">Meta's cloud servers</td></tr>
                                <tr className="border-b border-white/5"><td className="py-2 px-4">Message Templates</td><td className="py-2 px-4">Not supported</td><td className="py-2 px-4">✅ Full template support</td></tr>
                                <tr className="border-b border-white/5"><td className="py-2 px-4">Scalability</td><td className="py-2 px-4">1 phone, 4 linked devices</td><td className="py-2 px-4">Unlimited, enterprise-grade</td></tr>
                                <tr className="border-b border-white/5"><td className="py-2 px-4">Verified Business</td><td className="py-2 px-4">No blue tick</td><td className="py-2 px-4">✅ Blue tick eligible</td></tr>
                                <tr className="border-b border-white/5"><td className="py-2 px-4">Pricing</td><td className="py-2 px-4">Free (your phone number)</td><td className="py-2 px-4">Per-conversation fees from Meta</td></tr>
                                <tr><td className="py-2 px-4">Best For</td><td className="py-2 px-4">Small businesses, quick setup</td><td className="py-2 px-4">Enterprise, high-volume, official templates</td></tr>
                            </tbody>
                        </table>
                    </div>

                    <h3>Key Features</h3>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Enterprise Scalability:</strong> Send thousands of messages per second with Meta's infrastructure.</li>
                        <li><strong>Message Templates:</strong> Create and use pre-approved templates for notifications, updates, and marketing.</li>
                        <li><strong>Verified Sender:</strong> Apply for the official WhatsApp Blue Tick (Official Business Account).</li>
                        <li><strong>Rich Media:</strong> Send images, videos, documents, location, and interactive components.</li>
                        <li><strong>Messaging Limits:</strong> Start at 1K unique contacts/day. Scale to unlimited with quality rating.</li>
                    </ul>

                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6 my-8">
                        <div className="flex gap-4">
                            <InformationCircleIcon className="w-6 h-6 text-indigo-400 shrink-0" />
                            <div>
                                <h4 className="text-indigo-400 font-bold mb-1">Prerequisites</h4>
                                <ul className="text-sm text-zinc-400 m-0 list-disc ml-4 space-y-1">
                                    <li>A <strong>Meta Business Account</strong> (verified recommended)</li>
                                    <li>A <strong>WhatsApp Business Account</strong> in Meta Business Suite</li>
                                    <li>A <strong>phone number</strong> not already linked to any WhatsApp app</li>
                                    <li>A <strong>System User</strong> with permanent access token</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </>
            )
        },
        connect: {
            title: 'How to connect WhatsApp Cloud API',
            content: (
                <>
                    <p>To connect WhatsApp Cloud API, you'll configure your credentials from the Meta Business Suite.</p>
                    
                    <h3>Step-by-Step Connection</h3>
                    <ol className="list-decimal pl-5 space-y-4">
                        <li>
                            <strong>Create a Meta App:</strong> Go to <a href="https://developers.facebook.com/" target="_blank" rel="noreferrer" className="text-blue-400 underline">Meta for Developers</a> and create a new Business App. Add the "WhatsApp" product.
                        </li>
                        <li>
                            <strong>Get Phone Number ID:</strong> In the Meta App Dashboard, navigate to <strong>WhatsApp → API Setup</strong>. Your Phone Number ID is listed there.
                        </li>
                        <li>
                            <strong>Get WABA ID:</strong> Navigate to <strong>Business Settings → WhatsApp Accounts</strong>. Your WhatsApp Business Account ID is displayed here.
                        </li>
                        <li>
                            <strong>Generate Permanent Token:</strong> Create a System User in <strong>Business Settings → System Users</strong>. Assign the WhatsApp Business Management and Message permissions, then generate a token.
                        </li>
                        <li>
                            <strong>Configure Webhook:</strong> Set your webhook URL to point to ValueWats for receiving incoming messages.
                        </li>
                        <li>
                            <strong>Connect in ValueWats:</strong> Navigate to <Link to="/channels" className="text-blue-400">Channels</Link>, select <strong>WhatsApp Cloud API</strong>, and paste your Phone Number ID, WABA ID, and Access Token.
                        </li>
                    </ol>

                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 my-8">
                        <div className="flex gap-4">
                            <CheckCircleIcon className="w-6 h-6 text-emerald-400 shrink-0" />
                            <div>
                                <h4 className="text-emerald-400 font-bold mb-1">Connection Successful</h4>
                                <p className="text-sm text-zinc-400 m-0">Once connected, your channel status will show as <strong>Active</strong>. You can then create message templates and start sending/receiving messages immediately.</p>
                            </div>
                        </div>
                    </div>
                </>
            )
        },
        video: {
            title: 'Step-by-Step Video Tutorial',
            content: (
                <>
                    <p>Coming soon! We are currently producing a detailed video tutorial for connecting WhatsApp Cloud API.</p>
                    <div className="aspect-video bg-[#111113] border border-white/5 rounded-3xl flex items-center justify-center group cursor-pointer hover:border-indigo-500/30 transition-all overflow-hidden relative">
                         <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent"></div>
                         <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform duration-500 relative z-10">
                            <RocketLaunchIcon className="w-8 h-8 text-zinc-600 group-hover:text-indigo-400 transition-colors" />
                         </div>
                         <span className="absolute bottom-8 text-zinc-500 font-bold text-xs uppercase tracking-[0.2em]">Video coming soon</span>
                    </div>
                </>
            )
        }
    }
};

export default function ChannelHelp() {
    const { channel, topic } = useParams();
    const activeChannel = channelData[channel];

    if (!activeChannel) {
        return (
            <HelpCenterLayout title="Channel Not Found">
                <p>The channel you are looking for does not exist in our documentation.</p>
                <Link to="/help" className="text-blue-400 underline">Back to Help Center</Link>
            </HelpCenterLayout>
        );
    }

    const isConnect = topic === 'connect';
    const isOverview = topic === 'overview';
    const isVideo = topic === 'video';
    const hasTopic = isConnect || isOverview || isVideo;

    return (
        <HelpCenterLayout title={hasTopic ? (activeChannel[topic].title) : `${activeChannel.name} Guide`} lastUpdated="March 2026">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 mb-10 text-sm font-medium">
                <Link to="/help" className="text-zinc-500 hover:text-white transition-colors">Help Center</Link>
                <ChevronRightIcon className="w-4 h-4 text-zinc-700" />
                <Link to="/help/channels" className="text-zinc-500 hover:text-white transition-colors">Channels</Link>
                <ChevronRightIcon className="w-4 h-4 text-zinc-700" />
                <span className="text-zinc-300">{activeChannel.name}</span>
            </nav>

            {!hasTopic ? (
                <div className="space-y-12">
                    <div>
                        <h1 className="text-4xl font-black text-white mb-4 tracking-tight">{activeChannel.name}</h1>
                        <p className="text-lg text-zinc-500 max-w-2xl leading-relaxed">
                            Everything you need to know about setting up and using {activeChannel.name} with ValueWats.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {[
                            { id: 'overview', title: `Everything about ${activeChannel.name}`, desc: 'Basics, features, and platform requirements.' },
                            { id: 'connect', title: `How to connect ${activeChannel.name}`, desc: 'Step-by-step connection walkthrough.' },
                            { id: 'video', title: 'Video Tutorial', desc: 'Watch our visual guide on setting up this channel.' }
                        ].map(art => (
                            <Link 
                                key={art.id}
                                to={`/help/channels/${channel}/${art.id}`}
                                className="group p-6 bg-[#111113] border border-white/5 rounded-3xl hover:bg-white/[0.03] hover:border-white/10 transition-all flex items-center justify-between"
                            >
                                <div>
                                    <h4 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors mb-1">{art.title}</h4>
                                    <p className="text-zinc-500 text-sm">{art.desc}</p>
                                </div>
                                <ArrowRightIcon className="w-6 h-6 text-zinc-700 group-hover:text-blue-400 transition-all group-hover:translate-x-1" />
                            </Link>
                        ))}
                    </div>
                </div>
            ) : (
                <>
                    <h1 className="text-4xl font-black text-white mb-10 tracking-tight">{activeChannel[topic].title}</h1>
                    <div className="prose prose-invert prose-zinc max-w-none">
                        {activeChannel[topic].content}
                    </div>
                </>
            )}

            <div className="mt-16 pt-8 border-t border-white/5">
                <h3 className="text-lg font-bold text-white mb-6">Related Guides</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Link 
                        to={`/help/channels/${channel}/${isConnect ? 'overview' : 'connect'}`}
                        className="group p-5 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/[0.08] hover:border-white/10 transition-all"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">
                                    {isConnect ? 'About Channel' : 'Help Desk'}
                                </p>
                                <h4 className="text-white font-bold">
                                    {isConnect ? `Everything about ${activeChannel.name}` : `How to connect ${activeChannel.name}`}
                                </h4>
                            </div>
                            <ArrowRightIcon className="w-5 h-5 text-zinc-600 group-hover:text-blue-400 transition-colors" />
                        </div>
                    </Link>
                </div>
            </div>

            <div className="mt-12">
                <Link 
                    to={`/channels/connect/${channel === 'whatsapp' ? 'whatsapp' : channel}`}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20"
                >
                    <RocketLaunchIcon className="w-5 h-5" />
                    Connect {activeChannel.name} Now
                </Link>
            </div>
        </HelpCenterLayout>
    );
}
