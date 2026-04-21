const fs = require('fs');

let code = fs.readFileSync('src/pages/Integrations.jsx', 'utf8');

code = code.replace(
  'access to <strong>Google Drive</strong> (File search & text uploads) and <strong>Google Calendar</strong> (creating and reading appointments).',
  'access to <strong>Google Drive</strong>, <strong>Google Calendar</strong>, and <strong>Google Sheets</strong> (Create, append, read data).'
);

code = code.replace(
  'Google Workspace',
  'Google Workspace (Drive, Calendar, Sheets)'
);

fs.writeFileSync('src/pages/Integrations.jsx', code);
console.log('patched Integrations.jsx for Sheets text');
