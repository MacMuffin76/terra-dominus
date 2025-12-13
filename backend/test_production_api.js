// Test API /production/rates directement
const axios = require('axios');

async function testAPI() {
  try {
    // Remplace par ton vrai token JWT
    const token = process.env.TEST_TOKEN || 'YOUR_JWT_TOKEN_HERE';
    
    if (token === 'YOUR_JWT_TOKEN_HERE') {
      console.log('❌ Please set TEST_TOKEN environment variable with your JWT token');
      console.log('Example: TEST_TOKEN="eyJhbG..." node test_production_api.js');
      process.exit(1);
    }
    
    const response = await axios.get('http://localhost:5000/api/v1/production/rates', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ API Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    const data = response.data.data;
    console.log('\n📊 Production rates (per hour):');
    console.log(`  Gold: ${(data.production.gold * 3600).toFixed(2)}/h`);
    console.log(`  Metal: ${(data.production.metal * 3600).toFixed(2)}/h`);
    console.log(`  Fuel: ${(data.production.fuel * 3600).toFixed(2)}/h`);
    console.log(`  Energy: ${(data.production.energy * 3600).toFixed(2)}/h`);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testAPI();
