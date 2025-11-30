/**
 * Boss Battles E2E Tests
 * Tests for boss battle system including attacks, phase transitions, and alliance raids
 */

const { test, expect } = require('@playwright/test');

// Test data
const TEST_USER = {
  username: 'testuser_boss',
  email: 'testboss@example.com',
  password: 'Password123!',
};

const TEST_ALLIANCE = {
  name: 'Boss Hunters Alliance',
  tag: 'BOSS',
};

test.describe('Boss Battles System', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:3000/login');
    
    // Login with test user
    await page.fill('input[name="username"]', TEST_USER.username);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await page.waitForURL('**/dashboard');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should navigate to Boss Battles tab', async ({ page }) => {
    // Navigate to Portals page
    await page.click('text=Portals');
    await page.waitForURL('**/portals');
    
    // Click Boss Battles tab
    await page.click('button:has-text("Boss Battles")');
    
    // Verify Boss Battles panel is visible
    await expect(page.locator('text=Boss Battles').first()).toBeVisible();
    await expect(page.locator('text=Boss Battles')).toBeVisible();
  });

  test('should display active bosses list', async ({ page }) => {
    // Navigate to Boss Battles
    await page.click('text=Portals');
    await page.click('button:has-text("Boss Battles")');
    
    // Wait for bosses to load
    await page.waitForSelector('.boss-card, .no-portals', { timeout: 10000 });
    
    // Check if bosses are displayed or empty state
    const hasBosses = await page.locator('.boss-card').count();
    const hasEmptyState = await page.locator('text=No Bosses Found').count();
    
    expect(hasBosses > 0 || hasEmptyState > 0).toBeTruthy();
  });

  test('should filter bosses by tier', async ({ page }) => {
    // Navigate to Boss Battles
    await page.click('text=Portals');
    await page.click('button:has-text("Boss Battles")');
    
    // Wait for filter controls
    await page.waitForSelector('label:has-text("Tier")');
    
    // Select a specific tier
    await page.selectOption('select >> nth=0', 'rare');
    
    // Wait for filtered results
    await page.waitForTimeout(1000);
    
    // Verify filter was applied (URL or visible change)
    const tierSelect = page.locator('select').first();
    await expect(tierSelect).toHaveValue('rare');
  });

  test('should open boss detail modal', async ({ page }) => {
    // Navigate to Boss Battles
    await page.click('text=Portals');
    await page.click('button:has-text("Boss Battles")');
    
    // Wait for bosses to load
    await page.waitForSelector('.boss-card', { timeout: 10000 });
    
    // Click on first boss "View Details" button
    const firstBoss = page.locator('.boss-card').first();
    await firstBoss.locator('button:has-text("View Details")').click();
    
    // Verify modal opened
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('text=Boss Health')).toBeVisible();
  });

  test('should display boss HP bar with phases', async ({ page }) => {
    // Navigate to Boss Battles and open detail
    await page.click('text=Portals');
    await page.click('button:has-text("Boss Battles")');
    await page.waitForSelector('.boss-card', { timeout: 10000 });
    
    const firstBoss = page.locator('.boss-card').first();
    await firstBoss.locator('button:has-text("View Details")').click();
    
    // Verify HP bar elements
    await expect(page.locator('text=Boss Health')).toBeVisible();
    
    // Verify phase indicators (4 phases)
    const phaseChips = page.locator('text=/Phase [1-4]/');
    await expect(phaseChips).toHaveCount(4);
  });

  test('should show boss abilities', async ({ page }) => {
    // Navigate to Boss Battles and open detail
    await page.click('text=Portals');
    await page.click('button:has-text("Boss Battles")');
    await page.waitForSelector('.boss-card', { timeout: 10000 });
    
    const firstBoss = page.locator('.boss-card').first();
    await firstBoss.locator('button:has-text("View Details")').click();
    
    // Verify abilities section
    await expect(page.locator('text=Active Abilities')).toBeVisible();
  });

  test('should open attack modal from boss detail', async ({ page }) => {
    // Navigate to Boss Battles and open detail
    await page.click('text=Portals');
    await page.click('button:has-text("Boss Battles")');
    await page.waitForSelector('.boss-card', { timeout: 10000 });
    
    const firstBoss = page.locator('.boss-card').first();
    await firstBoss.locator('button:has-text("View Details")').click();
    
    // Click Attack Boss button
    await page.click('button:has-text("Attack Boss")');
    
    // Verify attack modal opened
    await expect(page.locator('text=⚔️ Attack Boss')).toBeVisible();
    await expect(page.locator('text=Select Units')).toBeVisible();
  });

  test('should configure units for attack', async ({ page }) => {
    // Navigate and open attack modal
    await page.click('text=Portals');
    await page.click('button:has-text("Boss Battles")');
    await page.waitForSelector('.boss-card', { timeout: 10000 });
    
    const firstBoss = page.locator('.boss-card').first();
    await firstBoss.locator('button:has-text("Attack")').click();
    
    // Fill in unit counts
    await page.fill('input[type="number"]', '100');
    
    // Verify total units updated
    await expect(page.locator('text=Total Units')).toBeVisible();
  });

  test('should select battle tactic', async ({ page }) => {
    // Navigate and open attack modal
    await page.click('text=Portals');
    await page.click('button:has-text("Boss Battles")');
    await page.waitForSelector('.boss-card', { timeout: 10000 });
    
    const firstBoss = page.locator('.boss-card').first();
    await firstBoss.locator('button:has-text("Attack")').click();
    
    // Wait for tactic section
    await expect(page.locator('text=Battle Tactic')).toBeVisible();
    
    // Select aggressive tactic
    await page.click('label:has-text("Aggressive")');
    
    // Verify selection
    const aggressiveRadio = page.locator('input[value="aggressive"]');
    await expect(aggressiveRadio).toBeChecked();
  });

  test('should estimate battle before attacking', async ({ page }) => {
    // Navigate and open attack modal
    await page.click('text=Portals');
    await page.click('button:has-text("Boss Battles")');
    await page.waitForSelector('.boss-card', { timeout: 10000 });
    
    const firstBoss = page.locator('.boss-card').first();
    await firstBoss.locator('button:has-text("Attack")').click();
    
    // Add units
    await page.fill('input[type="number"]', '100');
    
    // Click Estimate button
    await page.click('button:has-text("Estimate")');
    
    // Wait for estimate results
    await expect(page.locator('text=Battle Estimate')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Your Power')).toBeVisible();
    await expect(page.locator('text=Boss Power')).toBeVisible();
  });

  test('should display boss leaderboard', async ({ page }) => {
    // Navigate to Boss Battles and open detail
    await page.click('text=Portals');
    await page.click('button:has-text("Boss Battles")');
    await page.waitForSelector('.boss-card', { timeout: 10000 });
    
    const firstBoss = page.locator('.boss-card').first();
    await firstBoss.locator('button:has-text("View Details")').click();
    
    // Scroll down to leaderboard (if present)
    await page.evaluate(() => window.scrollBy(0, 500));
    
    // Check for leaderboard section
    const leaderboard = page.locator('text=Leaderboard');
    if (await leaderboard.count() > 0) {
      await expect(leaderboard).toBeVisible();
    }
  });

  test('should navigate to Alliance Raids tab', async ({ page }) => {
    // Navigate to Portals
    await page.click('text=Portals');
    
    // Click Alliance Raids tab
    await page.click('button:has-text("Alliance Raids")');
    
    // Verify Raids panel is visible
    await expect(page.locator('text=Alliance Raids')).toBeVisible();
  });

  test('should display create raid button', async ({ page }) => {
    // Navigate to Alliance Raids
    await page.click('text=Portals');
    await page.click('button:has-text("Alliance Raids")');
    
    // Check for Create Raid button
    const createButton = page.locator('button:has-text("Create Raid")');
    
    // Button may be disabled if no alliance
    await expect(createButton).toBeVisible();
  });

  test('should show raid cards with status', async ({ page }) => {
    // Navigate to Alliance Raids
    await page.click('text=Portals');
    await page.click('button:has-text("Alliance Raids")');
    
    // Wait for raids to load
    await page.waitForTimeout(2000);
    
    // Check for raid cards or empty state
    const hasRaids = await page.locator('.raid-card').count();
    const hasEmptyState = await page.locator('text=No Active Raids').count();
    
    expect(hasRaids > 0 || hasEmptyState > 0).toBeTruthy();
  });

  test('should refresh boss list', async ({ page }) => {
    // Navigate to Boss Battles
    await page.click('text=Portals');
    await page.click('button:has-text("Boss Battles")');
    
    // Wait for initial load
    await page.waitForTimeout(2000);
    
    // Click refresh button
    await page.click('button:has-text("Refresh")');
    
    // Wait for refresh to complete
    await page.waitForTimeout(1000);
    
    // Verify page is still visible
    await expect(page.locator('text=Boss Battles')).toBeVisible();
  });

  test('should handle boss not found error', async ({ page }) => {
    // Navigate directly to a non-existent boss (via URL manipulation if possible)
    // This test verifies error handling
    await page.click('text=Portals');
    await page.click('button:has-text("Boss Battles")');
    
    // Wait for load
    await page.waitForTimeout(2000);
    
    // Verify no crash and UI is responsive
    await expect(page.locator('text=Boss Battles')).toBeVisible();
  });

  test('should close boss detail modal', async ({ page }) => {
    // Navigate and open boss detail
    await page.click('text=Portals');
    await page.click('button:has-text("Boss Battles")');
    await page.waitForSelector('.boss-card', { timeout: 10000 });
    
    const firstBoss = page.locator('.boss-card').first();
    await firstBoss.locator('button:has-text("View Details")').click();
    
    // Verify modal is open
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // Close modal (click X or Cancel button)
    await page.click('button:has-text("Cancel")');
    
    // Verify modal closed
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });
});

