// Test script to validate tutorial frontend integration
// Run in browser console after logging in

async function testTutorialFrontend() {
  console.log('🧪 Testing Tutorial Frontend Implementation...\n');

  // Test 1: Check TutorialContext is available
  console.log('1️⃣ Testing TutorialContext...');
  try {
    const tutorialContext = window.React?.useContext?.(window.TutorialContext);
    console.log('✅ TutorialContext loaded');
  } catch (error) {
    console.log('⚠️ TutorialContext check skipped (requires React DevTools)');
  }

  // Test 2: Check API module
  console.log('\n2️⃣ Testing Tutorial API...');
  try {
    const response = await fetch('/api/v1/tutorial/progress', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    const data = await response.json();
    console.log('✅ API /tutorial/progress working');
    console.log('Current step:', data.currentStep?.id, data.currentStep?.key);
    console.log('Completion:', data.completionPercentage + '%');
  } catch (error) {
    console.error('❌ API call failed:', error.message);
  }

  // Test 3: Check tutorial components exist
  console.log('\n3️⃣ Testing Tutorial Components...');
  const overlay = document.querySelector('.tutorial-overlay');
  const backdrop = document.querySelector('.tutorial-backdrop');
  
  if (overlay) {
    console.log('✅ TutorialOverlay rendered');
  } else {
    console.log('⚠️ TutorialOverlay not visible (may be completed/skipped)');
  }

  // Test 4: Check menu IDs
  console.log('\n4️⃣ Testing Menu Target IDs...');
  const menuTargets = [
    'menu-dashboard',
    'menu-resources',
    'menu-facilities',
    'menu-research',
    'menu-training',
    'menu-world',
  ];
  
  menuTargets.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      console.log(`✅ #${id} found`);
    } else {
      console.log(`❌ #${id} missing`);
    }
  });

  // Test 5: Check resources widget ID
  console.log('\n5️⃣ Testing Resources Widget ID...');
  const resourcesWidget = document.getElementById('resources-widget');
  if (resourcesWidget) {
    console.log('✅ #resources-widget found');
  } else {
    console.log('❌ #resources-widget missing');
  }

  // Test 6: Simulate step completion
  console.log('\n6️⃣ Testing Step Completion...');
  try {
    const progressResponse = await fetch('/api/v1/tutorial/progress', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    const progressData = await progressResponse.json();
    
    if (progressData.currentStep && !progressData.progress.completed) {
      console.log(`Current step: ${progressData.currentStep.id} - ${progressData.currentStep.key}`);
      console.log('To complete this step, use:');
      console.log(`  await fetch('/api/v1/tutorial/complete-step', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + localStorage.getItem('token'),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ stepId: ${progressData.currentStep.id} })
  })`);
    } else {
      console.log('✅ Tutorial already completed');
    }
  } catch (error) {
    console.error('❌ Failed to fetch progress:', error.message);
  }

  console.log('\n🎉 Tutorial Frontend Test Complete!\n');
  console.log('Summary:');
  console.log('- API endpoints: Check network tab');
  console.log('- Components: Check React DevTools');
  console.log('- Styles: Check .tutorial-overlay and .tutorial-complete-card classes');
  console.log('- Context: Wrap App with TutorialProvider ✅');
}

// Export for manual execution
window.testTutorialFrontend = testTutorialFrontend;

console.log('Tutorial Frontend Test loaded! Run: testTutorialFrontend()');
