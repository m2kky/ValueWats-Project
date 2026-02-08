const axios = require('axios');

const KEY = 'xAcfPQAeHabOIir3oo46lyqMBrvLy8lY';

const urls = [
  'http://evo-sgwcco4kw80sckwg4c08sgk4.72.62.50.238.sslip.io', // The one from .env (likely new instance)
  'http://evo-lo0w8co8sg4gos4s0wgk4ow8.72.62.50.238.sslip.io', // The one from local file (likely old instance matching the key)
  'http://evo-p0gg0ssgg84s44ggg8wwok88.72.62.50.238.sslip.io'  // Another one found
];

async function testConnection(url) {
  console.log(`\nTesting URL: ${url}`);
  try {
    const response = await axios.get(`${url}/instance/fetchInstances`, {
      headers: {
        apikey: KEY
      },
      timeout: 5000
    });
    console.log('✅ Success!');
    console.log('Instances:', response.data.length || 0);
  } catch (error) {
    if (error.response) {
       console.log(`❌ Failed: ${error.response.status} ${JSON.stringify(error.response.data)}`);
    } else {
       console.log(`❌ Error: ${error.message}`);
    }
  }
}

async function run() {
  for (const url of urls) {
    await testConnection(url);
  }
}

run();
