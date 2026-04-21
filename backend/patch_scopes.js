const fs = require('fs');

let code = fs.readFileSync('src/services/integration.service.js', 'utf8');

code = code.replace(
  "'https://www.googleapis.com/auth/drive.readonly']",
  "'https://www.googleapis.com/auth/drive.readonly', 'https://www.googleapis.com/auth/spreadsheets']"
);

fs.writeFileSync('src/services/integration.service.js', code);
console.log('updated scopes in integration.service.js');
