import React from 'react';
import { useParams, Link } from 'react-router-dom';
import HelpCenterLayout from '../../../components/public/HelpCenterLayout';
import {
    ArrowRightIcon,
    SparklesIcon,
    ChevronRightIcon,
    BoltIcon,
    UserPlusIcon,
    ChatBubbleLeftRightIcon,
    MegaphoneIcon
} from '@heroicons/react/24/outline';

const AGENT_ACTION_GUIDES = [
    {
        id: 'close-conversation',
        title: 'Close conversations',
        command: '[ACTION: CLOSE_CONVERSATION]',
        whatItDoes: 'Marks the conversation as closed and removes the current AI assignment.',
        tips: [
            'Only close when the user clearly confirms the issue is solved.',
            'Do not close if the user asks a new question in the same message.',
            'Send a final confirmation line before ending.'
        ],
        sample: `Close the conversation only after explicit user confirmation like "thanks, solved" or "that's all".
If the message contains a new question, keep the conversation open.`
    },
    {
        id: 'assign-conversation',
        title: 'Assign conversations',
        command: '[ACTION: ASSIGN: <Target>]',
        whatItDoes: 'Routes the conversation to a specific AI agent by name, or escalates to human when target is HUMAN.',
        tips: [
            'Use exact target names from your workspace to improve match accuracy.',
            'Use HUMAN for handoff requests, legal complaints, or angry sentiment.',
            'Define priority logic (human handoff first, then specialist routing).'
        ],
        sample: `If the user asks for a human, asks for a manager, or sentiment is angry, assign to HUMAN immediately.
If the topic is billing, assign to Billing Agent.`
    },
    {
        id: 'update-contact',
        title: 'Update contact information',
        command: '[ACTION: UPDATE_CONTACT: {"field":"value"}]',
        whatItDoes: 'Updates contact name and custom fields from details collected in chat.',
        tips: [
            'Specify exactly which fields to save (name, email, company, budget, etc.).',
            'Ask the model to update only when value is explicit, not guessed.',
            'Prefer normalized formats (lowercase email, country code in phone).'
        ],
        sample: `When the user provides profile details, update contact fields for name, email, company, and budget.
Only update fields that were explicitly provided in this conversation.`
    },
    {
        id: 'update-lifecycle',
        title: 'Update lifecycle stage',
        command: '[ACTION: UPDATE_LIFECYCLE: <StageName>]',
        whatItDoes: 'Moves the contact to a lifecycle stage that matches your sales/support flow.',
        tips: [
            'Reference existing stage names exactly as they appear in Lifecycle settings.',
            'Define clear promotion and demotion conditions.',
            'Avoid switching stage when user intent is uncertain.'
        ],
        sample: `If user asks for pricing or demo and business need is clear, move to Qualified Lead.
If user says they are not interested, move to Closed Lost.`
    },
    {
        id: 'trigger-workflow',
        title: 'Trigger workflow',
        command: '[ACTION: TRIGGER_WORKFLOW: <WorkflowId>]',
        whatItDoes: 'Executes a workflow using its workflow ID (not display name).',
        tips: [
            'Use the workflow ID copied from Workflows page.',
            'Require minimum data before triggering (for example email + phone).',
            'Prevent duplicate triggers by requiring a clear event boundary.'
        ],
        sample: `When lead is qualified and both email and phone are available, trigger workflow wf_9f2a41c.
If required fields are missing, ask follow-up questions and do not trigger.`
    },
    {
        id: 'tag-modification',
        title: 'Tag modification',
        command: '[ACTION: ADD_TAG: <TagName>] / [ACTION: REMOVE_TAG: <TagName>]',
        whatItDoes: 'Adds or removes contact tags based on user intent and conversation state.',
        tips: [
            'Use short, stable tag names (for example hot_lead, needs_followup).',
            'Define both add and remove conditions to keep tags clean.',
            'Avoid adding and removing the same tag in one response.'
        ],
        sample: `Add tag hot_lead when the user requests a demo within 7 days.
Remove tag needs_followup after the user confirms the issue is fully resolved.`
    },
    {
        id: 'internal-comments',
        title: 'Internal comments',
        command: '[ACTION: ADD_COMMENT: "text"]',
        whatItDoes: 'Creates an internal note for team context and handoff continuity.',
        tips: [
            'Use concise operational notes, not user-facing language.',
            'Include summary + blocker + next step in one short note.',
            'Write comments only when they add team value.'
        ],
        sample: `When handing off to human, add an internal note with customer goal, blocker, and promised next step.
Keep the note under 250 characters and actionable.`
    },
    {
        id: 'http-requests',
        title: 'Network command center (HTTP requests)',
        command: '[ACTION: HTTP_REQUEST: <ActionName>]',
        whatItDoes: 'Runs a preconfigured HTTP action (method, URL, headers, params, body) against external APIs.',
        tips: [
            'Create clear action names like send_lead_to_crm or verify_order_status.',
            'For non-GET methods, body must be valid JSON.',
            'Tell the agent when to run the request and what data is required first.'
        ],
        sample: `When user confirms they want a callback and phone is present, run send_lead_to_crm.
If callback data is incomplete, ask for missing details before running the request.`
    }
];

