const fs = require('fs');

// 1. PATCH ROUTES
let routeCode = fs.readFileSync('src/routes/integrations.js', 'utf8');

routeCode = routeCode.replace(
  'const { name, clientId, clientSecret, redirectUri } = req.body;',
  'const { name, clientId, clientSecret, redirectUri, type } = req.body;'
);

routeCode = routeCode.replace(
  'const result = await integrationService.createOAuthPending(\n      req.user.tenantId,\n      name || \'Google Connection\',\n      clientId,\n      clientSecret,\n      redirectUri\n    );',
  'const result = await integrationService.createOAuthPending(\n      req.user.tenantId,\n      name || \'Google Connection\',\n      clientId,\n      clientSecret,\n      redirectUri,\n      type\n    );'
);

fs.writeFileSync('src/routes/integrations.js', routeCode);

// 2. PATCH SERVICE
let serviceCode = fs.readFileSync('src/services/integration.service.js', 'utf8');

serviceCode = serviceCode.replace(
  'async createOAuthPending(tenantId, name, clientId, clientSecret, redirectUri) {',
  'async createOAuthPending(tenantId, name, clientId, clientSecret, redirectUri, specificType) {'
);

serviceCode = serviceCode.replace(
  "type: 'google_oauth',",
  "type: specificType || 'google_oauth',"
);

fs.writeFileSync('src/services/integration.service.js', serviceCode);

console.log('Backend OAuth type grouping separated!');
