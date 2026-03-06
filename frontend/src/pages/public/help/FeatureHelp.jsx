import React from 'react';
import { useParams, Link } from 'react-router-dom';
import HelpCenterLayout from '../../../components/public/HelpCenterLayout';
import { 
    CheckCircleIcon,
    InformationCircleIcon,
    ArrowRightIcon,
    SparklesIcon,
    ChevronRightIcon,
    BoltIcon,
    CodeBracketIcon,
    UserPlusIcon,
    ChatBubbleOvalLeftEllipsisIcon
} from '@heroicons/react/24/outline';

const featureData = {
    'ai-agents': {
        name: 'AI Agents',
        icon: <SparklesIcon className="w-8 h-8 text-fuchsia-500" />,
        description: 'Build autonomous agents with RAG and custom action tools.',
        overview: {
            title: 'Getting Started with AI Agents',
            content: (
                <>
                    <p>AI Agents in ValueWats are autonomous entities that can understand context, query your knowledge base, and perform specific actions to help your customers.</p>
                    <h3>The Neural Lab</h3>
                    <p>Our "Neural Lab" is where you train and test your agents. You can provide them with documents (PDF, Text, Website URLs) to build a specialized knowledge base.</p>
                    <div className="bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-2xl p-6 my-8">
                        <h4 className="text-fuchsia-400 font-bold mb-2">Pro Tip</h4>
                        <p className="text-sm text-zinc-400 m-0">Combine agents with <strong>Actions</strong> to allow them to update CRM data or trigger external webhooks automatically.</p>
                    </div>
                </>
            )
        },
        actions: {
            title: 'AI Agent Actions',
            content: (
                <>
                    <p>Actions allow your AI Agent to step beyond just answering questions. They can interact with your workspace data and external systems.</p>
                    
                    <div className="grid grid-cols-1 gap-6 mt-10">
                        <div className="p-6 bg-white/5 border border-white/5 rounded-3xl">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-blue-500/10 rounded-2xl">
                                    <UserPlusIcon className="w-6 h-6 text-blue-400" />
                                </div>
                                <h4 className="text-white font-bold m-0">Action: Update Contact Fields</h4>
                            </div>
                            <p className="text-zinc-400 text-sm">The agent can automatically extract information (like email or name) from a conversation and save it to the personal contact record.</p>
                        </div>

                        <div className="p-6 bg-white/5 border border-white/5 rounded-3xl">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-amber-500/10 rounded-2xl">
                                    <CodeBracketIcon className="w-6 h-6 text-amber-400" />
                                </div>
                                <h4 className="text-white font-bold m-0">Action: Trigger Webhook</h4>
                            </div>
                            <p className="text-zinc-400 text-sm">Enable your agent to notify your backend, Zapier, or Make.com when a specific goal is reached (e.g., "Lead Qualified").</p>
                        </div>

                        <div className="p-6 bg-white/5 border border-white/5 rounded-3xl">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-emerald-500/10 rounded-2xl">
                                    <ChatBubbleOvalLeftEllipsisIcon className="w-6 h-6 text-emerald-400" />
                                </div>
                                <h4 className="text-white font-bold m-0">Action: Handover to Human</h4>
                            </div>
                            <p className="text-zinc-400 text-sm">When an agent detects frustration or a specific request, it can gracefully exit the chat and notify a human agent.</p>
                        </div>
                    </div>
                </>
            )
        }
    },
    'contacts': {
        name: 'Contacts & Segments',
        icon: <UserPlusIcon className="w-8 h-8 text-blue-500" />,
        description: 'Manage your audience, custom fields, and lifecycle stages.',
        overview: {
            title: 'Managing your Contacts',
            content: (
                <>
                    <p>The Contacts module is the heart of your workspace. It stores every user who has interacted with your channels.</p>
                    <h3>Segmentation</h3>
                    <p>Organize your contacts into segments based on their behavior, tags, or custom field values. Segments can be used as target audiences for Campaigns.</p>
                </>
            )
        }
    },
    'inbox': {
        name: 'Smart Inbox',
        icon: <ChatBubbleLeftRightIcon className="w-8 h-8 text-emerald-500" />,
        description: 'Master the unified multi-channel inbox for team collaboration.',
        overview: {
            title: 'Using the Smart Inbox',
            content: (
                <>
                    <p>The Smart Inbox aggregates messages from all your connected channels (WhatsApp, Messenger, etc.) into a single view.</p>
                    <h3>Assignment & Collaboration</h3>
                    <ul className="list-disc pl-5">
                        <li><strong>Assign Chats:</strong> Route conversations to specific team members.</li>
                        <li><strong>Internal Notes:</strong> Leave hidden notes for your teammates within a chat.</li>
                        <li><strong>Labels:</strong> Organize messages using custom labels.</li>
                    </ul>
                </>
            )
        }
    },
    'campaigns': {
        name: 'Campaigns & Broadcasts',
        icon: <MegaphoneIcon className="w-8 h-8 text-indigo-500" />,
        description: 'Run bulk marketing efforts with spintax and anti-ban protection.',
        overview: {
            title: 'Running Marketing Campaigns',
            content: (
                <>
                    <p>ValueWats allows you to send bulk messages to your contacts or specific segments while mitigating the risk of account bans.</p>
                    <h3>Best Practices</h3>
                    <ol className="list-decimal pl-5">
                        <li><strong>Use Spintax:</strong> Use `{"{Hi|Hello|Hey}"}` to vary your message content.</li>
                        <li><strong>Set Delays:</strong> Add random delays between messages.</li>
                        <li><strong>Warm up accounts:</strong> Start with small batches and increase over time.</li>
                    </ol>
                </>
            )
        }
    },
    'workflows': {
        name: 'Workflows & Automation',
        icon: <BoltIcon className="w-8 h-8 text-amber-500" />,
        description: 'Design complex automation trees and trigger based logic.',
        overview: {
            title: 'Building Automation Workflows',
            content: (
                <>
                    <p>Workflows are the brain of your marketing automation. They allow you to define what happens when a certain event occurs.</p>
                    <h3>Triggers & Actions</h3>
                    <p>A workflow starts with a <strong>Trigger</strong> (e.g., "Contact Tagged") and executes a series of <strong>Actions</strong> (e.g., "Send WhatsApp Message").</p>
                </>
            )
        }
    }
};

