# Unit Unlock & Progression System

## Overview

Le système d'unlock d'unités gère la progression des joueurs à travers 4 tiers d'unités, débloquées selon le niveau du joueur. Ce système crée une courbe de progression naturelle et encourage la montée en niveau.

## Tier Structure

### Tier 1: Basic Units (Level 1+)
**Unlock Level**: 1  
**Description**: Unités de départ, faible coût, idéales pour early game

| Unit | Cost | Upkeep | Role |
|------|------|--------|------|
| Militia | 50g, 20m | 1g/h | Early defense |
| Infantry | 100g, 50m | 1g/h | Basic combat |
| Archer | 120g, 60m | 1g/h | Ranged support |

**Strategic Value**:
- Économique (faible upkeep)
- Accessible immédiatement
- Parfait pour exploration et premiers raids
- Faible contre unités Tier 2+

### Tier 2: Advanced Units (Level 5+)
**Unlock Level**: 5  
**Description**: Unités spécialisées avec counters définis

| Unit | Cost | Upkeep | Role |
|------|------|--------|------|
| Cavalry | 250g, 100m, 50f | 2g, 1m, 1f/h | Fast striker |
| Spearmen | 200g, 120m | 2g/h | Anti-cavalry |
| Artillery | 400g, 300m, 150f | 3g, 2m, 2f/h | Siege weapon |
| Engineer | 300g, 200m | 2g, 1m/h | Utility/repair |
| Spy | 500g, 200f | 3g, 1f/h | Intelligence |

**Strategic Value**:
- Systèmes de counters actifs
- Spécialisation tactique
- Coût modéré
- Dominance vs Tier 1

### Tier 3: Elite Units (Level 10+)
**Unlock Level**: 10  
**Description**: Unités puissantes pour late game

| Unit | Cost | Upkeep | Role |
|------|------|--------|------|
| Tanks | 800g, 600m, 400f | 5g, 3m, 3f/h | Heavy armor |
| Anti-Tank | 600g, 400m, 300f | 4g, 2m, 2f/h | Tank counter |
| Aircraft | 1000g, 800m, 600f | 8g, 5m, 5f/h | Air superiority |
| Anti-Air | 900g, 600m, 500f | 6g, 4m, 3f/h | Air defense |

**Strategic Value**:
- Haute puissance de combat
- Upkeep significatif
- Requires strong economy
- Counters Tier 1-2 easily

### Tier 4: Experimental Units (Level 15+)
**Unlock Level**: 15  
**Description**: Unités ultra-puissantes, très coûteuses

| Unit | Cost | Upkeep | Role |
|------|------|--------|------|
| Mech | 3000g, 2500m, 2000f | 15g, 10m, 10f/h | Super heavy |
| Stealth Bomber | 4000g, 3000m, 2500f | 20g, 12m, 15f/h | Stealth strike |

**Strategic Value**:
- Domination absolue
- Upkeep massif (nécessite économie late game)
- Game-changing power
- Limité par coût et upkeep

## Progression System

### Level Milestones

```
Level 1  ━━━━━━━━━━━━━━━━━  Tier 1 Unlocked (3 units)
   ↓
Level 5  ━━━━━━━━━━━━━━━━━  Tier 2 Unlocked (+5 units)
   ↓
Level 10 ━━━━━━━━━━━━━━━━━  Tier 3 Unlocked (+4 units)
   ↓
Level 15 ━━━━━━━━━━━━━━━━━  Tier 4 Unlocked (+2 units)
```

### Unlock Notifications

Quand un joueur atteint un niveau de tier:
1. Notification push avec liste des nouvelles unités
2. Badge "New Units Available" dans l'UI training
3. Achievement unlock ("Advanced Warfare", "Elite Commander", etc.)
4. Tutorial pointer vers training menu

### XP Requirements (Estimated)

