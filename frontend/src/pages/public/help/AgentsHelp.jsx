import HelpCenterLayout from '../../../components/public/HelpCenterLayout';

export default function AgentsHelp() {
    return (
        <HelpCenterLayout title="AI Agents (Neural Lab)" lastUpdated="March 2026">
            <h2>Building Autonomous AI Agents</h2>
            <p>Our Neural Lab is the command center for building GenAI agents capable of full CRM autonomy.</p>
            
            <h3>Knowledge Base (RAG)</h3>
            <p>
                Your agent is only as smart as the data it has access to. Navigate to the <strong>Knowledge</strong> tab inside the Agent Editor. You can upload PDFs or paste raw text. ValueWats chunks this text and converts it into embeddings using `pgvector`, allowing your bot to semantically search your docs before answering a question.
            </p>
            
            <h3>Autonomous Actions</h3>
            <p>
                Unlike dumb chatbots, ValueWats AI can perform actions. Give the bot instructions like: <i>"If the user is angry, Tag them as VIP and assign the chat to a human."</i>
                The prompt engine evaluates the context and securely runs macros in the background to inject Tags, change Lifecycle stages, or route the chat.
            </p>

            <h3>Agent Tools (Integrations)</h3>
            <p>
                Enable the "Google Calendar" tool to let your AI read availability and create events directly on your team's calendar based on natural conversations.
            </p>
        </HelpCenterLayout>
    );
}
