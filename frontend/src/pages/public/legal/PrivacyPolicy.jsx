import LegalLayout from '../../../components/public/LegalLayout';

export default function PrivacyPolicy() {
    return (
        <LegalLayout title="Privacy Policy" lastUpdated="January 15, 2026">
            <p>
                At Value chat, we are committed to protecting your privacy and ensuring the security of your personal data. This Privacy Policy explains how we collect, use, and safeguard your information when you use our platform.
            </p>

            <h3>1. Information We Collect</h3>
            <p>
                We construct and process various types of data to provide our WhatsApp automation services, including:
            </p>
            <ul>
                <li><strong>Account Information:</strong> Name, email, billing details.</li>
                <li><strong>Platform Data:</strong> Messages, contacts, AI agent configurations, and workflow structures you create.</li>
                <li><strong>Usage Data:</strong> Telemetry, logs, and analytics on how you use our dashboard.</li>
            </ul>

            <h3>2. How We Use Information</h3>
            <p>Your data is strictly used to:</p>
            <ul>
                <li>Provide, maintain, and improve the Value chat platform.</li>
                <li>Train and execute your custom AI agents based <strong>only</strong> on your specific knowledge base.</li>
                <li>Communicate with you regarding account updates and technical support.</li>
            </ul>

            <h3>3. Data Sharing</h3>
            <p>
                We do not sell your personal data or your customers' data. We only share information with trusted third-party subprocessors (like hosting providers and LLM APIs) necessary to deliver our services.
            </p>

            <h3>4. Your Rights</h3>
            <p>
                Depending on your jurisdiction (e.g., GDPR, CCPA), you have the right to access, correct, delete, or export your personal data. Contact us at <a href="mailto:privacy@valuechat.app">privacy@valuechat.app</a> to exercise these rights.
            </p>
        </LegalLayout>
    );
}