| Level | XP Required | Cumulative XP | Activities |
|-------|-------------|---------------|------------|
| 1→5 | ~5,000 XP | 5,000 | Tutorials, first buildings, early quests |
| 5→10 | ~15,000 XP | 20,000 | Combat, resource growth, research |
| 10→15 | ~30,000 XP | 50,000 | Advanced combat, portals, alliances |

## API Reference

### GET /api/v1/units/unlock/available
Obtenir toutes les unités disponibles pour un joueur.

**Response**:
```json
{
  "success": true,
  "data": {
    "unlocked": [
      {
        "id": "militia",
        "name": "Militia",
        "tier": 1,
        "requiredLevel": 1,
        "tierName": "Basic Units",
        "isUnlocked": true,
        "attack": 2,
        "defense": 3,
        "cost": { "gold": 50, "metal": 20, "fuel": 0 },
        "upkeepPerHour": { "gold": 1, "metal": 0, "fuel": 0 }
      }
    ],
    "locked": [
      {
        "id": "cavalry",
        "name": "Cavalry",
        "tier": 2,
        "requiredLevel": 5,
        "tierName": "Advanced Units",
        "isUnlocked": false
      }
    ],
    "nextUnlock": {
      "id": "cavalry",
      "name": "Cavalry",
      "tier": 2,
      "requiredLevel": 5,
      "levelsRemaining": 2
    },
    "currentLevel": 3,
    "tierProgress": {
      "currentTier": { "name": "Basic Units", "number": 1, "unlockLevel": 1 },
      "nextTier": { "name": "Advanced Units", "number": 2, "unlockLevel": 5 },
      "progress": 50,
      "levelsToNext": 2,
      "message": "2 levels until Advanced Units"
    }
  }
}
```

### GET /api/v1/units/unlock/check/:unitId
Vérifier si une unité spécifique est débloquée.

**Example**: `GET /api/v1/units/unlock/check/tanks`

**Response**:
```json
{
  "success": true,
  "data": {
    "isUnlocked": false,
    "reason": "Requires player level 10 (current: 7)",
    "requiredLevel": 10,
    "currentLevel": 7,
    "unit": {
      "id": "tanks",
      "name": "Tanks",
      "tier": 3
    }
  }
}
```

### GET /api/v1/units/unlock/tiers
Obtenir le résumé de tous les tiers.

**Response**:
```json
{
  "success": true,
  "data": {
    "userLevel": 7,
    "tiers": [
      {
        "tier": 1,
        "name": "Basic Units",
        "unlockLevel": 1,
        "isUnlocked": true,
        "unitCount": 3,
        "units": [
          { "id": "militia", "name": "Militia", "icon": "🪖" },
          { "id": "infantry", "name": "Infantry", "icon": "🪖" },
          { "id": "archer", "name": "Archer", "icon": "🏹" }
        ],
        "levelsRemaining": 0
      },
      {
        "tier": 2,
        "name": "Advanced Units",
        "unlockLevel": 5,
        "isUnlocked": true,
        "unitCount": 5,
        "units": [...],
        "levelsRemaining": 0
      },
      {
        "tier": 3,
        "name": "Elite Units",
        "unlockLevel": 10,
        "isUnlocked": false,
        "unitCount": 4,
        "units": [...],
        "levelsRemaining": 3
      }
    ]
  }
}
```

## Frontend Integration

### Training Menu Display

```javascript
// Fetch available units
const response = await axios.get('/api/v1/units/unlock/available');
const { unlocked, locked, tierProgress } = response.data.data;

// Display unlocked units (trainable)
unlocked.forEach(unit => {
  renderTrainButton(unit);
});

// Display locked units (grayed out with level requirement)
locked.forEach(unit => {
  renderLockedUnit(unit, `Unlock at Level ${unit.requiredLevel}`);
});

// Display progression bar
renderProgressBar(tierProgress);
```

### Tier Progress UI

