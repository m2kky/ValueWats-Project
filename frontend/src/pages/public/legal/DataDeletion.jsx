import LegalLayout from '../../../components/public/LegalLayout';

export default function DataDeletion() {
    return (
        <LegalLayout title="Data Deletion Instructions" lastUpdated="April 12, 2026">
            <p>
                This page explains how users can request deletion of personal data processed by Value chat.
            </p>

            <h3>1. How to Submit a Deletion Request</h3>
            <p>
                Send your request to <a href="mailto:privacy@valuechat.app">privacy@valuechat.app</a> with the subject line <strong>"Data Deletion Request"</strong>.
            </p>

            <h3>2. Information to Include</h3>
            <ul>
                <li><strong>Account email:</strong> The email used to register in Value chat.</li>
                <li><strong>Workspace name:</strong> Your organization or tenant name (if available).</li>
                <li><strong>Platform identifier:</strong> WhatsApp/Instagram/Facebook page identifier related to the request.</li>
                <li><strong>Request scope:</strong> Whether you want full account deletion or specific data deletion.</li>
            </ul>

            <h3>3. Processing Timeline</h3>
            <p>
                We verify ownership of the request and process deletion within 30 days, unless a longer period is required by law.
            </p>

            <h3>4. What We Delete</h3>
            <ul>
                <li>Profile and workspace data associated with the request.</li>
                <li>Connected conversation data, message history, and contacts within applicable retention limits.</li>
                <li>Automation, agent, and workflow records tied to the deleted workspace/account.</li>
            </ul>

            <h3>5. Legal Retention Exceptions</h3>
            <p>
                We may retain a minimal subset of records where required for legal compliance, fraud prevention, dispute handling, or security obligations.
            </p>
        </LegalLayout>
    );
}
