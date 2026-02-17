const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiNjAyOTU2Yi0zZGUwLTRiOTYtYTVmMy02YTY3MGYxOWI4ZjkiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6ImFkbWluIiwidGVuYW50SWQiOiJmNzUyZGJhZi0zZjgwLTQ1MTktYWQ4MS02ODNmMmY4OGFiNTIiLCJpYXQiOjE3NzEzMjk1MDksImV4cCI6MTc3MTMzMzEwOX0.cKhFpMKoAiYK87Vx7KfbAu8qljlRpCYrd6tlfYoHNPo'; // Token from generate_test_token.js
const baseURL = 'http://localhost:3000/api';

async function fetchAPI(endpoint, method = 'GET', body = null) {
  const url = `${baseURL}${endpoint}`;
  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status} - ${await res.text()}`);
    }

    const data = await res.json();
    console.log(`\n--- ${method} ${endpoint} ---`);
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error fetching ${url}:`, error.message);
  }
}

async function run() {
  console.log('Running API Tests...');
  await fetchAPI('/agents');
  await fetchAPI('/agents/templates/list');
  await fetchAPI('/agents/templates/receptionist', 'POST', { name: `Test Agent ${Date.now()}` });
  await fetchAPI('/lifecycle');
  console.log('Tests Completed.');
}

run();
