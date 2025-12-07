/**
 * Test script for legacy quest API
 * Tests the /api/v1/quests endpoints
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/v1';

// You need to replace this with a valid JWT token from your app
const TOKEN = 'YOUR_JWT_TOKEN_HERE';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Type': 'application/json'
  }
});

async function testQuestAPI() {
  console.log('🧪 Testing Legacy Quest API\n');

  try {
    // Test 1: Get user quests
    console.log('1️⃣ Testing GET /quests');
    const questsResponse = await api.get('/quests');
    console.log('✅ Success:', JSON.stringify(questsResponse.data, null, 2));
    console.log('');

    // Test 2: Get quest stats
    console.log('2️⃣ Testing GET /quests/stats');
    const statsResponse = await api.get('/quests/stats');
    console.log('✅ Success:', JSON.stringify(statsResponse.data, null, 2));
    console.log('');

    // Test 3: Assign daily quests
    console.log('3️⃣ Testing POST /quests/daily/assign');
    const dailyResponse = await api.post('/quests/daily/assign');
    console.log('✅ Success:', JSON.stringify(dailyResponse.data, null, 2));
    console.log('');

    console.log('🎉 All tests passed!');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.log('\n⚠️  Authentication failed. Please update TOKEN in the script with a valid JWT token.');
      console.log('You can get a token by:');
      console.log('1. Opening your browser developer console');
      console.log('2. Going to Application > Local Storage');
      console.log('3. Finding the "authToken" or similar key');
    }
  }
}

// Run the tests
testQuestAPI();
