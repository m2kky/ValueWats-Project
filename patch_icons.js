const fs = require('fs');

let code = fs.readFileSync('frontend/src/pages/Integrations.jsx', 'utf8');

// For Calendar
code = code.replace(
  "<CalendarIcon className=\"w-12 h-12 text-indigo-100\" />",
  "<img src=\"/assets/google-icons/google-calendar.svg\" alt=\"Google Calendar\" className=\"w-10 h-10 object-contain drop-shadow-lg\" />"
);

code = code.replace(
  "color: 'bg-indigo-600'",
  "color: 'bg-white'"
);

// For Drive
code = code.replace(
  "<DocumentIcon className=\"w-12 h-12 text-blue-100\" />",
  "<img src=\"/assets/google-icons/google-drive.svg\" alt=\"Google Drive\" className=\"w-10 h-10 object-contain drop-shadow-lg\" />"
);

code = code.replace(
  "color: 'bg-blue-600'",
  "color: 'bg-white'"
);

// For Sheets
code = code.replace(
  "<TableCellsIcon className=\"w-12 h-12 text-emerald-100\" />",
  "<img src=\"/assets/google-icons/google-sheets.svg\" alt=\"Google Sheets\" className=\"w-10 h-10 object-contain drop-shadow-lg\" />"
);

code = code.replace(
  "color: 'bg-emerald-600'",
  "color: 'bg-white'"
);

fs.writeFileSync('frontend/src/pages/Integrations.jsx', code);
console.log('patched Integrations icons');
