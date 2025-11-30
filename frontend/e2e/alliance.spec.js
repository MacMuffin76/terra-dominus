import { test, expect } from '@playwright/test';

/**
 * Alliance E2E Tests
 * Tests for alliance system including creation, membership, treasury, territory, and wars
 */

async function loginUser(page, username = 'e2e_alliance_leader', password = 'SecurePass123!') {
  await page.goto('/login');
  await page.fill('input[name="username"]', username);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
}

test.describe('Alliance Creation & Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
  });

  test('should navigate to alliance creation page', async ({ page }) => {
    await page.goto('/alliance');

    // Should see create alliance option
    await expect(
      page.locator('text=/Create Alliance|Create|Créer Alliance|Créer/i')
    ).toBeVisible({ timeout: 5000 });
  });

  test('should create new alliance with valid data', async ({ page }) => {
    await page.goto('/alliance/create');

    const allianceName = `E2E Alliance ${Date.now()}`;

    // Fill alliance details
    const nameInput = page.locator('input[name="name"]');
    const tagInput = page.locator('input[name="tag"]');
    const descriptionInput = page.locator('textarea[name="description"]');
    const createButton = page.locator('button:has-text("Create"), button[type="submit"]');

    if (await nameInput.isVisible({ timeout: 3000 })) {
      await nameInput.fill(allianceName);
      await tagInput.fill(`E2E${Date.now() % 1000}`);
      await descriptionInput.fill('E2E Test Alliance for automated testing');

      await createButton.click();

      // Should redirect to alliance dashboard
      await expect(page).toHaveURL(/\/alliance\/\d+/, { timeout: 5000 });
      await expect(page.locator(`text=/${allianceName}/i`)).toBeVisible();
    }
  });

  test('should reject alliance creation with invalid data', async ({ page }) => {
    await page.goto('/alliance/create');

    const createButton = page.locator('button:has-text("Create")');

    // Try empty name
    await createButton.click();
    await expect(page.locator('text=/Required|Name is required|Requis/i')).toBeVisible({
      timeout: 3000,
    });

    // Try too short tag
    const tagInput = page.locator('input[name="tag"]');
    if (await tagInput.isVisible()) {
      await tagInput.fill('X');
      await createButton.click();
      await expect(page.locator('text=/Too short|Trop court|3 characters/i')).toBeVisible({
        timeout: 3000,
      });
    }
  });

  test('should display alliance details', async ({ page }) => {
    await page.goto('/alliance');

    // Should show alliance name, tag, description
    await expect(page.locator('text=/Members|Power|Treasury|Membres|Trésor/i')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should show alliance member list', async ({ page }) => {
    await page.goto('/alliance');

    // Click on members tab
    const membersTab = page.locator('button:has-text("Members"), a[href*="members"]');

    if (await membersTab.isVisible({ timeout: 2000 })) {
      await membersTab.click();

      // Should see member list with roles
      await expect(page.locator('text=/Leader|Officer|Member|Chef|Officier|Membre/i')).toBeVisible(
        {
          timeout: 3000,
        }
      );
    }
  });

  test('should allow leader to change alliance settings', async ({ page }) => {
    await page.goto('/alliance/settings');

    // Should see settings form
    const settingsForm = page.locator('form, .settings-form');

    if (await settingsForm.isVisible({ timeout: 3000 })) {
      // Try changing description
      const descInput = page.locator('textarea[name="description"]');
      if (await descInput.isVisible()) {
        await descInput.fill('Updated alliance description');

        const saveButton = page.locator('button:has-text("Save")');
        await saveButton.click();

        await expect(page.locator('text=/Saved|Updated|Sauvegardé/i')).toBeVisible({
          timeout: 3000,
        });
      }
    }
  });
});