```jsx
<div className="tier-progress">
  <h3>Unit Progression</h3>
  <div className="current-tier">
    Current: {tierProgress.currentTier.name}
  </div>
  {tierProgress.nextTier && (
    <>
      <div className="progress-bar">
        <div className="fill" style={{ width: `${tierProgress.progress}%` }} />
      </div>
      <div className="next-tier">
        Next: {tierProgress.nextTier.name} (Level {tierProgress.nextTier.unlockLevel})
        <br />
        {tierProgress.levelsToNext} levels remaining
      </div>
    </>
  )}
</div>
```

### Level Up Hook

```javascript
// When player levels up
const handleLevelUp = async (oldLevel, newLevel) => {
  // Check for new unlocks
  const response = await axios.get('/api/v1/units/unlock/available');
  const { nextUnlock } = response.data.data;
  
  // Check if crossed tier threshold
  const unlockedTier = TIER_LEVELS.find(t => 
    oldLevel < t.level && newLevel >= t.level
  );
  
  if (unlockedTier) {
    // Show notification
    showNotification({
      title: `${unlockedTier.name} Unlocked!`,
      message: `You can now train ${unlockedTier.unitCount} new units`,
      type: 'success',
      action: 'Go to Training'
    });
    
    // Add badge to training menu
    addBadge('training-menu', unlockedTier.unitCount);
  }
};
```

## Service Logic

### UnitUnlockService Methods

```javascript
// Check if unit is available
const canTrain = await unitUnlockService.checkUnitUnlock(userId, 'cavalry');
if (!canTrain.isUnlocked) {
  throw new Error(canTrain.reason); // "Requires player level 5 (current: 3)"
}

// Get newly unlocked units after level up
const newUnits = await unitUnlockService.getNewlyUnlockedUnits(userId, 4, 5);
// Returns: [{ tier: 2, tierName: 'Advanced Units', units: [...] }]

// Get tier progression
const progress = unitUnlockService._calculateTierProgress(7);
// Returns: { currentTier: 2, nextTier: 3, progress: 60, levelsToNext: 3 }
```

## Balance Considerations

### Unlock Pacing
- **Tier 1→2 (Levels 1-5)**: ~2-3 hours gameplay
- **Tier 2→3 (Levels 5-10)**: ~10-15 hours gameplay
- **Tier 3→4 (Levels 10-15)**: ~30-40 hours gameplay

### Economic Gates
- Tier 1: Affordable immediately
- Tier 2: Requires upgraded resource buildings
- Tier 3: Requires strong economy (multiple cities)
- Tier 4: Requires late-game wealth (high production, multiple resource sources)

### Power Scaling
- Tier gap = ~2-3x power difference
- Counter system = 1.5x multiplier
- Max effective gap: Tier 4 vs Tier 1 = ~10x base power

### Strategic Depth
- Early game: Tier 1 spamming
- Mid game: Tier 2 counter compositions
- Late game: Tier 3 quality armies
- End game: Tier 4 elite strike forces

## Testing

```bash
# Test unlock system
node backend/scripts/testUnitUnlocks.js

# Manual API test
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/v1/units/unlock/available

# Check specific unit
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/v1/units/unlock/check/tanks
```

## Future Enhancements

1. **Research Unlocks**: Require specific research to unlock Tier 3-4
2. **Building Requirements**: Barracks level gates unit tiers
3. **Achievement Unlocks**: Special units (hero units) via achievements
4. **Alliance Unlocks**: Alliance-wide research for special units
5. **Seasonal Units**: Limited-time units for events

## Summary

Le système d'unlock crée une progression naturelle:
- **Tier 1 (Lv 1)**: Apprentissage, économie de base
- **Tier 2 (Lv 5)**: Tactiques, système de counters
- **Tier 3 (Lv 10)**: Puissance, économie avancée
- **Tier 4 (Lv 15)**: Domination, économie mature

Chaque tier double le coût et l'upkeep, forçant les joueurs à développer leur économie en parallèle de leur puissance militaire.
