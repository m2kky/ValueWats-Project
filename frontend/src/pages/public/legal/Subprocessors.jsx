import LegalLayout from '../../../components/public/LegalLayout';

export default function Subprocessors() {
    return (
        <LegalLayout title="Our Subprocessors" lastUpdated="January 15, 2026">
            <p>
                To provide the ValueWats service, we engage and use certain third-party data processors with access to certain Customer Data (each, a "Subprocessor").
            </p>
            <p>
                Prior to engaging any third party Subprocessor, we evaluate their privacy, security, and confidentiality practices and execute an agreement implementing applicable data protection obligations.
            </p>

            <h3>Core Infrastructure</h3>
            <ul>
                <li><strong>Hosting Provider:</strong> Coolify / Private Cloud (Used for deploying and running the core web application and database).</li>
                <li><strong>Amazon Web Services (AWS) / MinIO:</strong> Used for secure media and file storage.</li>
            </ul>

            <h3>Communication & AI Services</h3>
            <ul>
                <li><strong>Evolution API:</strong> Our partner for handling the official WhatsApp Business API connectivity.</li>
                <li><strong>DeepSeek / LLM Providers:</strong> Used for processing text to provide AI-generated agent responses. Only the context you explicitly provide to the agent is processed.</li>
            </ul>

            <p>
                If you have specific questions about where and how your data is processed, please contact <a href="mailto:privacy@valuewats.com">privacy@valuewats.com</a>.
            </p>
        </LegalLayout>
    );
}
