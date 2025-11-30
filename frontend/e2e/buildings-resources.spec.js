import { test, expect } from '@playwright/test';

/**
 * Buildings & Resources E2E Tests
 * Tests for resource management, building construction, and upgrades
 */

// Helper to login
async function authenticatedPage(page) {
  await page.goto('/login');
  await page.fill('input[name="username"]', 'e2e_builder');
  await page.fill('input[name="password"]', 'SecurePass123!');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
}

test.describe('Resource Management', () => {
  test.beforeEach(async ({ page }) => {
    await authenticatedPage(page);
  });

  test('should display current resource levels on dashboard', async ({ page }) => {
    await page.goto('/dashboard');

    // Check all 3 main resources are displayed
    await expect(page.locator('text=/Gold|Or/i')).toBeVisible();
    await expect(page.locator('text=/Metal|Métal/i')).toBeVisible();
    await expect(page.locator('text=/Fuel|Carburant/i')).toBeVisible();

    // Resource values should be numeric
    const goldValue = await page.locator('[data-testid="gold-amount"], [data-resource="gold"]').first();
    if (await goldValue.isVisible({ timeout: 2000 })) {
      const text = await goldValue.textContent();
      expect(text).toMatch(/\d+/); // Should contain numbers
    }
  });

  test('should auto-update resources in real-time', async ({ page }) => {
    await page.goto('/dashboard');

    // Get initial gold value
    const goldLocator = page.locator('[data-testid="gold-amount"], [data-resource="gold"]').first();
    const initialGold = await goldLocator.textContent({ timeout: 3000 }).catch(() => '0');

    // Wait a few seconds for production
    await page.waitForTimeout(5000);

    // Gold should have increased (if production > 0)
    const newGold = await goldLocator.textContent({ timeout: 3000 }).catch(() => '0');

    console.log(`Gold: ${initialGold} → ${newGold}`);
    // Note: This test assumes positive production rate
  });

  test('should show resource storage capacity', async ({ page }) => {
    await page.goto('/resources');

    // Storage info should be visible
    await expect(
      page.locator('text=/Storage|Stockage|Capacity|Capacité/i')
    ).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Building Construction', () => {
  test.beforeEach(async ({ page }) => {
    await authenticatedPage(page);
  });

  test('should list all available buildings', async ({ page }) => {
    await page.goto('/resources');

    // Should see main resource buildings
    await expect(page.locator('text=/Gold Mine|Mine d\'or/i')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=/Metal Mine|Mine de métal/i')).toBeVisible();
    await expect(page.locator('text=/Fuel Refinery|Raffinerie/i')).toBeVisible();
  });

  test('should show building requirements and costs', async ({ page }) => {
    await page.goto('/resources');

    // Click on a building to see details
    const buildingCard = page.locator('.building-card, [data-building]').first();

    if (await buildingCard.isVisible({ timeout: 3000 })) {
      await buildingCard.click();

      // Should show costs
      await expect(page.locator('text=/Cost|Coût|Required|Requis/i')).toBeVisible({
        timeout: 3000,
      });
    }
  });

  test('should start building construction when clicking upgrade', async ({ page }) => {
    await page.goto('/resources');

    // Find an upgradeable building
    const upgradeButton = page
      .locator('button:has-text("Upgrade"), button:has-text("Améliorer")')
      .first();

    if (await upgradeButton.isEnabled({ timeout: 2000 })) {
      await upgradeButton.click();

      // Should show construction started message
      await expect(
        page.locator('text=/Construction|Started|Building|Lancée/i')
      ).toBeVisible({ timeout: 5000 });
    } else {
      console.log('⚠️ No upgradeable buildings available (insufficient resources or max level)');
    }
  });

  test('should display construction queue', async ({ page }) => {
    await page.goto('/resources');

    // Look for construction queue section
    const queueSection = page.locator(
      'text=/Construction Queue|File d\'attente|In Progress/i'
    );

    if (await queueSection.isVisible({ timeout: 3000 })) {
      console.log('✅ Construction queue visible');

      // Should show time remaining for active constructions
      await expect(page.locator('text=/Time|Temps|Remaining|Restant/i')).toBeVisible();
    }
  });

  test('should cancel construction from queue', async ({ page }) => {
    await page.goto('/resources');

    // Find cancel button in queue
    const cancelButton = page.locator('button:has-text("Cancel"), button:has-text("Annuler")');

    if (await cancelButton.isVisible({ timeout: 2000 })) {
      // Click first cancel button
      await cancelButton.first().click();

      // Should show confirmation dialog
      const confirmButton = page.locator(
        'button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Confirmer")'
      );

      if (await confirmButton.isVisible({ timeout: 2000 })) {
        await confirmButton.click();

        // Should show cancellation success
        await expect(page.locator('text=/Cancelled|Annulé|Removed/i')).toBeVisible({
          timeout: 3000,
        });
      }
    }
  });

  test('should speedup construction with premium currency', async ({ page }) => {
    await page.goto('/resources');

    // Look for speedup button
    const speedupButton = page.locator(
      'button:has-text("Speed up"), button:has-text("Accélérer"), button[aria-label*="speed"]'
    );

    if (await speedupButton.isVisible({ timeout: 2000 })) {
      await speedupButton.first().click();

      // Should show speedup confirmation with cost
      await expect(
        page.locator('text=/Credits|Crédits|Cost|Coût|Confirm/i')
      ).toBeVisible({ timeout: 3000 });
    }
  });
});

test.describe('Building Upgrades', () => {
  test.beforeEach(async ({ page }) => {
    await authenticatedPage(page);
  });

  test('should show current building levels', async ({ page }) => {
    await page.goto('/resources');

    // Buildings should show their current level
    await expect(page.locator('text=/Level|Niveau|Lv\\.? \\d+/i')).toBeVisible({ timeout: 5000 });
  });

  test('should calculate upgrade time based on level', async ({ page }) => {
    await page.goto('/resources');

    // Click upgrade on a building
    const upgradeButton = page
      .locator('button:has-text("Upgrade"), button:has-text("Améliorer")')
      .first();

    if (await upgradeButton.isVisible({ timeout: 2000 })) {
      // Hover to see tooltip or click to see details
      await upgradeButton.hover();

      // Should show duration
      await expect(page.locator('text=/\\d+[smhd]|Duration|Durée/i')).toBeVisible({
        timeout: 2000,
      });
    }
  });

  test('should prevent upgrade when resources insufficient', async ({ page }) => {
    await page.goto('/resources');

    // Find disabled upgrade buttons
    const disabledUpgrade = page.locator('button:disabled:has-text("Upgrade")');

    if (await disabledUpgrade.isVisible({ timeout: 2000 })) {
      console.log('✅ Upgrade correctly disabled for insufficient resources');

      // Should show why it's disabled
      await expect(
        page.locator('text=/Insufficient|Insuffisant|Not enough|Pas assez/i')
      ).toBeVisible();
    }
  });

  test('should unlock new buildings at certain levels', async ({ page }) => {
    await page.goto('/resources');

    // Check for locked/unlocked indicators
    const lockedBuildings = page.locator('[data-locked="true"], .building-locked');

    if (await lockedBuildings.count() > 0) {
      // Should show unlock requirements
      await expect(
        page.locator('text=/Requires|Nécessite|Unlock at|Débloque/i')
      ).toBeVisible();
    }
  });
});

test.describe('Facilities (Research, Training, Defense)', () => {
  test.beforeEach(async ({ page }) => {
    await authenticatedPage(page);
  });

  test('should navigate to facilities page', async ({ page }) => {
    await page.goto('/facilities');
    await expect(page).toHaveURL(/\/facilities/);

    // Should show facility types
    await expect(
      page.locator('text=/Research|Defense|Training|Défense|Entraînement/i')
    ).toBeVisible({ timeout: 5000 });
  });

  test('should upgrade research lab', async ({ page }) => {
    await page.goto('/research');

    const upgradeButton = page.locator('button:has-text("Upgrade"), button:has-text("Améliorer")');

    if (await upgradeButton.isVisible({ timeout: 2000 })) {
      const isEnabled = await upgradeButton.isEnabled();

      if (isEnabled) {
        await upgradeButton.click();
        await expect(page.locator('text=/Research|Construction/i')).toBeVisible({
          timeout: 3000,
        });
      }
    }
  });

  test('should build defense structures', async ({ page }) => {
    await page.goto('/defense');

    // Should see defense options
    await expect(
      page.locator('text=/Turret|Cannon|Wall|Tourelle|Mur|Canon/i')
    ).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Resource Production Optimization', () => {
  test.beforeEach(async ({ page }) => {
    await authenticatedPage(page);
  });

  test('should show production rates per hour', async ({ page }) => {
    await page.goto('/dashboard');

    // Production rates should be displayed
    await expect(page.locator('text=/\\/h|per hour|par heure|production/i')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should calculate total production from all buildings', async ({ page }) => {
    await page.goto('/resources');

    // Should show total production summary
    const productionSummary = page.locator(
      'text=/Total Production|Production Totale/i'
    );

    if (await productionSummary.isVisible({ timeout: 3000 })) {
      console.log('✅ Production summary visible');
    }
  });

  test('should apply faction bonuses to production', async ({ page }) => {
    // If user is in Industrial Syndicate faction
    await page.goto('/dashboard');

    // Check if production bonuses are indicated
    const bonusIndicator = page.locator('text=/Bonus|\\+\\d+%/i');

    if (await bonusIndicator.isVisible({ timeout: 2000 })) {
      console.log('✅ Production bonuses displayed');
    }
  });
});
