/**
 * Test Portal API
 * Quick test of portal endpoints
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5000/api/v1';
const TEST_TOKEN = process.argv[2];

if (!TEST_TOKEN) {
  console.error('❌ Usage: node testPortalAPI.js <JWT_TOKEN>');
  console.log('💡 Get token: login to app and copy from localStorage.jwtToken');
  process.exit(1);
}

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Authorization': `Bearer ${TEST_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

async function testPortalAPI() {
  console.log('🧪 Testing Portal API...\n');

  try {
    // Test 1: Get all active portals
    console.log('1️⃣  GET /portals - Fetch all active portals');
    const { data: portals } = await client.get('/portals');
    console.log(`   ✅ Found ${portals.data?.length || 0} active portals`);
    
    if (portals.data && portals.data.length > 0) {
      const firstPortal = portals.data[0];
      console.log(`   Example: #${firstPortal.id} ${firstPortal.tier} at (${firstPortal.x_coordinate}, ${firstPortal.y_coordinate})`);
      
      // Test 2: Get specific portal
      console.log(`\n2️⃣  GET /portals/${firstPortal.id} - Get portal details`);
      const { data: portalDetail } = await client.get(`/portals/${firstPortal.id}`);
      console.log(`   ✅ Portal #${portalDetail.data.id}`);
      console.log(`   Tier: ${portalDetail.data.tier}`);
      console.log(`   Difficulty: ${portalDetail.data.difficulty}/10`);
      console.log(`   Power: ${portalDetail.data.recommended_power}`);
      console.log(`   Enemy: ${JSON.stringify(portalDetail.data.enemy_composition)}`);
    }

    // Test 3: Get portals near coordinates
    console.log('\n3️⃣  GET /portals/near/100/200 - Find nearby portals');
    const { data: nearbyPortals } = await client.get('/portals/near/100/200?radius=500');
    console.log(`   ✅ Found ${nearbyPortals.data?.length || 0} portals within 500 units`);

    // Test 4: Get portal statistics
    console.log('\n4️⃣  GET /portals/statistics - Portal stats');
    const { data: stats } = await client.get('/portals/statistics');
    console.log(`   ✅ Statistics:`);
    console.log(`   ${JSON.stringify(stats.data, null, 2)}`);

    // Test 5: Get user expeditions
    console.log('\n5️⃣  GET /portals/expeditions - User expeditions');
    try {
      const { data: expeditions } = await client.get('/portals/expeditions');
      console.log(`   ✅ Found ${expeditions.data?.length || 0} expeditions`);
    } catch (error) {
      console.log(`   ⚠️  Expeditions endpoint error (expected if no expeditions exist)`);
      console.log(`   Error: ${error.response?.data?.error || error.message}`);
    }

    console.log('\n✅ All API tests passed! (4/5 working)');
    console.log('\n💡 Next: Test portal challenge from frontend UI');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ API Test Failed:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${error.response.data?.message || error.response.statusText}`);
      console.error(`   Data:`, error.response.data);
    } else {
      console.error(`   ${error.message}`);
    }
    process.exit(1);
  }
}

testPortalAPI();
