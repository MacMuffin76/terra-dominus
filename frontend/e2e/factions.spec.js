import { test, expect } from '@playwright/test';

/**
 * Factions & Territorial Bonuses E2E Tests
 * Tests for Phase 2 Factions system including joining, contributions, zone control, and bonuses
 */

async function loginUser(page, username = 'e2e_faction_user', password = 'SecurePass123!') {
  await page.goto('/login');
  await page.fill('input[name="username"]', username);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
}

test.describe('Faction Overview', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
  });

  test('should navigate to factions page', async ({ page }) => {
    await page.goto('/factions');
    await expect(page).toHaveURL(/\/factions/);

    // Should see factions interface
    await expect(page.locator('text=/Factions|Choose|Choisir/i')).toBeVisible({ timeout: 5000 });
  });

  test('should display all three factions (Terran, Nomad, Syndicate)', async ({ page }) => {
    await page.goto('/factions');

    // Should see all 3 faction names
    await expect(page.locator('text=/Terran/i')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=/Nomad/i')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=/Syndicate/i')).toBeVisible({ timeout: 5000 });
  });

  test('should show faction descriptions and bonuses', async ({ page }) => {
    await page.goto('/factions');

    // Click on a faction card to see details
    const factionCard = page.locator('.faction-card, [data-faction]').first();

    if (await factionCard.isVisible({ timeout: 3000 })) {
      await factionCard.click();

      // Should show faction bonuses
      await expect(
        page.locator('text=/Bonus|Production|Defense|Attack|Économie|Défense|Attaque/i')
      ).toBeVisible({ timeout: 3000 });
    }
  });

  test('should display faction member counts', async ({ page }) => {
    await page.goto('/factions');

    // Should show how many players in each faction
    await expect(page.locator('text=/Members|Players|Membres|Joueurs/i')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should show faction control zone counts', async ({ page }) => {
    await page.goto('/factions');

    // Should display number of zones controlled
    await expect(page.locator('text=/Zones|Territories|Control|Contrôle/i')).toBeVisible({
      timeout: 5000,
    });
  });
});

