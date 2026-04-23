const fs = require('fs');
const filePath = 'd:/Codes_Projects/valuewatsv1/valuewats/backend/src/server.js';
let content = fs.readFileSync(filePath, 'utf8');
// Fix the broken line with literal \r\n
content = content.replace(
  "const helmet = require('helmet');\\r\\nconst rateLimit = require('express-rate-limit');",
  "const helmet = require('helmet');\r\nconst rateLimit = require('express-rate-limit');"
);
fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed server.js import line');
