import HelpCenterLayout from '../../../../components/public/HelpCenterLayout';

export default function SettingsDocs() {
    return (
        <HelpCenterLayout title="Settings & Automations" lastUpdated="March 2026">
            <h2>Platform Customization</h2>
            <p>Value chat is highly modular. You can mold the CRM and the Automation rules to completely fit your industry.</p>
            
            <h3>Custom Fields</h3>
            <p>
                In <strong>Settings &gt; Contact Fields</strong>, define the specific data points you care about (e.g. "Order Value", "Appointment Date", "Industry"). These fields will instantly appear in the sidebar of every Inbox conversation.
            </p>
            
            <h3>Tags & Lifecycle Stages</h3>
            <p>
                Create standardized Tags (Labels) color-coded to visually sort your subscribers. Configure the Lifecycle Stages Kanban pipeline to match your sales funnels (e.g. Lead &rarr; Qualified &rarr; Meeting Scheduled &rarr; Won).
            </p>

            <h3>Workflow Automations</h3>
            <p>
                In <strong>Settings &gt; Automation</strong>, define IF/THEN rules. For example: 
                <strong>IF</strong> a contact receives the <i>"VIP"</i> Tag, <strong>THEN</strong> change their Lifecycle Stage to <i>"Qualified"</i> automatically.
            </p>
        </HelpCenterLayout>
    );
}
