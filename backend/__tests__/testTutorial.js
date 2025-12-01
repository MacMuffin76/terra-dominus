/**
 * Test Tutorial System
 * This script tests the interactive tutorial functionality
 */

const createContainer = require('./container');
const TutorialProgress = require('./models/TutorialProgress');
const User = require('./models/User');
const sequelize = require('./db');

async function testTutorialSystem() {
  console.log('🎓 Testing Tutorial System...\n');

  const container = createContainer();
  const tutorialService = container.resolve('tutorialService');

  try {
    // Test 1: Get all tutorial steps
    const { getAllSteps } = require('./modules/tutorial/domain/tutorialRules');
    const steps = getAllSteps();
    console.log(`Test 1: Tutorial Steps`);
    console.log(`  ✅ Total steps: ${steps.length}`);
    console.log(`  Steps: ${steps.map(s => s.key).join(', ')}\n`);

    // Test 2: Create test user
    console.log('Test 2: Initialize Tutorial for New User');
    
    const City = require('./models/City');
    const Resource = require('./models/Resource');
    
    let testUser = await User.findOne({ where: { username: 'test_tutorial_user' } });
    if (!testUser) {
      testUser = await User.create({
        username: 'test_tutorial_user',
        email: 'tutorial@test.com',
        password: 'hashedpassword',
        protection_shield_until: new Date(Date.now() + 259200000),
        attacks_sent_count: 0
      });
      console.log(`  ✅ Created test user: ${testUser.username} (ID: ${testUser.id})`);
      
      // Create city for test user
      const city = await City.create({
        user_id: testUser.id,
        name: 'Test City',
        is_capital: true,
        coord_x: 100,
        coord_y: 100,
      });
      console.log(`  ✅ Created test city (ID: ${city.id})`);
      
      // Create resources
      await Resource.bulkCreate([
        { city_id: city.id, type: 'or', amount: 1000 },
        { city_id: city.id, type: 'metal', amount: 1000 },
        { city_id: city.id, type: 'carburant', amount: 0 },
        { city_id: city.id, type: 'energie', amount: 0 },
      ]);
      console.log(`  ✅ Created test resources`);
    } else {
      console.log(`  ℹ️  Using existing user: ${testUser.username} (ID: ${testUser.id})`);
    }

    // Test 3: Initialize tutorial
    const progress = await tutorialService.initializeTutorial(testUser.id);
    console.log(`  ✅ Tutorial initialized`);
    console.log(`  Current step: ${progress.current_step}`);
    console.log(`  Completed: ${progress.completed}`);
    console.log(`  Completed steps: ${progress.completed_steps.length}\n`);

    // Test 4: Get progress
    console.log('Test 3: Get Tutorial Progress');
    const progressData = await tutorialService.getProgress(testUser.id);
    console.log(`  ✅ Progress retrieved`);
    console.log(`  Current step: ${progressData.currentStep.title}`);
    console.log(`  Completion: ${progressData.completionPercentage}%`);
    console.log(`  Next step: ${progressData.nextStep ? progressData.nextStep.title : 'None'}\n`);

    // Test 5: Complete first step
    console.log('Test 4: Complete Step 1 (Welcome)');
    const step1Result = await tutorialService.completeStep(testUser.id, 1);
    console.log(`  ✅ Step 1 completed`);
    console.log(`  Reward granted: ${JSON.stringify(step1Result.stepCompleted.reward)}`);
    console.log(`  Next step: ${step1Result.nextStep.title}`);
    console.log(`  Tutorial complete: ${step1Result.tutorialCompleted}\n`);

    // Test 6: Complete step 2
    console.log('Test 5: Complete Step 2 (View Resources)');
    const step2Result = await tutorialService.completeStep(testUser.id, 2);
    console.log(`  ✅ Step 2 completed`);
    console.log(`  Progress: ${step2Result.progress.completed_steps.length}/10 steps\n`);

    // Test 7: Try completing invalid step
    console.log('Test 6: Invalid Step Validation');
    try {
      await tutorialService.completeStep(testUser.id, 999);
      console.log(`  ❌ Should have thrown error for invalid step\n`);
    } catch (error) {
      console.log(`  ✅ Correctly rejected invalid step: "${error.message}"\n`);
    }

    // Test 8: Check completion percentage
    const updatedProgress = await tutorialService.getProgress(testUser.id);
    console.log('Test 7: Completion Tracking');
    console.log(`  ✅ Completion: ${updatedProgress.completionPercentage}%`);
    console.log(`  Steps completed: ${updatedProgress.progress.completed_steps.length}`);
    console.log(`  Current step: ${updatedProgress.currentStep.title}\n`);

    // Test 9: Reset tutorial
    console.log('Test 8: Reset Tutorial');
    const resetProgress = await tutorialService.resetTutorial(testUser.id);
    console.log(`  ✅ Tutorial reset`);
    console.log(`  Current step: ${resetProgress.current_step}`);
    console.log(`  Completed steps: ${resetProgress.completed_steps.length}\n`);

    // Test 10: Skip tutorial
    console.log('Test 9: Skip Tutorial');
    const skippedProgress = await tutorialService.skipTutorial(testUser.id);
    console.log(`  ✅ Tutorial skipped`);
    console.log(`  Completed: ${skippedProgress.completed}`);
    console.log(`  Skipped: ${skippedProgress.skipped}\n`);

    // Test 11: Get statistics
    console.log('Test 10: Tutorial Statistics');
    const stats = await tutorialService.getStatistics();
    console.log(`  ✅ Statistics retrieved`);
    console.log(`  Total: ${stats.total}`);
    console.log(`  Completed: ${stats.completed} (${stats.completionRate}%)`);
    console.log(`  Skipped: ${stats.skipped} (${stats.skipRate}%)`);
    console.log(`  In Progress: ${stats.inProgress}\n`);

    console.log('✅ All tutorial system tests passed!\n');

    console.log('📊 Tutorial Configuration:');
    const { TUTORIAL_CONFIG } = require('./modules/tutorial/domain/tutorialRules');
    console.log(`  Total Steps: ${TUTORIAL_CONFIG.TOTAL_STEPS}`);
    console.log(`  Auto Start: ${TUTORIAL_CONFIG.AUTO_START}`);
    console.log(`  Skip Enabled: ${TUTORIAL_CONFIG.SHOW_SKIP_BUTTON}`);
    console.log(`  Replay Enabled: ${TUTORIAL_CONFIG.REPLAY_ENABLED}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run tests
testTutorialSystem()
  .then(() => {
    console.log('\n🎉 Tutorial system is ready!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Tests failed:', error.message);
    process.exit(1);
  });
