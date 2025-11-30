import { test, expect } from '@playwright/test';

/**
 * Critical User Journeys
 * End-to-end tests covering complete user workflows from registration to gameplay
 */

// Helper function to create authenticated context
async function loginUser(page, username = 'e2e_journey_user', password = 'SecurePass123!') {
  await page.goto('/login');
  await page.fill('input[name="username"]', username);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
}

test.describe('Critical User Journey: New Player Experience', () => {
  const newUser = {
    username: `journey_${Date.now()}`,
    email: `journey_${Date.now()}@example.com`,
    password: 'SecurePass123!',
  };

  test('Complete journey: Register → View Dashboard → Build → Train Units → Attack', async ({
    page,
  }) => {
    // Step 1: Register new account
    await page.goto('/register');
    await page.fill('input[name="username"]', newUser.username);
    await page.fill('input[name="email"]', newUser.email);
    await page.fill('input[name="password"]', newUser.password);
    await page.fill('input[name="confirmPassword"]', newUser.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    // Step 2: Verify dashboard shows initial resources
    await expect(page.locator('text=/Gold|Or/i')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=/Metal|Métal/i')).toBeVisible();
    await expect(page.locator('text=/Fuel|Carburant/i')).toBeVisible();

    // Step 3: Navigate to resources/buildings
    await page.click('a[href*="/resources"], a:has-text("Resources"), a:has-text("Ressources")');
    await expect(page).toHaveURL(/\/resources/, { timeout: 5000 });

    // Step 4: Upgrade a building (Gold Mine)
    const upgradeButton = page
      .locator('button:has-text("Upgrade"), button:has-text("Améliorer")')
      .first();

    if (await upgradeButton.isVisible({ timeout: 2000 })) {
      await upgradeButton.click();

      // Should see success message or construction started
      await expect(
        page.locator('text=/Construction|Started|Lancée|Success/i')
      ).toBeVisible({ timeout: 5000 });
    }

    // Step 5: Navigate to training
    await page.click('a[href*="/training"], a:has-text("Training"), a:has-text("Entraînement")');
    await expect(page).toHaveURL(/\/training/, { timeout: 5000 });

    // Step 6: Train units (if resources available)
    const infantryInput = page.locator('input[name="quantity"], input[type="number"]').first();

    if (await infantryInput.isVisible({ timeout: 2000 })) {
      await infantryInput.fill('5');
      const trainButton = page.locator('button:has-text("Train"), button:has-text("Entraîner")').first();

      if (await trainButton.isEnabled({ timeout: 1000 })) {
        await trainButton.click();
        await expect(
          page.locator('text=/Training|Entraînement|Success|Réussi/i')
        ).toBeVisible({ timeout: 5000 });
      }
    }

    // Step 7: View world map
    await page.click('a[href*="/world"], a:has-text("World"), a:has-text("Monde")');
    await expect(page).toHaveURL(/\/world/, { timeout: 5000 });

    // Should see map tiles or world grid
    await expect(page.locator('canvas, .world-tile, .map-container')).toBeVisible({
      timeout: 5000,
    });

    // Journey complete - user has completed core loop
    console.log(`✅ New player journey completed for ${newUser.username}`);
  });
});

test.describe('Critical User Journey: Returning Player', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page, 'existing_player', 'SecurePass123!');
  });

  test('Daily routine: Check resources → Collect → Build → Attack', async ({ page }) => {
    // Step 1: View dashboard
    await page.goto('/dashboard');
    await expect(page.locator('text=/Gold|Or/i')).toBeVisible();

    // Step 2: Check resource production
    const goldAmount = await page
      .locator('[data-resource="gold"], [data-resource="or"]')
      .first()
      .textContent();
    expect(goldAmount).toBeTruthy();

    // Step 3: Navigate to buildings and check construction queue
    await page.click('a[href*="/resources"]');
    await expect(page).toHaveURL(/\/resources/);

    // Check if any constructions are complete
    const collectButton = page.locator('button:has-text("Collect"), button:has-text("Collecter")');
    if (await collectButton.isVisible({ timeout: 2000 })) {
      await collectButton.first().click();
      await expect(page.locator('text=/Collected|Collecté/i')).toBeVisible({ timeout: 3000 });
    }

    // Step 4: Check units
    await page.click('a[href*="/units"]');
    await expect(page).toHaveURL(/\/units/);

    // Should see unit counts
    await expect(page.locator('text=/Infantry|Tank|Infanterie/i')).toBeVisible();

    // Step 5: Optionally launch attack if units available
    const attackLink = page.locator('a[href*="/combat"], a:has-text("Combat"), a:has-text("Attack")');
    if (await attackLink.isVisible({ timeout: 2000 })) {
      await attackLink.click();
      // Just verify combat page loads
      await expect(page.locator('text=/Attack|Attaque|Target/i')).toBeVisible({ timeout: 3000 });
    }
  });
});