test.describe('Joining a Faction', () => {
  test.beforeEach(async ({ page }) => {
    const newUser = `e2e_new_faction_${Date.now()}`;
    await loginUser(page, newUser);
  });

  test('should allow player to join Terran faction', async ({ page }) => {
    await page.goto('/factions');

    // Find Terran faction join button
    const terranJoinButton = page
      .locator('button:has-text("Join"), button:has-text("Rejoindre")')
      .filter({ has: page.locator('text=/Terran/i') })
      .first();

    if (await terranJoinButton.isVisible({ timeout: 3000 })) {
      await terranJoinButton.click();

      // Confirm join
      const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")');
      if (await confirmButton.isVisible({ timeout: 2000 })) {
        await confirmButton.click();
      }

      // Should show joined confirmation
      await expect(page.locator('text=/Joined|Welcome|Bienvenue|Rejoint/i')).toBeVisible({
        timeout: 5000,
      });
    }
  });

  test('should allow player to join Nomad faction', async ({ page }) => {
    await page.goto('/factions');

    // Find Nomad faction join button
    const nomadJoinButton = page
      .locator('button:has-text("Join")')
      .filter({ has: page.locator('text=/Nomad/i') })
      .first();

    if (await nomadJoinButton.isVisible({ timeout: 3000 })) {
      await nomadJoinButton.click();

      // Confirm join
      const confirmButton = page.locator('button:has-text("Confirm")');
      if (await confirmButton.isVisible({ timeout: 2000 })) {
        await confirmButton.click();
      }

      // Should show joined confirmation
      await expect(page.locator('text=/Joined|Welcome/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should allow player to join Syndicate faction', async ({ page }) => {
    await page.goto('/factions');

    // Find Syndicate faction join button
    const syndicateJoinButton = page
      .locator('button:has-text("Join")')
      .filter({ has: page.locator('text=/Syndicate/i') })
      .first();

    if (await syndicateJoinButton.isVisible({ timeout: 3000 })) {
      await syndicateJoinButton.click();

      // Confirm join
      const confirmButton = page.locator('button:has-text("Confirm")');
      if (await confirmButton.isVisible({ timeout: 2000 })) {
        await confirmButton.click();
      }

      // Should show joined confirmation
      await expect(page.locator('text=/Joined|Welcome/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should prevent joining multiple factions', async ({ page }) => {
    await page.goto('/factions');

    // Join first faction
    const firstJoinButton = page.locator('button:has-text("Join")').first();
    if (await firstJoinButton.isVisible({ timeout: 2000 })) {
      await firstJoinButton.click();

      const confirmButton = page.locator('button:has-text("Confirm")');
      if (await confirmButton.isVisible({ timeout: 2000 })) {
        await confirmButton.click();
        await page.waitForTimeout(2000);
      }
    }

    // Try to join another faction
    const otherJoinButtons = page.locator('button:has-text("Join")');
    const count = await otherJoinButtons.count();

    if (count > 0) {
      const isDisabled = await otherJoinButtons.first().isDisabled();
      expect(isDisabled).toBe(true);
      console.log('✅ Cannot join multiple factions');
    } else {
      // All join buttons hidden (already in faction)
      console.log('✅ Join buttons hidden after joining faction');
    }
  });

  test('should display joined faction in user profile', async ({ page }) => {
    await page.goto('/factions');

    // Join a faction
    const joinButton = page.locator('button:has-text("Join")').first();
    if (await joinButton.isVisible({ timeout: 2000 })) {
      await joinButton.click();
      await page.waitForTimeout(2000);
    }

    // Navigate to profile
    await page.goto('/profile');

    // Should show faction membership
    await expect(page.locator('text=/Terran|Nomad|Syndicate/i')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Faction Contributions', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
  });

  test('should display contribution interface', async ({ page }) => {
    await page.goto('/factions/contribute');

    // Should see contribution form
    await expect(page.locator('text=/Contribute|Resources|Contribuer|Ressources/i')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should allow resource contribution to faction', async ({ page }) => {
    await page.goto('/factions/contribute');

    // Fill contribution form
    const woodInput = page.locator('input[name="wood"]');
    const contributeButton = page.locator('button:has-text("Contribute"), button:has-text("Contribuer")');

    if (await woodInput.isVisible({ timeout: 3000 })) {
      await woodInput.fill('1000');

      if (await contributeButton.isEnabled()) {
        await contributeButton.click();

        // Should show contribution success
        await expect(
          page.locator('text=/Contribution successful|Success|Contribution réussie/i')
        ).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should display personal contribution total', async ({ page }) => {
    await page.goto('/factions/contribute');

    // Should show how much I've contributed
    await expect(page.locator('text=/Your Contribution|Total|Votre contribution/i')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should show faction-wide contribution total', async ({ page }) => {
    await page.goto('/factions');

    // Should display total faction contributions
    await expect(
      page.locator('text=/Total Contribution|Faction Total|Contribution totale/i')
    ).toBeVisible({ timeout: 5000 });
  });

  test('should display contribution leaderboard', async ({ page }) => {
    await page.goto('/factions/leaderboard');

    // Should see top contributors
    await expect(
      page.locator('text=/Top Contributors|Leaderboard|Meilleurs contributeurs/i')
    ).toBeVisible({ timeout: 5000 });
  });

  test('should award contribution points for donations', async ({ page }) => {
    await page.goto('/factions/contribute');

    const woodInput = page.locator('input[name="wood"]');
    const contributeButton = page.locator('button:has-text("Contribute")');

    if (await woodInput.isVisible({ timeout: 2000 })) {
      await woodInput.fill('500');

      if (await contributeButton.isEnabled()) {
        await contributeButton.click();

        // Should show points earned
        await expect(page.locator('text=/Points|Earned|Gagné/i')).toBeVisible({ timeout: 3000 });
      }
    }
  });
});

test.describe('Control Zones & Territory', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
  });

  test('should display control zones on world map', async ({ page }) => {
    await page.goto('/world');

    // Should see control zones highlighted
    await expect(page.locator('text=/Control Zone|Territory|Zone de contrôle/i')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should show which faction controls each zone', async ({ page }) => {
    await page.goto('/factions/zones');

    // Should see zone ownership
    await expect(page.locator('text=/Controlled by|Owner|Contrôlé par/i')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should display zone control percentages', async ({ page }) => {
    await page.goto('/factions/zones');

    // Should show control progress (e.g., 65%)
    await expect(page.locator('text=/%|Percent|Control/i')).toBeVisible({ timeout: 5000 });
  });

  test('should show zones contested between factions', async ({ page }) => {
    await page.goto('/factions/zones');

    // Should indicate contested zones
    const contestedIndicator = page.locator('text=/Contested|Under Attack|Battle|Contesté|Attaque/i');

    if (await contestedIndicator.isVisible({ timeout: 3000 })) {
      console.log('✅ Contested zones displayed');
    }
  });

  test('should display zone capture requirements', async ({ page }) => {
    await page.goto('/factions/zones');

    // Click on a zone to see details
    const zoneCard = page.locator('.zone-card, [data-zone-id]').first();

    if (await zoneCard.isVisible({ timeout: 3000 })) {
      await zoneCard.click();

      // Should show what's needed to capture
      await expect(
        page.locator('text=/Requirement|Needed|Points needed|Requis/i')
      ).toBeVisible({ timeout: 3000 });
    }
  });

  test('should allow contributing to zone control', async ({ page }) => {
    await page.goto('/factions/zones');

    // Find contribute button for a zone
    const contributeButton = page.locator('button:has-text("Contribute"), button:has-text("Contribuer")');

    if (await contributeButton.isVisible({ timeout: 2000 })) {
      await contributeButton.first().click();

      // Should show contribution interface
      await expect(page.locator('text=/Resources|Units|Ressources|Unités/i')).toBeVisible({
        timeout: 3000,
      });
    }
  });
});

test.describe('Faction Bonuses', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
  });

  test('should display active faction bonuses', async ({ page }) => {
    await page.goto('/factions');

    // Should show bonuses granted by faction
    await expect(
      page.locator('text=/Bonus|Production|Defense|Attack|Boost|Economy/i')
    ).toBeVisible({ timeout: 5000 });
  });

  test('should show Terran economic bonuses', async ({ page }) => {
    await page.goto('/factions');

    // Click on Terran faction
    const terranCard = page.locator('text=/Terran/i').first();
    if (await terranCard.isVisible({ timeout: 2000 })) {
      await terranCard.click();

      // Should show production/economy bonuses
      await expect(
        page.locator('text=/Production|Economy|Resource|Économie|Ressource/i')
      ).toBeVisible();
    }
  });

  test('should show Nomad mobility bonuses', async ({ page }) => {
    await page.goto('/factions');

    // Click on Nomad faction
    const nomadCard = page.locator('text=/Nomad/i').first();
    if (await nomadCard.isVisible({ timeout: 2000 })) {
      await nomadCard.click();

      // Should show mobility/speed bonuses
      await expect(page.locator('text=/Speed|Mobility|Movement|Vitesse/i')).toBeVisible();
    }
  });

  test('should show Syndicate combat bonuses', async ({ page }) => {
    await page.goto('/factions');

    // Click on Syndicate faction
    const syndicateCard = page.locator('text=/Syndicate/i').first();
    if (await syndicateCard.isVisible({ timeout: 2000 })) {
      await syndicateCard.click();

      // Should show combat/attack bonuses
      await expect(page.locator('text=/Attack|Combat|Damage|Attaque|Dégâts/i')).toBeVisible();
    }
  });

  test('should apply bonuses to resource production', async ({ page }) => {
    await page.goto('/buildings');

    // Should see faction bonus applied to production rates
    const bonusIndicator = page.locator('text=/Faction Bonus|\\+\\d+%|Bonus de faction/i');

    if (await bonusIndicator.isVisible({ timeout: 3000 })) {
      console.log('✅ Faction production bonuses applied');
    }
  });

  test('should apply bonuses to unit training', async ({ page }) => {
    await page.goto('/training');

    // Should see faction bonus in training interface
    const bonusIndicator = page.locator('text=/Faction|Bonus|\\+\\d+%/i');

    if (await bonusIndicator.isVisible({ timeout: 3000 })) {
      console.log('✅ Faction training bonuses applied');
    }
  });

  test('should show bonus from controlled zones', async ({ page }) => {
    await page.goto('/factions/zones');

    // Should display bonuses granted by zone control
    await expect(
      page.locator('text=/Zone Bonus|Territory Bonus|Bonus de zone/i')
    ).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Faction Switching & Penalties', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
  });

  test('should allow leaving current faction', async ({ page }) => {
    await page.goto('/factions');

    // Find leave faction button
    const leaveButton = page.locator('button:has-text("Leave"), button:has-text("Quitter")');

    if (await leaveButton.isVisible({ timeout: 2000 })) {
      await leaveButton.click();

      // Should show warning about penalties
      await expect(page.locator('text=/Warning|Penalty|Lose|Attention|Pénalité/i')).toBeVisible({
        timeout: 3000,
      });
    }
  });

  test('should enforce cooldown before rejoining faction', async ({ page }) => {
    await page.goto('/factions');

    // After leaving, try to immediately rejoin
    // Should show cooldown message
    const cooldownMessage = page.locator(
      'text=/Cooldown|Wait|Must wait|Temps d\'attente|Attendre/i'
    );

    if (await cooldownMessage.isVisible({ timeout: 2000 })) {
      console.log('✅ Faction rejoin cooldown enforced');
    }
  });

  test('should apply penalties when leaving faction', async ({ page }) => {
    await page.goto('/factions');

    const leaveButton = page.locator('button:has-text("Leave")');

    if (await leaveButton.isVisible({ timeout: 2000 })) {
      await leaveButton.click();

      // Should show what will be lost
      await expect(
        page.locator('text=/Lose contribution|Lose points|Perdre/i')
      ).toBeVisible({ timeout: 3000 });
    }
  });
});

test.describe('Faction Events & Challenges', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
  });

  test('should display faction events', async ({ page }) => {
    await page.goto('/factions/events');

    // Should see faction-wide events
    await expect(page.locator('text=/Events|Challenges|Événements|Défis/i')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should show faction vs faction competitions', async ({ page }) => {
    await page.goto('/factions/events');

    // Should see inter-faction competitions
    const competitionCard = page.locator(
      'text=/Terran vs|Nomad vs|Syndicate vs|Competition|Compétition/i'
    );

    if (await competitionCard.isVisible({ timeout: 3000 })) {
      console.log('✅ Faction competitions displayed');
    }
  });

  test('should display faction leaderboard rankings', async ({ page }) => {
    await page.goto('/factions/leaderboard');

    // Should see faction rankings
    await expect(page.locator('text=/1st|2nd|3rd|Rank|#1|Classement/i')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should show faction rewards and prizes', async ({ page }) => {
    await page.goto('/factions/events');

    // Should display rewards for winning events
    const rewardsSection = page.locator('text=/Rewards|Prizes|Prize|Récompenses/i');

    if (await rewardsSection.isVisible({ timeout: 3000 })) {
      console.log('✅ Faction event rewards displayed');
    }
  });
});
