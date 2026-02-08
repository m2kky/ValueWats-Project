require('dotenv').config();
const axios = require('axios');

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;

console.log('--- Testing Evolution API Connection ---');
console.log(`URL: ${EVOLUTION_API_URL}`);
console.log(`Key (first 5 chars): ${EVOLUTION_API_KEY ? EVOLUTION_API_KEY.substring(0, 5) + '...' : 'MISSING'}`);

async function testConnection() {
  try {
    // Try to fetch instances (or any lightweight endpoint)
    // The endpoint /instance/fetchInstances is commonly available in Evolution API v2
    console.log('Attempting to fetch instances...');
    // Try root endpoint first for basic connectivity
    const response = await axios.get(`${EVOLUTION_API_URL}/`, {
      headers: {
        apikey: EVOLUTION_API_KEY
      }
    });

    console.log('✅ Connection Successful!');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ Connection Failed!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
}

testConnection();
