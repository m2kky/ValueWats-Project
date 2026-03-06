import HelpCenterLayout from '../../../../components/public/HelpCenterLayout';

export default function CampaignsDocs() {
    return (
        <HelpCenterLayout title="Campaigns & Broadcasts" lastUpdated="March 2026">
            <h2>Running Successful Campaigns</h2>
            <p>ValueWats offers an incredibly robust broadcasting engine that leverages multiple strategies to protect your number from getting banned by WhatsApp.</p>
            
            <h3>The Anti-Ban System</h3>
            <p>
                When you dispatch a campaign, our backend engine uses a queuing system (BullMQ) to space out messages. 
                You can configure a random delay (e.g., 15 to 25 seconds) between each message.
                We also mix in zero-width invisible characters into your text and simulate a "typing..." presence for 3 seconds before the message lands. This looks exactly like human behavior to Meta's algorithms.
            </p>
            
            <h3>Importing Contacts</h3>
            <p>
                You can import your audience by uploading a CSV or Excel file directly in the <strong>Contacts</strong> module, or by copy-pasting an audience list while drafting a new campaign.
            </p>

            <h3>Using Templates</h3>
            <p>
                To send a marketing broadcast, Meta requires an approved message template. Go to the <strong>Templates</strong> section to sync or draft your templates. In your campaign, simply select the template; variables like <code>&#123;&#123;name&#125;&#125;</code> will be injected automatically based on the contact's CRM data.
            </p>
        </HelpCenterLayout>
    );
}