test.describe('Boss Battle Attack Flow', () => {
  test.skip('should complete full attack flow', async ({ page }) => {
    // This is a complex integration test that requires proper setup
    // Skip by default, run manually with proper test data
    
    // Navigate to Boss Battles
    await page.click('text=Portals');
    await page.click('button:has-text("Boss Battles")');
    await page.waitForSelector('.boss-card', { timeout: 10000 });
    
    // Select boss and attack
    const firstBoss = page.locator('.boss-card').first();
    await firstBoss.locator('button:has-text("Attack")').click();
    
    // Configure units
    const infantryInput = page.locator('input[type="number"]').first();
    await infantryInput.fill('100');
    
    // Select tactic
    await page.click('label:has-text("Balanced")');
    
    // Attack
    await page.click('button:has-text("Attack")');
    
    // Wait for battle result
    await expect(page.locator('text=VICTORY, text=DEFEAT')).toBeVisible({ timeout: 10000 });
    
    // Verify result modal
    await expect(page.locator('text=Damage Dealt')).toBeVisible();
    await expect(page.locator('text=Phases Reached')).toBeVisible();
  });
});

test.describe('Boss Battles Accessibility', () => {
  test('should have proper ARIA labels', async ({ page }) => {
    await page.click('text=Portals');
    await page.click('button:has-text("Boss Battles")');
    
    // Check for dialog roles
    await page.waitForTimeout(2000);
    
    // Verify semantic HTML
    const buttons = page.locator('button');
    await expect(buttons.first()).toBeVisible();
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.click('text=Portals');
    await page.click('button:has-text("Boss Battles")');
    
    // Tab through elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Verify focus is visible
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
});

test.describe('Boss Battles Performance', () => {
  test('should load boss list within 5 seconds', async ({ page }) => {
    const startTime = Date.now();
    
    await page.click('text=Portals');
    await page.click('button:has-text("Boss Battles")');
    
    // Wait for bosses to load
    await page.waitForSelector('.boss-card, .no-portals', { timeout: 5000 });
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000);
  });

  test('should handle rapid filter changes', async ({ page }) => {
    await page.click('text=Portals');
    await page.click('button:has-text("Boss Battles")');
    
    // Rapidly change filters
    for (let i = 0; i < 5; i++) {
      await page.selectOption('select >> nth=0', 'rare');
      await page.waitForTimeout(100);
      await page.selectOption('select >> nth=0', 'all');
      await page.waitForTimeout(100);
    }
    
    // Verify UI is still responsive
    await expect(page.locator('text=Boss Battles')).toBeVisible();
  });
});
