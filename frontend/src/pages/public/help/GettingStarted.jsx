import HelpCenterLayout from '../../../components/public/HelpCenterLayout';

export default function GettingStarted() {
    return (
        <HelpCenterLayout title="Getting Started" lastUpdated="March 2026">
            <h2>Welcome to ValueWats</h2>
            <p>ValueWats is your ultimate Agentic CRM for WhatsApp. This guide covers the basics of getting your workspace set up.</p>
            
            <h3>1. Connecting Meta Cloud API</h3>
            <p>
                To send and receive messages on WhatsApp, you must connect your Meta App. 
                Navigate to <strong>Settings</strong> &gt; <strong>Integrations</strong>. Click on the <strong>Connect</strong> button under WhatsApp (Meta Cloud).
                Enter your App ID, Phone Number ID, and Permanent Access Token.
            </p>
            
            <h3>2. Inviting Team Members</h3>
            <p>
                Once your WhatsApp number is connected, it's time to invite your team.
                Go to <strong>Settings</strong> &gt; <strong>Users</strong>. Enter the email addresses of the agents you want to invite. They will receive a magic link with an OTP to log in securely.
            </p>

            <h3>3. Testing Your Setup</h3>
            <p>
                Send a test message from your personal WhatsApp to your newly connected business number. It should instantly appear in the <strong>Smart Inbox</strong> where anyone on your team can reply.
            </p>
        </HelpCenterLayout>
    );
}
