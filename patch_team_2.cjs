const fs = require('fs');

let code = fs.readFileSync('frontend/src/pages/Team.jsx', 'utf8');

// Remove the old isAdmin definition
code = code.replace(
  "const isAdmin = currentUser.role === 'admin';",
  ""
);

fs.writeFileSync('frontend/src/pages/Team.jsx', code);
console.log('patched Team.jsx second part');
