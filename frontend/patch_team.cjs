const fs = require('fs');

let code = fs.readFileSync('src/pages/Team.jsx', 'utf8');

// Fix isAdmin
code = code.replace(
  "const isAdmin = currentUser.role === 'admin';",
  "const isAdmin = ['admin', 'owner'].includes(currentUser.role) || currentUser.isSuperAdmin;"
);

// Add Copy Invite Link functionality
// First, import DocumentDuplicateIcon
code = code.replace(
  "XMarkIcon\n} from '@heroicons/react/24/outline';",
  "XMarkIcon,\n  DocumentDuplicateIcon\n} from '@heroicons/react/24/outline';"
);

// Find the pending invites mapping
// The chunk is:
/*
<ul className="divide-y divide-white/5">
              {invitations.map((invite) => (
                <li key={invite.id} className="px-6 py-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
*/
const copyFunction = `                  <div className="flex items-center">
                    <div className="ml-2">
                      <div className="flex items-center gap-2">
                         <div className="text-base font-bold text-white tracking-tight">{invite.email}</div>
                         <button 
                           onClick={() => {
                             navigator.clipboard.writeText(\`\${window.location.origin}/register?email=\${encodeURIComponent(invite.email)}\`);
                             alert('Invite link copied! Send it to the user.');
                           }}
                           className="text-indigo-400 hover:text-indigo-300 transition-colors"
                           title="Copy direct invite link"
                         >
                           <DocumentDuplicateIcon className="w-4 h-4" />
                         </button>
                      </div>`;

code = code.replace(
  `                  <div className="flex items-center">
                    <div className="ml-2">
                      <div className="text-base font-bold text-white tracking-tight">{invite.email}</div>`,
  copyFunction
);

fs.writeFileSync('src/pages/Team.jsx', code);
console.log('patched Team.jsx logic and UI');
