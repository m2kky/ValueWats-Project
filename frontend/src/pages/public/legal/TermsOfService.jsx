import LegalLayout from '../../../components/public/LegalLayout';

export default function TermsOfService() {
    return (
        <LegalLayout title="Terms of Service" lastUpdated="January 15, 2026">
            <p>
                These Terms of Service ("Terms") govern your use of the Value chat platform. By accessing or using our services, you agree to be bound by these Terms.
            </p>

            <h3>1. Use of the Platform</h3>
            <p>
                Value chat provides a software-as-a-service (SaaS) platform for WhatsApp automation and AI agents. You agree to use the platform only for lawful purposes and in compliance with WhatsApp's Business Business Terms of Service.
            </p>

            <h3>2. Acceptable Use</h3>
            <p>You may not use Value chat to:</p>
            <ul>
                <li>Send unsolicited spam or violate anti-spam laws.</li>
                <li>Distribute malware, phishing, or malicious content.</li>
                <li>Violate the intellectual property or privacy rights of others.</li>
            </ul>

            <h3>3. Account Responsibilities</h3>
            <p>
                You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use.
            </p>

            <h3>4. Termination</h3>
            <p>
                We reserve the right to suspend or terminate your account if you violate these Terms, WhatsApp's policies, or engage in any activity that harms our platform or reputation.
            </p>
        </LegalLayout>
    );
}
