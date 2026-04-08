import LegalLayout from '../../../components/public/LegalLayout';

export default function Security() {
    return (
        <LegalLayout title="Security" lastUpdated="January 15, 2026">
            <p>
                At Value chat, we treat security as our highest priority. We realize that an enterprise communication platform handles highly sensitive data.
            </p>

            <h3>Data Encryption</h3>
            <ul>
                <li><strong>In Transit:</strong> All data sent to or from our infrastructure is encrypted in transit via industry-standard TLS 1.3.</li>
                <li><strong>At Rest:</strong> All customer data, user credentials, and WhatsApp messages are encrypted at rest using AES-256 encryption.</li>
            </ul>

            <h3>Access Control</h3>
            <p>
                We practice the principle of least privilege. Internal access to our production infrastructure is strictly limited to authorized engineering personnel and requires VPN access, role-based access control (RBAC), and multi-factor authentication (MFA).
            </p>

            <h3>Continuous Monitoring</h3>
            <p>
                Our infrastructure is continuously monitored for anomalies. We employ automated threat detection and perform regular vulnerability scanning on both our application code and our containerized infrastructure.
            </p>

            <h3>Vulnerability Reporting</h3>
            <p>
                If you believe you have found a security vulnerability in our platform, please report it to us immediately at <a href="mailto:security@valuechat.app">security@valuechat.app</a> so we can evaluate and remediate it.
            </p>
        </LegalLayout>
    );
}
