const fs = require('fs');

let code = fs.readFileSync('src/pages/public/help/FeatureHelp.jsx', 'utf8');

code = code.replace(
  '<li>Search for and enable <strong>Google Calendar API</strong> and <strong>Google Drive API</strong>.</li>',
  '<li>Search for and enable <strong>Google Calendar API</strong>, <strong>Google Drive API</strong>, and <strong>Google Sheets API</strong>.</li>'
);

code = code.replace(
  'access to <strong>Google Drive</strong> (File search & text uploads) and <strong>Google Calendar</strong>',
  'access to <strong>Google Drive</strong> (File search & text uploads), <strong>Google Calendar</strong>, and <strong>Google Sheets</strong>'
);

fs.writeFileSync('src/pages/public/help/FeatureHelp.jsx', code);
console.log('patched FeatureHelp.jsx for Sheets');