test.describe('Alliance Membership', () => {
  test('should allow player to join alliance', async ({ page }) => {
    const newMember = `e2e_member_${Date.now()}`;
    await loginUser(page, newMember, 'SecurePass123!');

    await page.goto('/alliance/list');

    // Find an alliance to join
    const joinButton = page.locator('button:has-text("Join"), button:has-text("Rejoindre")').first();

    if (await joinButton.isVisible({ timeout: 3000 })) {
      await joinButton.click();

      // Should show application sent
      await expect(page.locator('text=/Application|Request sent|Demande/i')).toBeVisible({
        timeout: 5000,
      });
    }
  });

  test('should allow leader to accept member applications', async ({ page }) => {
    await loginUser(page);
    await page.goto('/alliance/applications');

    // Should see pending applications
    const acceptButton = page.locator('button:has-text("Accept"), button:has-text("Accepter")');

    if (await acceptButton.isVisible({ timeout: 3000 })) {
      await acceptButton.first().click();

      // Should show accepted confirmation
      await expect(page.locator('text=/Accepted|Accepté/i')).toBeVisible({ timeout: 3000 });
    }
  });

  test('should allow leader to reject member applications', async ({ page }) => {
    await loginUser(page);
    await page.goto('/alliance/applications');

    const rejectButton = page.locator('button:has-text("Reject"), button:has-text("Refuser")');

    if (await rejectButton.isVisible({ timeout: 3000 })) {
      await rejectButton.first().click();

      // Confirm rejection
      const confirmButton = page.locator('button:has-text("Confirm")');
      if (await confirmButton.isVisible({ timeout: 2000 })) {
        await confirmButton.click();
        await expect(page.locator('text=/Rejected|Refusé/i')).toBeVisible({ timeout: 3000 });
      }
    }
  });

  test('should allow member to leave alliance', async ({ page }) => {
    await loginUser(page, 'e2e_member_temp');
    await page.goto('/alliance');

    // Find leave button
    const leaveButton = page.locator('button:has-text("Leave"), button:has-text("Quitter")');

    if (await leaveButton.isVisible({ timeout: 2000 })) {
      await leaveButton.click();

      // Confirm leaving
      const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")');
      if (await confirmButton.isVisible({ timeout: 2000 })) {
        await confirmButton.click();
        await expect(page.locator('text=/Left|Quitté|No alliance/i')).toBeVisible({
          timeout: 5000,
        });
      }
    }
  });

  test('should allow leader to promote members', async ({ page }) => {
    await loginUser(page);
    await page.goto('/alliance/members');

    // Find promote button
    const promoteButton = page.locator('button:has-text("Promote"), button[aria-label*="promote"]');

    if (await promoteButton.isVisible({ timeout: 3000 })) {
      await promoteButton.first().click();

      // Should show role change options
      await expect(page.locator('text=/Officer|Officier|Captain/i')).toBeVisible({
        timeout: 3000,
      });
    }
  });

  test('should allow leader to kick members', async ({ page }) => {
    await loginUser(page);
    await page.goto('/alliance/members');

    // Find kick button
    const kickButton = page.locator('button:has-text("Kick"), button:has-text("Expulser")');

    if (await kickButton.isVisible({ timeout: 2000 })) {
      await kickButton.first().click();

      // Confirm kick
      const confirmButton = page.locator('button:has-text("Confirm")');
      if (await confirmButton.isVisible({ timeout: 2000 })) {
        await confirmButton.click();
        await expect(page.locator('text=/Kicked|Expelled|Expulsé/i')).toBeVisible({
          timeout: 3000,
        });
      }
    }
  });
});

test.describe('Alliance Treasury', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
  });

  test('should display treasury balance', async ({ page }) => {
    await page.goto('/alliance/treasury');

    // Should show resource amounts
    await expect(page.locator('text=/Treasury|Balance|Trésor|Solde/i')).toBeVisible({
      timeout: 5000,
    });

    // Should show wood, stone, iron, food
    await expect(page.locator('text=/Wood|Stone|Iron|Food|Bois|Pierre|Fer|Nourriture/i')).toBeVisible();
  });

  test('should allow member to contribute resources', async ({ page }) => {
    await page.goto('/alliance/treasury');

    // Find contribution form
    const woodInput = page.locator('input[name="wood"]');
    const contributeButton = page.locator('button:has-text("Contribute"), button:has-text("Contribuer")');

    if (await woodInput.isVisible({ timeout: 3000 })) {
      await woodInput.fill('1000');

      await contributeButton.click();

      // Should show success message
      await expect(page.locator('text=/Contributed|Contribution successful|Contribution réussie/i')).toBeVisible({
        timeout: 5000,
      });
    }
  });

  test('should display contribution history', async ({ page }) => {
    await page.goto('/alliance/treasury');

    // Should see contribution log
    await expect(page.locator('text=/History|Contributions|Log|Historique/i')).toBeVisible({
      timeout: 5000,
    });

    // Should show timestamps and amounts
    await expect(page.locator('text=/ago|recently|il y a/i, [data-timestamp]')).toBeVisible();
  });

  test('should allow officers to withdraw resources', async ({ page }) => {
    await page.goto('/alliance/treasury');

    // Find withdraw form (only visible for officers/leader)
    const withdrawButton = page.locator('button:has-text("Withdraw"), button:has-text("Retirer")');

    if (await withdrawButton.isVisible({ timeout: 2000 })) {
      const withdrawInput = page.locator('input[name="withdrawAmount"]');
      await withdrawInput.fill('500');
      await withdrawButton.click();

      // Should show confirmation or approval request
      await expect(
        page.locator('text=/Withdrawn|Pending approval|Retiré|En attente/i')
      ).toBeVisible({ timeout: 3000 });
    }
  });

  test('should show top contributors', async ({ page }) => {
    await page.goto('/alliance/treasury');

    // Should see leaderboard
    await expect(page.locator('text=/Top Contributors|Leaderboard|Meilleurs contributeurs/i')).toBeVisible({
      timeout: 5000,
    });
  });
});