function ActionGuideCard({ title, command, whatItDoes, tips, sample }) {
    return (
        <div className="p-6 bg-[#111113] border border-white/5 rounded-3xl">
            <div className="flex items-center justify-between gap-4 mb-4">
                <h4 className="text-white font-bold m-0">{title}</h4>
                <code className="text-[11px] text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded-md whitespace-nowrap">
                    {command}
                </code>
            </div>

            <p className="text-zinc-400 text-sm mb-4">{whatItDoes}</p>

            <h5 className="text-zinc-200 text-xs uppercase tracking-widest font-bold mb-2">Writing Tips</h5>
            <ul className="list-disc pl-5 text-sm text-zinc-400 space-y-1 mb-4">
                {tips.map((tip, index) => (
                    <li key={index}>{tip}</li>
                ))}
            </ul>

            <h5 className="text-zinc-200 text-xs uppercase tracking-widest font-bold mb-2">Sample Instruction</h5>
            <pre className="bg-black/40 border border-white/10 rounded-xl p-4 text-xs text-emerald-300 overflow-x-auto">
                <code>{sample}</code>
            </pre>
        </div>
    );
}

const featureData = {
    'ai-agents': {
        name: 'AI Agents',
        icon: <SparklesIcon className="w-8 h-8 text-fuchsia-500" />,
        description: 'Build autonomous agents with RAG and custom action tools.',
        overview: {
            title: 'Getting Started with AI Agents',
            content: (
                <>
                    <p>
                        AI Agents in Value chat can understand context, search your knowledge base, and execute workspace actions.
                        For best results, combine a focused system prompt, high-quality knowledge content, and strict action rules.
                    </p>
                    <h3>The Neural Lab</h3>
                    <p>
                        Neural Lab is where you configure the agent persona, upload knowledge, and define action instructions.
                        Use the Test Chat panel to validate behavior before publishing.
                    </p>

                    <div className="bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-2xl p-6 my-8">
                        <h4 className="text-fuchsia-400 font-bold mb-2">Quick Workflow</h4>
                        <ol className="list-decimal pl-5 m-0 text-sm text-zinc-300 space-y-1">
                            <li>Write clear role instructions and boundaries.</li>
                            <li>Upload or paste reliable knowledge sources.</li>
                            <li>Enable only the actions you really need.</li>
                            <li>Test in preview and verify each action path.</li>
                        </ol>
                    </div>
                </>
            )
        },
        actions: {
            title: 'Write Better Action Instructions',
            content: (
                <>
                    <p>
                        The Action instruction box controls when the model emits an internal action command.
                        Strong instructions are explicit, conditional, and target-specific.
                    </p>

                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6 my-8">
                        <h4 className="text-indigo-300 font-bold mb-3">Instruction Formula</h4>
                        <pre className="bg-black/40 border border-white/10 rounded-xl p-4 text-xs text-indigo-200 overflow-x-auto m-0">
                            <code>{`When [trigger happens], and [required data exists], then [run action with exact target].
If requirements are missing, do not run the action.`}</code>
                        </pre>
                        <p className="text-xs text-zinc-400 mt-3 mb-0">
                            Keep each action instruction focused on one job. Avoid vague wording like "if needed" or "when appropriate".
                        </p>
                    </div>

                    <div className="space-y-6 mt-10">
                        {AGENT_ACTION_GUIDES.map((action) => (
                            <ActionGuideCard
                                key={action.id}
                                title={action.title}
                                command={action.command}
                                whatItDoes={action.whatItDoes}
                                tips={action.tips}
                                sample={action.sample}
                            />
                        ))}
                    </div>

                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 mt-10">
                        <h4 className="text-amber-300 font-bold mb-3">HTTP Variable Reference</h4>
                        <p className="text-sm text-zinc-300 mb-4">
                            These placeholders are available inside HTTP URL, headers, params, and JSON body:
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <code className="px-2 py-1 rounded-md bg-black/40 border border-white/10 text-xs">{'{{contact.name}}'}</code>
                            <code className="px-2 py-1 rounded-md bg-black/40 border border-white/10 text-xs">{'{{contact.number}}'}</code>
                            <code className="px-2 py-1 rounded-md bg-black/40 border border-white/10 text-xs">{'{{contact.id}}'}</code>
                            <code className="px-2 py-1 rounded-md bg-black/40 border border-white/10 text-xs">{'{{agent.name}}'}</code>
                            <code className="px-2 py-1 rounded-md bg-black/40 border border-white/10 text-xs">{'{{agent.id}}'}</code>
                            <code className="px-2 py-1 rounded-md bg-black/40 border border-white/10 text-xs">{'{{message.content}}'}</code>
                        </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mt-8">
                        <h4 className="text-white font-bold mb-3">Important Behavior Notes</h4>
                        <ul className="list-disc pl-5 text-sm text-zinc-400 space-y-2">
                            <li>Conversation assignment currently supports AI agent name matching and HUMAN handoff.</li>
                            <li>Workflow trigger expects a workflow ID string (copied from Workflows), not a display label.</li>
                            <li>Lifecycle updates match by stage name text, so stage naming consistency matters.</li>
                            <li>For HTTP actions, invalid JSON body will cause execution failure for non-GET requests.</li>
                        </ul>
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
                    <p>Value chat allows you to send bulk messages to your contacts or specific segments while mitigating the risk of account bans.</p>
                    <h3>Best Practices</h3>
                    <ol className="list-decimal pl-5">
                        <li><strong>Use Spintax:</strong> Use <code>{`{Hi|Hello|Hey}`}</code> to vary your message content.</li>
                        <li><strong>Set Delays:</strong> Add random delays between messages.</li>
                        <li><strong>Warm up accounts:</strong> Start with small batches and increase over time.</li>
                    </ol>
                </>
            )
        }
    },

    'integrations': {
        name: 'Integrations & OAuth',
        icon: <BoltIcon className="w-8 h-8 text-fuchsia-500" />,
        description: 'Connect third-party services and securely link Google Accounts via OAuth.',
        overview: {
            title: 'Overview',
            content: (
                <>
                    <p>
                        Integrations allow your AI Agents and Workflows to seamlessly connect with external services such as Google Drive, Google Calendar, Webhooks, and more.
                    </p>
                </>
            )
        },
        google: {
            title: 'How to setup Google Custom OAuth App (like n8n)',
            content: (
                <>
                    <p>
                        To securely connect your Google Calendar and Google Drive to our platform without sharing a centralized company credential, you can create your own private Custom Auth App directly in Google Cloud Console.
                    </p>

                    <div className="bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-2xl p-6 my-8">
                        <h4 className="text-fuchsia-400 font-bold mb-2">Step 1: Create a Project & Enable APIs</h4>
                        <ol className="list-decimal pl-5 m-0 text-sm text-zinc-300 space-y-1">
                            <li>Go to <a href="https://console.cloud.google.com" target="_blank" className="text-indigo-400 underline">Google Cloud Console</a>.</li>
                            <li>Create a <strong>New Project</strong> and name it (e.g., `ValueWats Integrations`).</li>
                            <li>Go to <strong>APIs & Services</strong> &gt; <strong>Library</strong>.</li>
                            <li>Search for and enable <strong>Google Calendar API</strong>, <strong>Google Drive API</strong>, and <strong>Google Sheets API</strong>.</li>
                        </ol>
                    </div>

                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6 my-8">
                        <h4 className="text-indigo-300 font-bold mb-3">Step 2: OAuth Consent Screen</h4>
                        <ol className="list-decimal pl-5 m-0 text-sm text-zinc-300 space-y-1">
                            <li>Go to <strong>APIs & Services</strong> &gt; <strong>OAuth consent screen</strong>.</li>
                            <li>Select <strong>External</strong> and click <strong>Create</strong>.</li>
                            <li>Fill in App Name and Support Email, then click Save and Continue.</li>
                            <li>In the <strong>Test Users</strong> stage, add your own email address as a test user to grant it permissions.</li>
                        </ol>
                    </div>

                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 mt-10">
                        <h4 className="text-amber-300 font-bold mb-3">Step 3: Generate Client Credentials</h4>
                        <ol className="list-decimal pl-5 m-0 text-sm text-zinc-300 space-y-1">
                            <li>Go back to <strong>APIs & Services</strong> &gt; <strong>Credentials</strong>.</li>
                            <li>Click <strong>+ CREATE CREDENTIALS</strong> &gt; <strong>OAuth client ID</strong>.</li>
                            <li>Choose Application type: <strong>Web application</strong>.</li>
                            <li>In <strong>Authorized redirect URIs</strong>, paste the Redirect URL exactly as shown in your Integrations Connect window.</li>
                            <li>Click <strong>Create</strong>. You will receive your <strong>Client ID</strong> and <strong>Client Secret</strong>. Paste these back into the platform and click Sign in with Google!</li>
                        </ol>
                    </div>
                </>
            )
        },
        notion: {
            title: 'How to setup Notion Public Integration (OAuth)',
            content: (
                <>
                    <p>
                        To securely connect your Notion Workspace allowing your AI Agents to read wikis or create database entries, you need to create a Developer Integration.
                    </p>

                    <div className="bg-zinc-800/50 border border-white/10 rounded-2xl p-6 my-8">
                        <h4 className="text-zinc-300 font-bold mb-2">Step 1: Create a Notion Integration</h4>
                        <ol className="list-decimal pl-5 m-0 text-sm text-zinc-400 space-y-1">
                            <li>Go to <a href="https://www.notion.so/my-integrations" target="_blank" className="text-indigo-400 underline">Notion My Integrations</a>.</li>
                            <li>Click <strong>New integration</strong>.</li>
                            <li>Select your desired Notion workspace and enter a name (e.g. <code>ValueWats AI</code>).</li>
                            <li>Under <strong>Integration Type</strong>, you MUST select <strong>Public</strong> to enable OAuth flow!</li>
                            <li>Save the integration.</li>
                        </ol>
                    </div>

                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6 my-8">
                        <h4 className="text-indigo-300 font-bold mb-3">Step 2: Configure OAuth Settings</h4>
                        <ol className="list-decimal pl-5 m-0 text-sm text-zinc-300 space-y-1">
                            <li>Go to the <strong>Configuration</strong> tab in your new integration.</li>
                            <li>Under <strong>OAuth Domain & URIs</strong>, paste the <strong>OAuth Redirect URL</strong> shown in the ValueWats connect window into the Redirect URI list.</li>
                            <li>Open the <strong>Capabilities</strong> tab and enable the permissions you want the AI to have (e.g. <code>Read content</code>, <code>Update content</code>, <code>Insert content</code>).</li>
                            <li>Go back to <strong>Configuration</strong> and copy the <strong>OAuth Client ID</strong> and <strong>OAuth Client Secret</strong>.</li>
                            <li>Paste them back into ValueWats and click Sign in with Notion!</li>
                        </ol>
                    </div>
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
        <HelpCenterLayout title={hasTopic ? activeFeature[topic].title : `${activeFeature.name} Center`} lastUpdated="April 2026">
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
                            .filter((k) => k !== 'name' && k !== 'icon' && k !== 'description')
                            .map((topicKey) => (
                                <Link
                                    key={topicKey}
                                    to={`/help/${feature}/${topicKey}`}
                                    className="group p-6 bg-[#111113] border border-white/5 rounded-3xl hover:bg-white/[0.03] hover:border-white/10 transition-all flex items-center justify-between"
                                >
                                    <div>
                                        <h4 className="text-lg font-bold text-white group-hover:text-fuchsia-400 transition-colors mb-1">
                                            {activeFeature[topicKey].title}
                                        </h4>
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