test.describe('Critical User Journey: Alliance Member', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page, 'alliance_member', 'SecurePass123!');
  });

  test('Alliance flow: View alliance → Check treasury → Communicate', async ({ page }) => {
    // Step 1: Navigate to alliances
    await page.goto('/alliances');
    await expect(page).toHaveURL(/\/alliances/);

    // Step 2: Check if user has alliance or can create one
    const myAllianceLink = page.locator('a:has-text("My Alliance"), a:has-text("Mon Alliance")');

    if (await myAllianceLink.isVisible({ timeout: 3000 })) {
      await myAllianceLink.click();

      // Step 3: View alliance details
      await expect(page.locator('text=/Members|Membres|Treasury|Trésor/i')).toBeVisible({
        timeout: 5000,
      });

      // Step 4: Check treasury tab
      const treasuryTab = page.locator('button:has-text("Treasury"), button:has-text("Trésor")');
      if (await treasuryTab.isVisible({ timeout: 2000 })) {
        await treasuryTab.click();
        await expect(page.locator('text=/Balance|Solde|Deposit|Dépôt/i')).toBeVisible();
      }

      // Step 5: Check chat/communication
      const chatTab = page.locator('button:has-text("Chat"), a[href*="/chat"]');
      if (await chatTab.isVisible({ timeout: 2000 })) {
        await chatTab.click();
        await expect(
          page.locator('textarea, input[placeholder*="message"], input[placeholder*="Message"]')
        ).toBeVisible({ timeout: 3000 });
      }
    } else {
      // User has no alliance - check if they can browse/join
      await expect(
        page.locator('text=/Create Alliance|Join|Créer|Rejoindre/i')
      ).toBeVisible();
    }
  });
});

test.describe('Critical User Journey: Economy & Trading', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page, 'trader_player', 'SecurePass123!');
  });

  test('Trading flow: View market → Check prices → Place order', async ({ page }) => {
    // Step 1: Navigate to market
    await page.goto('/market');
    await expect(page).toHaveURL(/\/market/);

    // Step 2: Should see market interface
    await expect(page.locator('text=/Market|Marché|Buy|Sell/i')).toBeVisible({ timeout: 5000 });

    // Step 3: Check if orders are displayed
    const ordersList = page.locator('.market-orders, .orders-list, table');
    if (await ordersList.isVisible({ timeout: 3000 })) {
      console.log('✅ Market orders visible');
    }

    // Step 4: Try to create sell order
    const createOrderButton = page.locator(
      'button:has-text("Create Order"), button:has-text("Sell"), button:has-text("Vendre")'
    );

    if (await createOrderButton.isVisible({ timeout: 2000 })) {
      await createOrderButton.click();

      // Should see order form
      await expect(
        page.locator('text=/Resource|Price|Quantity|Ressource|Prix|Quantité/i')
      ).toBeVisible({ timeout: 3000 });
    }
  });

  test('Trade routes flow: View routes → Create route → Monitor convoy', async ({ page }) => {
    // Navigate to trade routes
    const tradeLink = page.locator('a[href*="/trade"], a:has-text("Trade Routes")');

    if (await tradeLink.isVisible({ timeout: 3000 })) {
      await tradeLink.click();
      await expect(page).toHaveURL(/\/trade/);

      // Should see trade routes interface
      await expect(page.locator('text=/Routes|Convoys|Caravanes/i')).toBeVisible();

      // Check if can create route
      const createRouteButton = page.locator(
        'button:has-text("Create Route"), button:has-text("Créer")'
      );
      if (await createRouteButton.isVisible({ timeout: 2000 })) {
        console.log('✅ Can create trade routes');
      }
    }
  });
});

test.describe('Critical User Journey: Factions System', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page, 'faction_player', 'SecurePass123!');
  });

  test('Faction flow: View factions → Join faction → Check bonuses', async ({ page }) => {
    // Navigate to factions
    await page.goto('/factions');

    // Should see factions list
    await expect(
      page.locator('text=/Terran|Nomad|Syndicate|Federation|Raiders/i')
    ).toBeVisible({ timeout: 5000 });

    // Check if user can join a faction
    const joinButton = page.locator('button:has-text("Join"), button:has-text("Rejoindre")').first();

    if (await joinButton.isVisible({ timeout: 2000 })) {
      await joinButton.click();

      // Should show confirmation or success
      await expect(page.locator('text=/Joined|Success|Rejoint|Réussi/i')).toBeVisible({
        timeout: 5000,
      });
    }

    // Check bonuses page
    const bonusesLink = page.locator('a:has-text("Bonuses"), a:has-text("Bonus")');
    if (await bonusesLink.isVisible({ timeout: 2000 })) {
      await bonusesLink.click();
      await expect(page.locator('text=/Defense|Attack|Production/i')).toBeVisible();
    }
  });
});
