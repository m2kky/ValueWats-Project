require('dotenv').config();
const axios = require('axios');

const baseURL = process.env.EVOLUTION_API_URL;
const keysToTry = [
  process.env.EVOLUTION_API_KEY,               // Current .env
  '108200aA',                                  // User set value
  'xAcfPQAeHabOIir3oo46lyqMBrvLy8lY',          // From evolution-api file
  'xAcfPQAeHabOlir3oo46IyqMBrvLy8IY'           // Original value
];

console.log('Testing Evolution API Connection...');
console.log('URL:', baseURL);

async function testConnection() {
  for (const key of keysToTry) {
    if (!key) continue;
    console.log(`\n🔑 Testing Key: ${key.slice(0, 4)}...${key.slice(-4)}`);
    
    try {
      const response = await axios.get(`${baseURL}/instance/fetchInstances`, {
        headers: { apikey: key.trim() },
      });
      console.log('✅ Success! Found the correct key!');
      console.log('Full Key:', key);
      return; 
    } catch (e) {
      console.log('❌ Failed:', e.response?.status || e.message);
    }
  }
  console.log('\n❌ All keys failed.');
}

testConnection();
