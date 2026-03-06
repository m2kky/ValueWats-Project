import HelpCenterLayout from '../../../../components/public/HelpCenterLayout';

export default function InboxDocs() {
    return (
        <HelpCenterLayout title="Smart Inbox" lastUpdated="March 2026">
            <h2>Mastering the Smart Inbox</h2>
            <p>The Smart Inbox is designed for high-velocity teams to manage customer queries at scale without missing a beat.</p>
            
            <h3>Assigning Conversations</h3>
            <p>
                By default, conversations enter the <strong>Unassigned</strong> filter. You can assign a chat to yourself, another team member, or even directly to an <strong>AI Agent</strong> using the dropdown at the top right of the Chat Window.
            </p>
            
            <h3>Internal Notes</h3>
            <p>
                To leave a note for your team (that the customer cannot see), go to the right sidebar, click the "Notes" tab on the timeline, and type your message. Internal notes are marked with a yellow background.
            </p>

            <h3>Snippets & Quick Replies</h3>
            <p>
                Typing <code>/</code> inside the composer will open the Sniper Picker. This reveals all your template messages and text shortcuts for blazing fast responses.
            </p>

            <h3>AI Assist</h3>
            <p>
                Feeling stuck? Click the sparkles icon <strong>(AI Assist)</strong> in the composer. The system will read the last 5 messages and generate an optimized contextual reply. You can edit it before hitting send.
            </p>
        </HelpCenterLayout>
    );
}
