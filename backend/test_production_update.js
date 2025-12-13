// Test script to verify production rates refresh after building upgrade
const container = require('./container');

async function testProductionUpdate() {
  try {
    console.log('🧪 Testing production update after building change...\n');

    const userId = 1; // Change to your user ID
    const productionCalculatorService = container.resolve('productionCalculatorService');

    // Get initial production rates
    console.log('📊 Initial production rates:');
    const rates1 = await productionCalculatorService.calculateProductionRates(userId);
    console.log('Gold:', (rates1.production.gold * 3600).toFixed(2), '/h');
    console.log('Metal:', (rates1.production.metal * 3600).toFixed(2), '/h');
    console.log('Fuel:', (rates1.production.fuel * 3600).toFixed(2), '/h');
    console.log('Energy:', (rates1.production.energy * 3600).toFixed(2), '/h');

    console.log('\n✅ Test completed. Frontend should refresh production rates automatically when buildings are upgraded via socket events.');
    console.log('\n🔍 To test the full flow:');
    console.log('1. Start the backend server');
    console.log('2. Start the frontend dev server');
    console.log('3. Login and check the resource widget');
    console.log('4. Upgrade a resource building');
    console.log('5. Wait for the upgrade to complete');
    console.log('6. Check console logs for "🏗️ Construction queue updated, refreshing production rates..."');
    console.log('7. Verify the production rate in the widget updates automatically');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

testProductionUpdate();
