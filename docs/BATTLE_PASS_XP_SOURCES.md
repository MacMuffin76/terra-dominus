# Battle Pass XP Sources

## Overview
The Battle Pass system now automatically grants XP when players perform various actions in the game. This creates a progression loop that encourages engagement across all game systems.

## XP Rewards

| Action | XP Granted | Integration Point |
|--------|-----------|-------------------|
| **Quest Completion** | 50 XP | `QuestService.claimRewards()` |
| **Combat Victory** | 100 XP | `CombatService.resolveCombatArrival()` |
| **Building Upgrade** | 25 XP | `BuildingService.collectConstruction()` |
| **Research Upgrade** | 50 XP | `researchController.upgradeResearch()` |

## Implementation Details

### Quest Completion (50 XP)
**File:** `backend/modules/quest/application/QuestService.js`

When a player claims quest rewards, they receive 50 Battle Pass XP in addition to the quest rewards (resources, items, etc.).

```javascript
// After marking rewards as claimed
const battlePassService = require('../../battlepass/application/BattlePassService');
battlePassService.addXP(userId, 50)
  .catch(err => logger.error(`Failed to grant Battle Pass XP for quest ${questId}:`, err));
```

### Combat Victory (100 XP)
**File:** `backend/modules/combat/application/CombatService.js`

When a player's attack is victorious, they receive 100 Battle Pass XP. This only applies to victories, not defeats.

```javascript
// After transaction commit, if attacker wins
if (combatResult.outcome === 'attacker_victory') {
  const battlePassService = require('../../battlepass/application/BattlePassService');
  battlePassService.addXP(attack.attacker_user_id, 100).catch(err => {
    this.logger.error('Failed to grant Battle Pass XP for combat victory:', err);
  });
}
```

### Building Upgrade (25 XP)
**File:** `backend/modules/buildings/application/BuildingService.js`

When a building construction completes and the player collects it, they receive 25 Battle Pass XP per building level gained.

```javascript
// In transaction.afterCommit callback
const battlePassService = require('../../battlepass/application/BattlePassService');
battlePassService.addXP(userId, 25).catch(err => {
  console.error('Failed to grant Battle Pass XP for building upgrade:', err);
});
```

### Research Upgrade (50 XP)
**File:** `backend/controllers/researchController.js`

When a research upgrade completes, the player receives 50 Battle Pass XP.

```javascript
// After research.save()
const battlePassService = require('../modules/battlepass/application/BattlePassService');
battlePassService.addXP(req.user.id, 50).catch(err => {
  logger.error('Failed to grant Battle Pass XP for research upgrade:', err);
});
```

## Error Handling

All XP grants use `.catch()` to handle errors gracefully without blocking the main action. If the Battle Pass XP grant fails, the player still receives their quest rewards, combat loot, building upgrade, or research completion.

This ensures that Battle Pass issues never interfere with core gameplay.

## Testing

A test script is available at `backend/testBattlePassXP.js` to verify the integration:

```bash
cd backend
node testBattlePassXP.js
```

Expected output:
- Direct XP addition: 100 XP gained
- All 4 integration points verified
- Leaderboard Battle Pass score still updates correctly

## Future Enhancements

Consider adding XP sources for:
- Market transactions (5-10 XP per trade)
- Portal completions (varies by tier: Grey=25, Green=50, Blue=100)
- Daily login bonus (10 XP)
- Alliance donations (5 XP)
- Spy missions (20 XP)
- Colonization (50 XP per new city)

## Balancing

Current XP rates are designed to allow active players to progress through ~5-10 tiers per week:

- **Daily activities:** 2-3 quests = 100-150 XP
- **Combat:** 3-5 victories = 300-500 XP
- **Building/Research:** 5-10 upgrades = 125-375 XP

**Total weekly estimate:** 3,000-5,000 XP (3-5 tiers if 1000 XP per tier)

Adjust XP values in the integration points if progression feels too fast or too slow.

## Leaderboard Integration

The Battle Pass leaderboard category updates automatically via `leaderboardIntegration.updateBattlePassScore(userId)` whenever XP is added. The score is calculated as:

```
score = (current_tier * 1000) + current_xp
```

This ensures higher-tier players rank higher, with XP as a tiebreaker.
