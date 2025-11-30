/**
 * Manual test script for PvP Balancing endpoints
 * Run: node testPvpBalancing.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/v1';

// You need to replace this with a valid JWT token from your app
// Get it from localStorage after logging in, or create a test user
const AUTH_TOKEN = process.env.TEST_TOKEN || 'YOUR_TOKEN_HERE';

const headers = {
  'Authorization': `Bearer ${AUTH_TOKEN}`,
  'Content-Type': 'application/json'
};

async function testPvpEndpoints() {
  console.log('🧪 Testing PvP Balancing Endpoints...\n');

  try {
    // Test 1: Get my power
    console.log('1️⃣ GET /pvp/power/me');
    try {
      const powerResponse = await axios.get(`${BASE_URL}/pvp/power/me`, { headers });
      console.log('✅ Success:', JSON.stringify(powerResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Error:', error.response?.status, error.response?.data?.message || error.message);
    }

    console.log('\n---\n');

    // Test 2: Get power breakdown
    console.log('2️⃣ GET /pvp/power/me/breakdown');
    try {
      const breakdownResponse = await axios.get(`${BASE_URL}/pvp/power/me/breakdown`, { headers });
      console.log('✅ Success:', JSON.stringify(breakdownResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Error:', error.response?.status, error.response?.data?.message || error.message);
    }

    console.log('\n---\n');

    // Test 3: Check matchmaking fairness (replace with actual target userId)
    console.log('3️⃣ GET /pvp/matchmaking/fairness/:targetUserId');
    try {
      const targetUserId = 2; // Replace with actual user ID
      const fairnessResponse = await axios.get(`${BASE_URL}/pvp/matchmaking/fairness/${targetUserId}`, { headers });
      console.log('✅ Success:', JSON.stringify(fairnessResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Error:', error.response?.status, error.response?.data?.message || error.message);
    }

    console.log('\n---\n');

    // Test 4: Get matchmaking suggestions
    console.log('4️⃣ POST /pvp/matchmaking/suggest');
    try {
      const suggestResponse = await axios.post(`${BASE_URL}/pvp/matchmaking/suggest`, {
        excludeUserIds: [],
        limit: 5
      }, { headers });
      console.log('✅ Success:', JSON.stringify(suggestResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Error:', error.response?.status, error.response?.data?.message || error.message);
    }

    console.log('\n---\n');

    // Test 5: Estimate attack cost
    console.log('5️⃣ POST /pvp/attack/estimate-cost');
    try {
      const costResponse = await axios.post(`${BASE_URL}/pvp/attack/estimate-cost`, {
        targetUserId: 2, // Replace with actual user ID
        units: [
          { entityId: 1, quantity: 10 }
        ],
        distance: 5.0
      }, { headers });
      console.log('✅ Success:', JSON.stringify(costResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Error:', error.response?.status, error.response?.data?.message || error.message);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Check if routes are registered (without auth)
async function testRoutesRegistration() {
  console.log('🔍 Checking if PvP routes are registered...\n');
  
  try {
    // This should return 401 Unauthorized (not 404), proving the route exists
    const response = await axios.get(`${BASE_URL}/pvp/power/me`, {
      validateStatus: () => true // Accept any status
    });
    
    if (response.status === 404) {
      console.log('❌ Routes NOT registered (404 Not Found)');
    } else if (response.status === 401) {
      console.log('✅ Routes ARE registered (401 Unauthorized - expected without token)');
    } else {
      console.log('⚠️ Unexpected status:', response.status);
    }
  } catch (error) {
    console.log('❌ Connection error:', error.message);
  }
}

// Run tests
(async () => {
  await testRoutesRegistration();
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  if (AUTH_TOKEN === 'YOUR_TOKEN_HERE') {
    console.log('⚠️ To run authenticated tests, set TEST_TOKEN environment variable:');
    console.log('   export TEST_TOKEN="your_jwt_token_here"');
    console.log('   node testPvpBalancing.js\n');
  } else {
    await testPvpEndpoints();
  }
})();
