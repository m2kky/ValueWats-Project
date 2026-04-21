const fs = require('fs');

let code = fs.readFileSync('src/pages/Agents.jsx', 'utf8');

// For Calendar
code = code.replace(
  "availableIntegrations.filter(i => i.type === 'google_oauth').map(i => (",
  "availableIntegrations.filter(i => i.type === 'google_calendar_oauth').map(i => ("
);

// For Drive
code = code.replace(
  "availableIntegrations.filter(i => i.type === 'google_oauth').map(i => (",
  "availableIntegrations.filter(i => i.type === 'google_drive_oauth').map(i => ("
);

// For Sheets
code = code.replace(
  "availableIntegrations.filter(i => i.type === 'google_oauth' || i.type === 'google_sheets').map(i => (",
  "availableIntegrations.filter(i => i.type === 'google_sheets_oauth').map(i => ("
);

fs.writeFileSync('src/pages/Agents.jsx', code);
console.log('Agents.jsx updated for specific OAuth types');
