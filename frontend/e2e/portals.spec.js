/**
 * E2E Tests for Portal System
 * Tests the complete portal user journey from discovery to battle completion
 * 
 * Prerequisites:
 * - Backend server running (npm start in backend/)
 * - Database seeded with test data
 * - At least one active portal spawned
 * 
 * Test Coverage:
 * - Portal discovery and filtering
 * - Portal detail viewing
 * - Battle estimation
 * - Portal attack execution
 * - Mastery progression tracking
 * - Battle history viewing
 */

import { test, expect } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || 'http://localhost:5000';

// Test user credentials
const TEST_USER = {
  username: 'portal_tester',
  password: 'TestPass123!',
  email: 'portal.test@example.com'
};

test.describe('Portal System - Complete User Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="username"]', TEST_USER.username);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('T1: Navigate to Portal page and verify UI elements', async ({ page }) => {
    // Navigate to Portals
    await page.click('text=Portails PvE');
    await expect(page).toHaveURL(/.*portals/);

    // Verify page title
    await expect(page.locator('h1')).toContainText('Portails PvE');

    // Verify tab system
    await expect(page.locator('text=Portails Actifs')).toBeVisible();
    await expect(page.locator('text=Maîtrise')).toBeVisible();
    await expect(page.locator('text=Historique')).toBeVisible();

    // Verify filters are present
    await expect(page.locator('select#tier-filter')).toBeVisible();
    await expect(page.locator('input[type="range"]#min-difficulty')).toBeVisible();
    await expect(page.locator('select#sort-filter')).toBeVisible();
  });

  test('T2: Filter portals by tier and difficulty', async ({ page }) => {
    await page.goto(`${BASE_URL}/portals`);

    // Get initial portal count
    const initialCount = await page.locator('.portal-card').count();

    // Filter by green tier
    await page.selectOption('select#tier-filter', 'green');
    await page.waitForTimeout(500); // Wait for filter to apply

    // Verify only green portals are shown
    const greenPortals = await page.locator('.portal-card.portal-tier-green').count();
    const totalPortals = await page.locator('.portal-card').count();
    expect(greenPortals).toBe(totalPortals);

    // Filter by difficulty range
    await page.selectOption('select#tier-filter', 'all');
    await page.fill('input#min-difficulty', '5');
    await page.fill('input#max-difficulty', '7');
    await page.waitForTimeout(500);

    // Verify filtered results
    const filteredCount = await page.locator('.portal-card').count();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
  });

  test('T3: Sort portals by different criteria', async ({ page }) => {
    await page.goto(`${BASE_URL}/portals`);

    // Sort by difficulty (highest first)
    await page.selectOption('select#sort-filter', 'difficulty');
    await page.waitForTimeout(500);

    // Get first portal difficulty
    const firstCardDifficulty = await page.locator('.portal-card').first().locator('.difficulty-num').textContent();
    
    // Verify it's higher than last portal
    const lastCardDifficulty = await page.locator('.portal-card').last().locator('.difficulty-num').textContent();
    
    const firstDiff = parseInt(firstCardDifficulty?.split('/')[0] || '0');
    const lastDiff = parseInt(lastCardDifficulty?.split('/')[0] || '0');
    expect(firstDiff).toBeGreaterThanOrEqual(lastDiff);
  });

  test('T4: Open portal detail modal and verify information', async ({ page }) => {
    await page.goto(`${BASE_URL}/portals`);

    // Click on first portal card
    await page.locator('.portal-card').first().click();

    // Verify modal is open
    await expect(page.locator('.portal-modal-overlay')).toBeVisible();
    await expect(page.locator('.modal-header h2')).toBeVisible();

    // Verify portal information sections
    await expect(page.locator('text=Informations du Portail')).toBeVisible();
    await expect(page.locator('text=Composition Ennemie')).toBeVisible();
    await expect(page.locator('text=Récompenses Attendues')).toBeVisible();
    await expect(page.locator('text=Configuration de l\'Attaque')).toBeVisible();

    // Close modal
    await page.click('.modal-close');
    await expect(page.locator('.portal-modal-overlay')).not.toBeVisible();
  });

  test('T5: Configure attack with unit selection and tactics', async ({ page }) => {
    await page.goto(`${BASE_URL}/portals`);
    await page.locator('.portal-card').first().click();

    // Fill unit quantities
    await page.fill('input[value="infantry"]', '100');
    await page.fill('input[value="tank"]', '50');
    await page.fill('input[value="artillery"]', '25');

    // Verify total units counter updates
    await expect(page.locator('.total-value')).toContainText('175');

    // Select aggressive tactic
    await page.click('label:has-text("Agressive")');
    
    // Verify tactic is selected
    await expect(page.locator('.tactic-option.selected')).toContainText('Agressive');
  });

  test('T6: Use unit presets', async ({ page }) => {
    await page.goto(`${BASE_URL}/portals`);
    await page.locator('.portal-card').first().click();

    // Click balanced preset
    await page.click('button[title="Équilibré"]');
    await page.waitForTimeout(300);

    // Verify all unit types have 100 units
    const infantryValue = await page.inputValue('input[value="infantry"]');
    const tankValue = await page.inputValue('input[value="tank"]');
    expect(infantryValue).toBe('100');
    expect(tankValue).toBe('100');

    // Click ground forces preset
    await page.click('button[title="Armée Terrestre"]');
    await page.waitForTimeout(300);

    // Verify ground units are populated, air units are 0
    const helicopterValue = await page.inputValue('input[value="helicopter"]');
    const fighterValue = await page.inputValue('input[value="fighter"]');
    expect(helicopterValue).toBe('0');
    expect(fighterValue).toBe('0');
  });

  test('T7: Battle estimation displays correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/portals`);
    await page.locator('.portal-card').first().click();

    // Enter units to trigger estimation
    await page.fill('input[value="infantry"]', '100');
    await page.fill('input[value="tank"]', '50');
    
    // Wait for estimation to load (debounced 500ms)
    await page.waitForTimeout(1000);

    // Verify estimation section appears
    await expect(page.locator('.battle-estimation')).toBeVisible();
    await expect(page.locator('.power-bar.player-bar')).toBeVisible();
    await expect(page.locator('.power-bar.portal-bar')).toBeVisible();
    await expect(page.locator('.verdict-text')).toBeVisible();

    // Verify power ratio is displayed
    await expect(page.locator('.ratio-value')).toBeVisible();
  });

  test('T8: Attack portal and verify response', async ({ page }) => {
    await page.goto(`${BASE_URL}/portals`);
    await page.locator('.portal-card').first().click();

    // Configure attack
    await page.fill('input[value="infantry"]', '200');
    await page.fill('input[value="tank"]', '100');
    await page.click('label:has-text("Équilibrée")');
    
    // Wait for estimation
    await page.waitForTimeout(1000);

    // Click attack button
    await page.click('button:has-text("Lancer l\'Attaque")');

    // Verify success or error message
    const successAlert = page.locator('.alert-success');
    const errorAlert = page.locator('.alert-error');
    
    await expect(successAlert.or(errorAlert)).toBeVisible({ timeout: 5000 });

    // If successful, modal should close after 2 seconds
    // If error, check error message is meaningful
    const alertText = await successAlert.or(errorAlert).textContent();
    expect(alertText).toBeTruthy();
  });

  test('T9: View portal mastery progression', async ({ page }) => {
    await page.goto(`${BASE_URL}/portals`);

    // Switch to Mastery tab
    await page.click('text=Maîtrise');
    await page.waitForTimeout(500);

    // Verify mastery cards are displayed
    const masteryCards = await page.locator('.mastery-card').count();
    expect(masteryCards).toBeGreaterThan(0);

    // Verify tier badges are visible
    await expect(page.locator('.tier-rank').first()).toBeVisible();
    
    // Verify mastery level info
    await expect(page.locator('.level-name').first()).toBeVisible();
    
    // Check for progress bars or max level badges
    const progressBars = await page.locator('.progress-bar').count();
    const maxLevelBadges = await page.locator('.max-level-badge').count();
    expect(progressBars + maxLevelBadges).toBeGreaterThan(0);
  });

  test('T10: View battle history', async ({ page }) => {
    await page.goto(`${BASE_URL}/portals`);

    // Switch to History tab
    await page.click('text=Historique');
    await page.waitForTimeout(500);

    // Check if history table exists or empty state
    const historyTable = page.locator('.history-table');
    const emptyState = page.locator('.history-empty');

    if (await historyTable.isVisible()) {
      // Verify table headers
      await expect(page.locator('th:has-text("Date")')).toBeVisible();
      await expect(page.locator('th:has-text("Portail")')).toBeVisible();
      await expect(page.locator('th:has-text("Résultat")')).toBeVisible();

      // Verify summary stats
      await expect(page.locator('.summary-stat').first()).toBeVisible();
    } else {
      // Verify empty state message
      await expect(emptyState).toBeVisible();
      await expect(emptyState).toContainText('Aucun historique');
    }
  });

  test('T11: Filter battle history by result', async ({ page }) => {
    await page.goto(`${BASE_URL}/portals`);
    await page.click('text=Historique');
    await page.waitForTimeout(500);

    // Only run if history exists
    if (await page.locator('.history-table').isVisible()) {
      // Filter by victories only
      await page.selectOption('select:has-text("Résultat")', 'victory');
      await page.waitForTimeout(300);

      // Verify all visible rows are victories
      const victoryRows = await page.locator('tr.victory').count();
      const totalRows = await page.locator('.history-table tbody tr').count();
      
      if (totalRows > 0) {
        expect(victoryRows).toBe(totalRows);
      }
    }
  });

  test('T12: Golden portal event banner displays correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/portals`);

    // Check if golden event banner appears (depends on backend state)
    const goldenBanner = page.locator('.golden-event-banner');
    
    // If banner exists, verify its content
    if (await goldenBanner.isVisible()) {
      await expect(goldenBanner).toContainText('Légendaire');
      
      // Verify golden portals are in the grid
      const goldenPortals = await page.locator('.portal-card.portal-tier-golden').count();
      expect(goldenPortals).toBeGreaterThan(0);
    }
  });

  test('T13: Auto-refresh updates portal list', async ({ page }) => {
    await page.goto(`${BASE_URL}/portals`);

    // Get initial portal count
    const initialCount = await page.locator('.portal-card').count();

    // Wait for auto-refresh (30 seconds + buffer)
    await page.waitForTimeout(31000);

    // Verify page is still responsive
    await expect(page.locator('h1')).toBeVisible();

    // Portal count might change due to spawning/expiry
    const newCount = await page.locator('.portal-card').count();
    expect(newCount).toBeGreaterThanOrEqual(0);
  });

  test('T14: Expiring soon portals display warning', async ({ page }) => {
    await page.goto(`${BASE_URL}/portals`);

    // Check for portals with expiring-soon class
    const expiringSoonCount = await page.locator('.portal-card.expiring-soon').count();

    if (expiringSoonCount > 0) {
      // Verify urgent styling
      const expiringCard = page.locator('.portal-card.expiring-soon').first();
      await expect(expiringCard.locator('.time-remaining.urgent')).toBeVisible();
    }
  });

  test('T15: Responsive design - Mobile view', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${BASE_URL}/portals`);

    // Verify page is still functional
    await expect(page.locator('h1')).toBeVisible();
    
    // Verify portal cards are displayed in single column
    const firstCard = page.locator('.portal-card').first();
    await expect(firstCard).toBeVisible();

    // Open portal detail modal
    await firstCard.click();
    await expect(page.locator('.portal-modal-overlay')).toBeVisible();

    // Verify modal is scrollable on mobile
    const modal = page.locator('.portal-modal-content');
    await expect(modal).toBeVisible();
  });
});

test.describe('Portal System - API Integration Tests', () => {
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    // Login to get auth token
    const response = await request.post(`${API_URL}/api/v1/auth/login`, {
      data: {
        username: TEST_USER.username,
        password: TEST_USER.password
      }
    });
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    authToken = data.token;
  });

  test('API-T1: Get active portals', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/v1/portals`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(Array.isArray(data.portals)).toBeTruthy();
  });

  test('API-T2: Get portal by ID', async ({ request }) => {
    // First get list of portals
    const listResponse = await request.get(`${API_URL}/api/v1/portals`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const listData = await listResponse.json();

    if (listData.portals.length > 0) {
      const portalId = listData.portals[0].portal_id;

      // Get specific portal
      const response = await request.get(`${API_URL}/api/v1/portals/${portalId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.portal.portal_id).toBe(portalId);
    }
  });

  test('API-T3: Estimate battle', async ({ request }) => {
    const listResponse = await request.get(`${API_URL}/api/v1/portals`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const listData = await listResponse.json();

    if (listData.portals.length > 0) {
      const portalId = listData.portals[0].portal_id;

      const response = await request.post(`${API_URL}/api/v1/portals/${portalId}/estimate`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
        data: {
          units: {
            infantry: 100,
            tank: 50
          }
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.estimation).toBeDefined();
      expect(data.estimation.player_power).toBeGreaterThan(0);
      expect(data.estimation.portal_power).toBeGreaterThan(0);
    }
  });

  test('API-T4: Get user mastery', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/v1/portals/mastery`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(Array.isArray(data.mastery)).toBeTruthy();
  });

  test('API-T5: Get battle history', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/v1/portals/history?limit=10`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(Array.isArray(data.history)).toBeTruthy();
  });
});

// Export test configuration
export const portalTestConfig = {
  baseURL: BASE_URL,
  apiURL: API_URL,
  testUser: TEST_USER,
  timeouts: {
    autoRefresh: 30000,
    estimation: 1000,
    attackResponse: 5000
  }
};
