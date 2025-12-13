# Unit Unlock & Progression System

## Overview

Le système d'unlock d'unités gère la progression des joueurs à travers 4 tiers d'unités, débloquées selon **le niveau des bâtiments** (Centre d'Entraînement + Forge) et **les recherches complétées**. Ce système crée une courbe de progression naturelle avec différenciation entre unités d'infanterie et véhicules.

## Tier Structure

### Tier 1: Survivants (Centre d'Entraînement Niv 1)
**Description**: Unités de départ, faible coût, idéales pour early game

| Unit | Requirements | Cost | Upkeep | Role |
|------|-------------|------|--------|------|
| 👥 Milice | Centre Niv 1 | 50g, 20m | 1g/h | Chair à canon |
| 🔫 Fusiliers | Centre Niv 1 + Recherche "Entraînement Militaire I" | 100g, 50m | 2g/h | Infanterie de base |

**Strategic Value**:
- Économique (faible upkeep)
- Accessible immédiatement
- Parfait pour exploration et premiers raids
- Faible contre unités Tier 2+

### Tier 2: Forces Organisées (Centre Niv 2-3)
**Description**: Unités spécialisées avec premières motorisations

| Unit | Requirements | Cost | Upkeep | Role |
|------|-------------|------|--------|------|
| 🏃 Éclaireurs | Centre Niv 3 + Recherche "Tactiques de Guérilla I" | 150g, 60m, 30f | 3g, 1m, 1f/h | Reconnaissance rapide |
| 🚚 Transport Blindé | Centre Niv 2 + Forge Niv 1 + Recherche "Motorisation I" | 200g, 120m, 80f | 2g, 1m, 2f/h | Logistique |
| 🔧 Sapeurs | Centre Niv 3 | 180g, 150m, 50f | 3g, 2m, 1f/h | Support/réparation |

**Strategic Value**:
- Introduction des véhicules (nécessite Forge)
- Spécialisation tactique
- Coût modéré
- Mobilité accrue

### Tier 3: Forces Mécanisées (Centre Niv 4-5 + Forge)
**Description**: Unités blindées et infanterie d'élite

| Unit | Requirements | Cost | Upkeep | Role |
|------|-------------|------|--------|------|
| 🎯 Tireurs d'Élite | Centre Niv 5 + Forge Niv 1 + Recherche "Entraînement Militaire II" | 250g, 100m, 50f | 4g, 1m, 1f/h | Anti-infanterie spécialisé |
| 🛡️ Chars Légers | Centre Niv 4 + Forge Niv 3 + Recherche "Motorisation II" | 400g, 300m, 200f | 5g, 3m, 3f/h | Appui blindé mobile |

**Strategic Value**:
- Haute puissance de combat
- Nécessite bonne économie (upkeep significatif)
- Domination contre Tier 1-2
- Premiers véhicules de combat

### Tier 4: Forces d'Élite (Centre Niv 5-10 + Forge avancée)
**Description**: Unités ultra-puissantes pour domination

| Unit | Requirements | Cost | Upkeep | Role |
|------|-------------|------|--------|------|
| 💥 Anti-Blindage | Centre Niv 5 + Forge Niv 2 + Recherche "Armes Antichar" | 350g, 250m, 150f | 6g, 3m, 2f/h | Chasseur de tanks |
| 🚀 Tanks Lourds | Centre Niv 8 + Forge Niv 6 + Recherche "Blindage Lourd" | 800g, 600m, 400f | 10g, 5m, 5f/h | Super-lourd d'assaut |

**Strategic Value**:
- Domination absolue du champ de bataille
- Upkeep très élevé (économie late game obligatoire)
- Game-changing power
- Nécessite investissement massif dans bâtiments + recherches

## Progression System

### Building Requirements

```
Centre d'Entraînement Level Progression:
Niv 1  ━━ Milice, Fusiliers (Tier 1)
Niv 2  ━━ Transport Blindé (avec Forge 1)
Niv 3  ━━ Éclaireurs, Sapeurs (Tier 2)
Niv 4  ━━ Chars Légers (avec Forge 3)
Niv 5  ━━ Tireurs d'Élite, Anti-Blindage (Tier 3/4)
Niv 8  ━━ Tanks Lourds (avec Forge 6)

Forge Militaire Level Progression:
Niv 1  ━━ Débloque véhicules légers (Transport)
Niv 2  ━━ Débloque armes lourdes (Anti-Blindage)
Niv 3  ━━ Débloque blindés légers (Chars Légers)
Niv 6  ━━ Débloque super-lourds (Tanks Lourds)
```

### Research Requirements

Les recherches suivantes sont nécessaires pour débloquer certaines unités :

| Research | Unlocks | Description |
|----------|---------|-------------|
| Entraînement Militaire I | Fusiliers | Formation militaire de base |
| Tactiques de Guérilla I | Éclaireurs | Tactiques de reconnaissance rapide |
| Motorisation I | Transport Blindé | Premiers véhicules motorisés |
| Entraînement Militaire II | Tireurs d'Élite | Formation avancée de précision |
| Motorisation II | Chars Légers | Véhicules de combat blindés légers |
| Armes Antichar | Anti-Blindage | Lance-roquettes et armes antichar |
| Blindage Lourd | Tanks Lourds | Blindages ultra-résistants |

### Unlock Notifications

Quand un joueur construit/améliore son Centre d'Entraînement ou sa Forge :
1. Notification des nouvelles unités débloquées
2. Badge "New Units Available" dans l'UI training
3. Vérification automatique des prérequis (bâtiments + recherches)
4. Affichage des unités encore verrouillées avec prérequis manquants

### Building Upgrade Path (Recommended)

| Phase | Focus | Buildings to Upgrade |
|-------|-------|---------------------|
| Early Game (0-10min) | Tier 1 units | Centre d'Entraînement Niv 1 |
| Mid Game (10-30min) | Tier 2 mobility | Centre Niv 2-3 + Forge Niv 1 |
| Late Game (30min+) | Tier 3 power | Centre Niv 4-5 + Forge Niv 3 |
| End Game (1h+) | Tier 4 domination | Centre Niv 8-10 + Forge Niv 6 |

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
