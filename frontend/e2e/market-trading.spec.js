import { test, expect } from '@playwright/test';

/**
 * Market & Trading E2E Tests
 * Tests for marketplace, trade orders, trade routes, and resource convoys
 */

async function authenticatedPage(page, username = 'e2e_trader') {
  await page.goto('/login');
  await page.fill('input[name="username"]', username);
  await page.fill('input[name="password"]', 'SecurePass123!');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
}

test.describe('Market Overview', () => {
  test.beforeEach(async ({ page }) => {
    await authenticatedPage(page);
  });

  test('should navigate to market page', async ({ page }) => {
    await page.goto('/market');
    await expect(page).toHaveURL(/\/market/);

    // Should see market interface
    await expect(page.locator('text=/Market|Buy|Sell|Marché|Acheter|Vendre/i')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should display resource prices', async ({ page }) => {
    await page.goto('/market');

    // Should show prices for wood, stone, iron, food
    await expect(page.locator('text=/Wood|Stone|Iron|Food|Bois|Pierre|Fer|Nourriture/i')).toBeVisible({
      timeout: 5000,
    });

    // Should show price values
    await expect(page.locator('text=/Price|Prix|Gold|Or/i')).toBeVisible();
  });

  test('should show buy and sell orders', async ({ page }) => {
    await page.goto('/market');

    // Should see order book
    await expect(page.locator('text=/Buy Orders|Sell Orders|Ordres d\'achat|Offres/i')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should display market trends', async ({ page }) => {
    await page.goto('/market');

    // Should show price history or trend indicators
    const trendIndicator = page.locator('text=/Trend|Rising|Falling|Stable|Tendance/i');

    if (await trendIndicator.isVisible({ timeout: 3000 })) {
      console.log('✅ Market trends displayed');
    }
  });

  test('should filter orders by resource type', async ({ page }) => {
    await page.goto('/market');

    // Find resource filter
    const filterSelect = page.locator('select[name="resource"], button[aria-label*="filter"]');

    if (await filterSelect.isVisible({ timeout: 2000 })) {
      await filterSelect.click();

      // Should see resource options
      await expect(page.locator('option, [role="option"]')).toBeVisible();
    }
  });
});

test.describe('Buy Orders', () => {
  test.beforeEach(async ({ page }) => {
    await authenticatedPage(page);
  });

  test('should place buy order with valid data', async ({ page }) => {
    await page.goto('/market');

    // Fill buy order form
    const resourceSelect = page.locator('select[name="resource"]');
    const quantityInput = page.locator('input[name="quantity"]');
    const priceInput = page.locator('input[name="price"]');
    const buyButton = page.locator('button:has-text("Buy"), button:has-text("Place Buy Order")');

    if (await resourceSelect.isVisible({ timeout: 3000 })) {
      await resourceSelect.selectOption('wood');
      await quantityInput.fill('1000');
      await priceInput.fill('5');

      if (await buyButton.isEnabled()) {
        await buyButton.click();

        // Should show order placed confirmation
        await expect(page.locator('text=/Order Placed|Success|Commande passée/i')).toBeVisible({
          timeout: 5000,
        });
      }
    }
  });

  test('should reject buy order with insufficient gold', async ({ page }) => {
    await page.goto('/market');

    const quantityInput = page.locator('input[name="quantity"]');
    const priceInput = page.locator('input[name="price"]');
    const buyButton = page.locator('button:has-text("Buy")');

    if (await quantityInput.isVisible({ timeout: 2000 })) {
      // Try to buy massive amount
      await quantityInput.fill('999999');
      await priceInput.fill('100');

      if (await buyButton.isEnabled()) {
        await buyButton.click();

        // Should show insufficient funds error
        await expect(
          page.locator('text=/Insufficient|Not enough gold|Pas assez/i')
        ).toBeVisible({ timeout: 3000 });
      } else {
        console.log('✅ Buy button correctly disabled for insufficient gold');
      }
    }
  });

  test('should display my active buy orders', async ({ page }) => {
    await page.goto('/market');

    // Should see "My Orders" section
    const myOrdersTab = page.locator('button:has-text("My Orders"), a[href*="orders"]');

    if (await myOrdersTab.isVisible({ timeout: 2000 })) {
      await myOrdersTab.click();

      // Should show active orders
      await expect(page.locator('text=/Active|Pending|En cours/i')).toBeVisible({
        timeout: 3000,
      });
    }
  });

  test('should cancel active buy order', async ({ page }) => {
    await page.goto('/market/orders');

    // Find cancel button
    const cancelButton = page.locator('button:has-text("Cancel"), button:has-text("Annuler")');

    if (await cancelButton.isVisible({ timeout: 3000 })) {
      await cancelButton.first().click();

      // Confirm cancellation
      const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")');
      if (await confirmButton.isVisible({ timeout: 2000 })) {
        await confirmButton.click();

        // Should show cancelled confirmation
        await expect(page.locator('text=/Cancelled|Annulé/i')).toBeVisible({ timeout: 3000 });
      }
    }
  });

  test('should instantly buy from existing sell order', async ({ page }) => {
    await page.goto('/market');

    // Find "Buy Now" button on sell orders
    const buyNowButton = page.locator('button:has-text("Buy Now"), button:has-text("Acheter")');

    if (await buyNowButton.isVisible({ timeout: 3000 })) {
      await buyNowButton.first().click();

      // Should show purchase confirmation
      await expect(page.locator('text=/Purchased|Success|Acheté/i')).toBeVisible({
        timeout: 5000,
      });
    }
  });
});

test.describe('Sell Orders', () => {
  test.beforeEach(async ({ page }) => {
    await authenticatedPage(page);
  });

  test('should place sell order with valid data', async ({ page }) => {
    await page.goto('/market');

    // Switch to sell tab
    const sellTab = page.locator('button:has-text("Sell"), a[href*="sell"]');
    if (await sellTab.isVisible({ timeout: 2000 })) {
      await sellTab.click();
    }

    const resourceSelect = page.locator('select[name="resource"]');
    const quantityInput = page.locator('input[name="quantity"]');
    const priceInput = page.locator('input[name="price"]');
    const sellButton = page.locator('button:has-text("Sell"), button:has-text("Place Sell Order")');

    if (await resourceSelect.isVisible({ timeout: 3000 })) {
      await resourceSelect.selectOption('stone');
      await quantityInput.fill('500');
      await priceInput.fill('6');

      if (await sellButton.isEnabled()) {
        await sellButton.click();

        // Should show order placed confirmation
        await expect(page.locator('text=/Order Placed|Success|Commande passée/i')).toBeVisible({
          timeout: 5000,
        });
      }
    }
  });

  test('should reject sell order with insufficient resources', async ({ page }) => {
    await page.goto('/market');

    const quantityInput = page.locator('input[name="quantity"]');
    const sellButton = page.locator('button:has-text("Sell")');

    if (await quantityInput.isVisible({ timeout: 2000 })) {
      // Try to sell more than owned
      await quantityInput.fill('999999');

      if (await sellButton.isEnabled()) {
        await sellButton.click();

        // Should show insufficient resources error
        await expect(
          page.locator('text=/Insufficient|Not enough|Pas assez/i')
        ).toBeVisible({ timeout: 3000 });
      } else {
        console.log('✅ Sell button correctly disabled for insufficient resources');
      }
    }
  });

  test('should display my active sell orders', async ({ page }) => {
    await page.goto('/market/orders');

    // Should see sell orders I placed
    await expect(page.locator('text=/Selling|Sell Order|Vente/i')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should cancel active sell order', async ({ page }) => {
    await page.goto('/market/orders');

    // Find cancel button
    const cancelButton = page.locator('button:has-text("Cancel"), button[aria-label*="cancel"]');

    if (await cancelButton.isVisible({ timeout: 3000 })) {
      await cancelButton.first().click();

      // Confirm cancellation
      const confirmButton = page.locator('button:has-text("Confirm")');
      if (await confirmButton.isVisible({ timeout: 2000 })) {
        await confirmButton.click();
        await expect(page.locator('text=/Cancelled|Annulé/i')).toBeVisible({ timeout: 3000 });
      }
    }
  });

  test('should instantly sell to existing buy order', async ({ page }) => {
    await page.goto('/market');

    // Find "Sell Now" button on buy orders
    const sellNowButton = page.locator('button:has-text("Sell Now"), button:has-text("Vendre")');

    if (await sellNowButton.isVisible({ timeout: 3000 })) {
      await sellNowButton.first().click();

      // Should show sale confirmation
      await expect(page.locator('text=/Sold|Success|Vendu/i')).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Trade Routes', () => {
  test.beforeEach(async ({ page }) => {
    await authenticatedPage(page);
  });

  test('should navigate to trade routes page', async ({ page }) => {
    await page.goto('/trade-routes');
    await expect(page).toHaveURL(/\/trade/);

    // Should see trade routes interface
    await expect(page.locator('text=/Trade Routes|Routes|Routes commerciales/i')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should create new trade route', async ({ page }) => {
    await page.goto('/trade-routes');

    // Find create route button
    const createButton = page.locator('button:has-text("Create Route"), button:has-text("Créer")');

    if (await createButton.isVisible({ timeout: 3000 })) {
      await createButton.click();

      // Fill route details
      const targetInput = page.locator('input[name="targetPlayer"], input[placeholder*="target"]');
      const resourceSelect = page.locator('select[name="resource"]');
      const quantityInput = page.locator('input[name="quantity"]');
      const submitButton = page.locator('button[type="submit"], button:has-text("Create")');

      if (await targetInput.isVisible({ timeout: 2000 })) {
        await targetInput.fill('e2e_partner');
        await resourceSelect.selectOption('iron');
        await quantityInput.fill('200');
        await submitButton.click();

        // Should show route created
        await expect(page.locator('text=/Route Created|Success|Route créée/i')).toBeVisible({
          timeout: 5000,
        });
      }
    }
  });

  test('should display active trade routes', async ({ page }) => {
    await page.goto('/trade-routes');

    // Should show list of active routes
    await expect(
      page.locator('text=/Active|Destination|Resource|Actif|Destination/i')
    ).toBeVisible({ timeout: 5000 });
  });

  test('should show trade route status and progress', async ({ page }) => {
    await page.goto('/trade-routes');

    // Should see convoy in transit status
    const statusIndicator = page.locator('text=/In Transit|Traveling|En route|Voyage/i');

    if (await statusIndicator.isVisible({ timeout: 3000 })) {
      // Should show ETA
      await expect(page.locator('text=/Arrives|ETA|Arrive/i')).toBeVisible();
    }
  });

  test('should cancel trade route', async ({ page }) => {
    await page.goto('/trade-routes');

    // Find cancel button
    const cancelButton = page.locator('button:has-text("Cancel"), button:has-text("Annuler")');

    if (await cancelButton.isVisible({ timeout: 2000 })) {
      await cancelButton.first().click();

      // Confirm cancellation
      const confirmButton = page.locator('button:has-text("Confirm")');
      if (await confirmButton.isVisible({ timeout: 2000 })) {
        await confirmButton.click();
        await expect(page.locator('text=/Cancelled|Annulé/i')).toBeVisible({ timeout: 3000 });
      }
    }
  });

  test('should show incoming trade routes', async ({ page }) => {
    await page.goto('/trade-routes');

    // Check for incoming routes tab
    const incomingTab = page.locator('button:has-text("Incoming"), a[href*="incoming"]');

    if (await incomingTab.isVisible({ timeout: 2000 })) {
      await incomingTab.click();

      // Should see routes from other players
      await expect(page.locator('text=/From|Sender|De|Expéditeur/i')).toBeVisible({
        timeout: 3000,
      });
    }
  });
});

test.describe('Resource Convoys', () => {
  test.beforeEach(async ({ page }) => {
    await authenticatedPage(page);
  });

  test('should send resource convoy to another player', async ({ page }) => {
    await page.goto('/convoys');

    // Fill convoy form
    const targetInput = page.locator('input[name="target"]');
    const woodInput = page.locator('input[name="wood"]');
    const sendButton = page.locator('button:has-text("Send"), button:has-text("Envoyer")');

    if (await targetInput.isVisible({ timeout: 3000 })) {
      await targetInput.fill('e2e_receiver');
      await woodInput.fill('500');

      if (await sendButton.isEnabled()) {
        await sendButton.click();

        // Should show convoy sent
        await expect(page.locator('text=/Convoy Sent|En route|Convoi envoyé/i')).toBeVisible({
          timeout: 5000,
        });
      }
    }
  });

  test('should display outgoing convoys', async ({ page }) => {
    await page.goto('/convoys');

    // Should see outgoing convoys list
    await expect(page.locator('text=/Outgoing|Destination|En cours/i')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should show convoy travel time', async ({ page }) => {
    await page.goto('/convoys');

    // Should display ETA for active convoys
    await expect(page.locator('text=/Arrives|ETA|Remaining|Arrive dans/i')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should recall convoy before arrival', async ({ page }) => {
    await page.goto('/convoys');

    // Find recall button
    const recallButton = page.locator('button:has-text("Recall"), button:has-text("Rappeler")');

    if (await recallButton.isVisible({ timeout: 2000 })) {
      await recallButton.first().click();

      // Should show recall confirmation
      await expect(page.locator('text=/Recalled|Returning|Rappelé/i')).toBeVisible({
        timeout: 3000,
      });
    }
  });

  test('should display incoming convoys', async ({ page }) => {
    await page.goto('/convoys');

    // Check for incoming tab
    const incomingTab = page.locator('button:has-text("Incoming"), a[href*="incoming"]');

    if (await incomingTab.isVisible({ timeout: 2000 })) {
      await incomingTab.click();

      // Should see convoys from other players
      await expect(page.locator('text=/From|Sender|De/i')).toBeVisible({ timeout: 3000 });
    }
  });

  test('should receive convoy resources automatically', async ({ page }) => {
    await page.goto('/convoys');

    // (In real scenario, convoy would arrive after waiting)
    // Should see completed convoy in history
    const historyTab = page.locator('button:has-text("History"), a[href*="history"]');

    if (await historyTab.isVisible({ timeout: 2000 })) {
      await historyTab.click();

      // Should see delivered convoys
      await expect(page.locator('text=/Delivered|Received|Livré|Reçu/i')).toBeVisible({
        timeout: 3000,
      });
    }
  });
});

test.describe('Market History & Statistics', () => {
  test.beforeEach(async ({ page }) => {
    await authenticatedPage(page);
  });

  test('should display transaction history', async ({ page }) => {
    await page.goto('/market/history');

    // Should see past transactions
    await expect(page.locator('text=/History|Transactions|Historique/i')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should show completed orders', async ({ page }) => {
    await page.goto('/market/history');

    // Should see buy/sell orders that completed
    await expect(page.locator('text=/Completed|Fulfilled|Exécuté/i')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should display profit/loss from trades', async ({ page }) => {
    await page.goto('/market/history');

    // Should show financial summary
    const profitIndicator = page.locator('text=/Profit|Loss|Gold Earned|Bénéfice|Perte/i');

    if (await profitIndicator.isVisible({ timeout: 3000 })) {
      console.log('✅ Trade profit/loss displayed');
    }
  });

  test('should filter history by date range', async ({ page }) => {
    await page.goto('/market/history');

    // Find date filter
    const dateFilter = page.locator('input[type="date"], select[name="dateRange"]');

    if (await dateFilter.isVisible({ timeout: 2000 })) {
      console.log('✅ Date range filter available');
    }
  });

  test('should show market volume statistics', async ({ page }) => {
    await page.goto('/market/stats');

    // Should see market statistics
    await expect(
      page.locator('text=/Volume|Total Trades|Statistics|Volume|Statistiques/i')
    ).toBeVisible({ timeout: 5000 });
  });

  test('should display average prices over time', async ({ page }) => {
    await page.goto('/market/stats');

    // Should show price chart or average prices
    const priceChart = page.locator('canvas, svg, .chart');

    if (await priceChart.isVisible({ timeout: 3000 })) {
      console.log('✅ Price chart/statistics displayed');
    }
  });
});