export default function FeatureHelp() {
    const { feature, topic } = useParams();
    const activeFeature = featureData[feature];

    if (!activeFeature) {
        return (
            <HelpCenterLayout title="Feature Not Found">
                <p>The feature you are looking for does not exist in our documentation.</p>
                <Link to="/help/product" className="text-blue-400 underline">Back to Product Features</Link>
            </HelpCenterLayout>
        );
    }

    const hasTopic = topic && activeFeature[topic];

    return (
        <HelpCenterLayout title={hasTopic ? (activeFeature[topic].title) : `${activeFeature.name} Center`} lastUpdated="March 2026">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 mb-10 text-sm font-medium">
                <Link to="/help" className="text-zinc-500 hover:text-white transition-colors">Help Center</Link>
                <ChevronRightIcon className="w-4 h-4 text-zinc-700" />
                <Link to="/help/product" className="text-zinc-500 hover:text-white transition-colors">Product</Link>
                <ChevronRightIcon className="w-4 h-4 text-zinc-700" />
                <span className="text-zinc-300">{activeFeature.name}</span>
            </nav>

            {!hasTopic ? (
                <div className="space-y-12">
                    <div>
                        <div className="mb-6">{activeFeature.icon}</div>
                        <h1 className="text-4xl font-black text-white mb-4 tracking-tight">{activeFeature.name}</h1>
                        <p className="text-lg text-zinc-500 max-w-2xl leading-relaxed">
                            {activeFeature.description}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {Object.keys(activeFeature)
                            .filter(k => k !== 'name' && k !== 'icon' && k !== 'description')
                            .map(topicKey => (
                            <Link 
                                key={topicKey}
                                to={`/help/${feature}/${topicKey}`}
                                className="group p-6 bg-[#111113] border border-white/5 rounded-3xl hover:bg-white/[0.03] hover:border-white/10 transition-all flex items-center justify-between"
                            >
                                <div>
                                    <h4 className="text-lg font-bold text-white group-hover:text-fuchsia-400 transition-colors mb-1">{activeFeature[topicKey].title}</h4>
                                    <p className="text-zinc-500 text-sm">Comprehensive guide and best practices.</p>
                                </div>
                                <ArrowRightIcon className="w-6 h-6 text-zinc-700 group-hover:text-fuchsia-400 transition-all group-hover:translate-x-1" />
                            </Link>
                        ))}
                    </div>
                </div>
            ) : (
                <>
                    <h1 className="text-4xl font-black text-white mb-10 tracking-tight">{activeFeature[topic].title}</h1>
                    <div className="prose prose-invert prose-zinc max-w-none">
                        {activeFeature[topic].content}
                    </div>
                </>
            )}

            <div className="mt-16 pt-8 border-t border-white/5">
                <h3 className="text-lg font-bold text-white mb-6">Related Topics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <Link 
                        to="/help/product"
                        className="group p-5 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/[0.08] hover:border-white/10 transition-all"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">Explore</p>
                                <h4 className="text-white font-bold">All Product Features</h4>
                            </div>
                            <ArrowRightIcon className="w-5 h-5 text-zinc-600 group-hover:text-indigo-400 transition-colors" />
                        </div>
                    </Link>
                </div>
            </div>
        </HelpCenterLayout>
    );
}
