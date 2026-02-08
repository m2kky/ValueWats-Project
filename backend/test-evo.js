const axios = require('axios');
const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, 'evo_test_results.log');

function log(message) {
  console.log(message);
  fs.appendFileSync(logFile, message + '\n', 'utf8');
}

log('\n\n--- EXTRA TEST: Mixing URL and Key ---');

const mixedConfig = {
    name: 'URL from .env + Key from other file',
    url: 'http://evo-sgwcco4kw80sckwg4c08sgk4.72.62.50.238.sslip.io',
    key: '4fTUxhByzKAao14I1Vpjcc9A2F7Xh2XD'
  };

async function testConnection(config) {
  log(`\n--- Testing ${config.name} ---`);
  log(`URL: ${config.url}`);
  log(`Key: ${config.key.substring(0, 5)}...`);
  
  try {
    const response = await axios.get(`${config.url}/instance/fetchInstances`, {
      headers: {
        apikey: config.key.trim()
      },
      timeout: 5000 
    });

    log('✅ Connection Successful!');
    log(`Status: ${response.status}`);
    log(`Instances: ${response.data.length || 0}`);

  } catch (error) {
    log('❌ Connection Failed!');
    if (error.response) {
      log(`Status: ${error.response.status}`);
      log(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
    } else if (error.request) {
        log('No response received (Timeout or Network Error)');
        log(`Error: ${error.message}`);
    } else {
      log(`Error: ${error.message}`);
    }
  }
}

testConnection(mixedConfig);