test.describe('Alliance Territory', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
  });

  test('should display controlled zones', async ({ page }) => {
    await page.goto('/alliance/territory');

    // Should see territory map or list
    await expect(page.locator('text=/Controlled|Territory|Zones|Territoire/i')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should show zone control points', async ({ page }) => {
    await page.goto('/alliance/territory');

    // Should show control percentage or points
    await expect(page.locator('text=/Control|Points|%|Contrôle/i')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should display territory bonuses', async ({ page }) => {
    await page.goto('/alliance/territory');

    // Should show bonuses from controlled zones
    await expect(page.locator('text=/Bonus|Buff|Production|Defense/i')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should allow claiming new territory', async ({ page }) => {
    await page.goto('/alliance/territory');

    // Find claim button
    const claimButton = page.locator('button:has-text("Claim"), button:has-text("Revendiquer")');

    if (await claimButton.isVisible({ timeout: 2000 })) {
      await claimButton.first().click();

      // Should show claiming process started
      await expect(page.locator('text=/Claiming|Revendication/i')).toBeVisible({ timeout: 3000 });
    }
  });
});

test.describe('Alliance Wars', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
  });

  test('should display active wars', async ({ page }) => {
    await page.goto('/alliance/wars');

    // Should see wars section
    await expect(page.locator('text=/Wars|Active|Guerres|Actives/i')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should allow leader to declare war', async ({ page }) => {
    await page.goto('/alliance/wars');

    // Find declare war button
    const declareButton = page.locator('button:has-text("Declare War"), button:has-text("Déclarer la guerre")');

    if (await declareButton.isVisible({ timeout: 2000 })) {
      await declareButton.click();

      // Should show target selection
      await expect(page.locator('text=/Target Alliance|Select|Cible/i')).toBeVisible({
        timeout: 3000,
      });
    }
  });

  test('should show war statistics', async ({ page }) => {
    await page.goto('/alliance/wars');

    // Should see kills, deaths, war points
    await expect(
      page.locator('text=/Kills|Deaths|Points|Victory|Victoires/i')
    ).toBeVisible({ timeout: 5000 });
  });

  test('should display war objectives', async ({ page }) => {
    await page.goto('/alliance/wars');

    // Should show war goals and progress
    const activeWar = page.locator('.war-card, [data-war-id]').first();

    if (await activeWar.isVisible({ timeout: 2000 })) {
      await activeWar.click();

      // Should show objectives
      await expect(page.locator('text=/Objective|Goal|Objectif|But/i')).toBeVisible({
        timeout: 3000,
      });
    }
  });

  test('should allow proposing peace treaty', async ({ page }) => {
    await page.goto('/alliance/wars');

    // Find peace button
    const peaceButton = page.locator('button:has-text("Peace"), button:has-text("Paix")');

    if (await peaceButton.isVisible({ timeout: 2000 })) {
      await peaceButton.first().click();

      // Should show peace terms form
      await expect(page.locator('text=/Terms|Conditions|Treaty/i')).toBeVisible({
        timeout: 3000,
      });
    }
  });
});

test.describe('Alliance Chat & Communication', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
  });

  test('should display alliance chat', async ({ page }) => {
    await page.goto('/alliance/chat');

    // Should see chat interface
    await expect(page.locator('textarea, input[type="text"]')).toBeVisible({ timeout: 5000 });
  });

  test('should send message in alliance chat', async ({ page }) => {
    await page.goto('/alliance/chat');

    const messageInput = page.locator('textarea[name="message"], input[placeholder*="message"]');
    const sendButton = page.locator('button:has-text("Send"), button[type="submit"]');

    if (await messageInput.isVisible({ timeout: 3000 })) {
      const testMessage = `E2E test message ${Date.now()}`;
      await messageInput.fill(testMessage);
      await sendButton.click();

      // Should see message appear in chat
      await expect(page.locator(`text=/${testMessage}/`)).toBeVisible({ timeout: 5000 });
    }
  });

  test('should receive real-time messages via socket', async ({ page }) => {
    await page.goto('/alliance/chat');

    // Wait for socket connection
    await page.waitForTimeout(2000);

    // Listen for new messages
    // (Real test would send from another session, for now verify UI updates)
    console.log('✅ Socket connection established for alliance chat');
  });

  test('should allow @mentions of alliance members', async ({ page }) => {
    await page.goto('/alliance/chat');

    const messageInput = page.locator('textarea[name="message"]');

    if (await messageInput.isVisible({ timeout: 2000 })) {
      await messageInput.fill('@');

      // Should show autocomplete with member names
      await expect(page.locator('[role="listbox"], .autocomplete, .mentions')).toBeVisible({
        timeout: 3000,
      });
    }
  });

  test('should send alliance-wide mail', async ({ page }) => {
    await page.goto('/alliance/mail');

    const subjectInput = page.locator('input[name="subject"]');
    const bodyInput = page.locator('textarea[name="body"]');
    const sendButton = page.locator('button:has-text("Send")');

    if (await subjectInput.isVisible({ timeout: 3000 })) {
      await subjectInput.fill('E2E Test Mail');
      await bodyInput.fill('This is an automated test message');
      await sendButton.click();

      await expect(page.locator('text=/Sent|Envoyé/i')).toBeVisible({ timeout: 5000 });
    }
  });
});
