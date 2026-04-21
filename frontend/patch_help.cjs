const fs = require('fs');

let code = fs.readFileSync('src/pages/public/help/FeatureHelp.jsx', 'utf8');

const integrationsFeature = `
    'integrations': {
        name: 'Integrations & OAuth',
        icon: <BoltIcon className="w-8 h-8 text-fuchsia-500" />,
        description: 'Connect third-party services and securely link Google Accounts via OAuth.',
        overview: {
            title: 'Overview',
            content: (
                <>
                    <p>
                        Integrations allow your AI Agents and Workflows to seamlessly connect with external services such as Google Drive, Google Calendar, Webhooks, and more.
                    </p>
                </>
            )
        },
        google: {
            title: 'How to setup Google Custom OAuth App (like n8n)',
            content: (
                <>
                    <p>
                        To securely connect your Google Calendar and Google Drive to our platform without sharing a centralized company credential, you can create your own private Custom Auth App directly in Google Cloud Console.
                    </p>

                    <div className="bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-2xl p-6 my-8">
                        <h4 className="text-fuchsia-400 font-bold mb-2">Step 1: Create a Project & Enable APIs</h4>
                        <ol className="list-decimal pl-5 m-0 text-sm text-zinc-300 space-y-1">
                            <li>Go to <a href="https://console.cloud.google.com" target="_blank" className="text-indigo-400 underline">Google Cloud Console</a>.</li>
                            <li>Create a <strong>New Project</strong> and name it (e.g., \`ValueWats Integrations\`).</li>
                            <li>Go to <strong>APIs & Services</strong> &gt; <strong>Library</strong>.</li>
                            <li>Search for and enable <strong>Google Calendar API</strong> and <strong>Google Drive API</strong>.</li>
                        </ol>
                    </div>

                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6 my-8">
                        <h4 className="text-indigo-300 font-bold mb-3">Step 2: OAuth Consent Screen</h4>
                        <ol className="list-decimal pl-5 m-0 text-sm text-zinc-300 space-y-1">
                            <li>Go to <strong>APIs & Services</strong> &gt; <strong>OAuth consent screen</strong>.</li>
                            <li>Select <strong>External</strong> and click <strong>Create</strong>.</li>
                            <li>Fill in App Name and Support Email, then click Save and Continue.</li>
                            <li>In the <strong>Test Users</strong> stage, add your own email address as a test user to grant it permissions.</li>
                        </ol>
                    </div>

                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 mt-10">
                        <h4 className="text-amber-300 font-bold mb-3">Step 3: Generate Client Credentials</h4>
                        <ol className="list-decimal pl-5 m-0 text-sm text-zinc-300 space-y-1">
                            <li>Go back to <strong>APIs & Services</strong> &gt; <strong>Credentials</strong>.</li>
                            <li>Click <strong>+ CREATE CREDENTIALS</strong> &gt; <strong>OAuth client ID</strong>.</li>
                            <li>Choose Application type: <strong>Web application</strong>.</li>
                            <li>In <strong>Authorized redirect URIs</strong>, paste the Redirect URL exactly as shown in your Integrations Connect window.</li>
                            <li>Click <strong>Create</strong>. You will receive your <strong>Client ID</strong> and <strong>Client Secret</strong>. Paste these back into the platform and click Sign in with Google!</li>
                        </ol>
                    </div>
                </>
            )
        }
    },
`;

code = code.replace(
  `    'workflows': {`,
  integrationsFeature + `\n    'workflows': {`
);

fs.writeFileSync('src/pages/public/help/FeatureHelp.jsx', code);
console.log('Patched FeatureHelp.jsx');
