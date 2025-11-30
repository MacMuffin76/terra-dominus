# Achievement Auto-Detection

## Overview
Le système d'achievements détecte automatiquement les accomplissements des joueurs et débloque les achievements correspondants en temps réel, sans action manuelle requise.

## Achievements Trackés

| Action | Objective Type | Détection |
|--------|---------------|-----------|
| **Combat Victory** | `TOTAL_BATTLES_WON` | Incrémenté à chaque victoire d'attaque |
| **Combat Defeat** | `TOTAL_BATTLES_LOST` | Incrémenté à chaque défaite |
| **Units Killed** | `TOTAL_UNITS_KILLED` | Incrémenté par le nombre d'unités ennemies tuées |
| **Building Upgrade** | `TOTAL_BUILDINGS_UPGRADED` | Incrémenté à chaque construction terminée |
| **Max Building Level** | `MAX_BUILDING_LEVEL` | Tracké avec le niveau max de bâtiment |
| **Quest Completion** | `TOTAL_QUESTS_COMPLETED` | Incrémenté quand une quête est réclamée |
| **Research Completion** | `TOTAL_RESEARCH_COMPLETED` | Incrémenté après upgrade de recherche |
| **Player Level** | `PLAYER_LEVEL` | Tracké quand le joueur monte de niveau |
| **Resource Collection** | `TOTAL_GOLD_COLLECTED`<br>`TOTAL_METAL_COLLECTED`<br>`TOTAL_FUEL_COLLECTED` | Incrémenté à la collecte de ressources |
| **Market Trades** | `TOTAL_TRADES_COMPLETED` | Incrémenté après transaction |

## Architecture

### Service Principal
**Fichier:** `backend/utils/achievementChecker.js`

Service singleton qui expose des méthodes pour vérifier les achievements après chaque action :

```javascript
// Check combat achievements
achievementChecker.checkCombatAchievements(userId, combatResult)

// Check building achievements
achievementChecker.checkBuildingAchievements(userId, building)

// Check quest achievements
achievementChecker.checkQuestAchievements(userId)

// Check research achievements
achievementChecker.checkResearchAchievements(userId)

// Check level achievements
achievementChecker.checkLevelAchievements(userId, newLevel)

// Check resource achievements
achievementChecker.checkResourceAchievements(userId, resourceType, amount)

// Check trade achievements
achievementChecker.checkTradeAchievements(userId)
```

Toutes les méthodes:
- Retournent un array des achievements débloqués
- Gèrent les erreurs gracieusement (return `[]` en cas d'erreur)
- Loggent les achievements débloqués
- Sont asynchrones et non-bloquantes

### Points d'Intégration

#### 1. Combat System
**Fichier:** `backend/modules/combat/application/CombatService.js`

```javascript
// Après transaction.commit()
const achievementChecker = require('../../../utils/achievementChecker');
achievementChecker.checkCombatAchievements(attack.attacker_user_id, combatResult)
  .catch(err => this.logger.error('Failed to check combat achievements:', err));
```

Détecte:
- Victoires (TOTAL_BATTLES_WON)
- Défaites (TOTAL_BATTLES_LOST)  
- Unités tuées (TOTAL_UNITS_KILLED)

#### 2. Building System
**Fichier:** `backend/modules/buildings/application/BuildingService.js`

```javascript
// Dans transaction.afterCommit()
const achievementChecker = require('../../../utils/achievementChecker');
achievementChecker.checkBuildingAchievements(userId, { level: upgraded.level })
  .catch(err => console.error('Failed to check building achievements:', err));
```

Détecte:
- Constructions terminées (TOTAL_BUILDINGS_UPGRADED)
- Niveau max de bâtiment (MAX_BUILDING_LEVEL)

#### 3. Quest System
**Fichier:** `backend/modules/quest/application/QuestService.js`

```javascript
// Après avoir marqué comme claimed
const achievementChecker = require('../../../utils/achievementChecker');
achievementChecker.checkQuestAchievements(userId)
  .catch(err => logger.error('Failed to check quest achievements:', err));

// Si level up
if (user.level > oldLevel) {
  achievementChecker.checkLevelAchievements(userId, user.level)
    .catch(err => logger.error('Failed to check level achievements:', err));
}
```

Détecte:
- Quêtes complétées (TOTAL_QUESTS_COMPLETED)
- Montées de niveau (PLAYER_LEVEL)

#### 4. Research System
**Fichier:** `backend/controllers/researchController.js`

```javascript
// Après research.save()
const achievementChecker = require('../utils/achievementChecker');
achievementChecker.checkResearchAchievements(req.user.id)
  .catch(err => logger.error('Failed to check research achievements:', err));
```

Détecte:
- Recherches terminées (TOTAL_RESEARCH_COMPLETED)

## Fonctionnement Interne

### 1. Détection
Quand une action est effectuée, le checker:

1. Récupère tous les achievements correspondant à l'objective_type
2. Met à jour la progression pour chaque achievement
3. Vérifie si le target est atteint
4. Débloque automatiquement si c'est le cas
5. Retourne la liste des achievements nouvellement débloqués

### 2. Types de Tracking

**Incrémental** (`incrementAchievementProgress`):
- Pour les compteurs cumulatifs (batailles gagnées, quêtes, etc.)
- Ajoute une valeur au progrès actuel

**Absolu** (`trackAchievementObjective`):
- Pour les valeurs max/état (niveau, building level max)
- Remplace la valeur de progression

### 3. Gestion des Erreurs

Toutes les vérifications utilisent `.catch()` pour ne jamais bloquer l'action principale:

```javascript
achievementChecker.checkCombatAchievements(userId, combatResult)
  .catch(err => logger.error('Failed to check achievements:', err));
```

Si la vérification échoue:
- L'action principale continue (combat, construction, etc.)
- L'erreur est loggée
- L'utilisateur peut toujours jouer

## Configuration des Achievements

Les achievements sont définis dans la base de données avec:

- **objective_type**: Type d'objectif à tracker (ex: `total_battles_won`)
- **objective_target**: Valeur cible pour débloquer (ex: `1` pour la première victoire)
- **tier**: Bronze, Silver, Gold, Platinum, Diamond
- **category**: Combat, Economy, Buildings, Research, etc.
- **is_secret**: Si true, caché jusqu'au déblocage

### Exemple d'Achievement

```javascript
{
  title: "Première Victoire",
  description: "Remporter votre première bataille",
  objective_type: "total_battles_won",
  objective_target: 1,
  tier: "bronze",
  category: "combat",
  reward_or: 500,
  reward_xp: 100,
  points: 10,
  is_secret: false
}
```

Lorsqu'un joueur gagne sa première bataille:
1. `checkCombatAchievements` est appelé
2. Le progrès `total_battles_won` passe à 1
3. L'achievement est débloqué automatiquement
4. Le joueur est notifié (via return value)

## Testing

Script de test disponible: `backend/testAchievementDetection.js`

```bash
cd backend
node testAchievementDetection.js
```

Le test vérifie:
- ✓ Combat achievements (victoires, défaites, kills)
- ✓ Building achievements (constructions, niveaux)
- ✓ Quest achievements (complétions)
- ✓ Research achievements (upgrades)
- ✓ Level achievements (montées de niveau)
- ✓ Resource achievements (collecte)

Résultat attendu:
```
✅ Achievement Auto-Detection Test Complete!

Summary:
  Total achievements tracked: 16
  Unlocked: 1
  Locked: 15

Integration points verified:
  ✓ Combat victories/defeats/kills tracked
  ✓ Building upgrades tracked
  ✓ Quest completions tracked
  ✓ Research completions tracked
  ✓ Level ups tracked
  ✓ Resource collection tracked
```

## Extension Future

Pour ajouter un nouveau type d'achievement:

1. **Ajouter l'OBJECTIVE_TYPE** dans `achievementRules.js`:
```javascript
OBJECTIVE_TYPES.NEW_TYPE = 'new_type';
```

2. **Créer une méthode dans achievementChecker.js**:
```javascript
async checkNewAchievements(userId, data) {
  // Logic here
  const unlocked = await achievementService.incrementAchievementProgress(
    userId,
    OBJECTIVE_TYPES.NEW_TYPE,
    1
  );
  return unlocked;
}
```

3. **Intégrer dans le système approprié**:
```javascript
achievementChecker.checkNewAchievements(userId, data)
  .catch(err => logger.error('Failed to check new achievements:', err));
```

4. **Créer l'achievement dans la DB** avec `objective_type: 'new_type'`

## Performance

- Chaque vérification fait ~2-3 queries DB
- Toutes les vérifications sont asynchrones
- N'impacte pas le temps de réponse des actions principales
- Cache interne du service d'achievements réduit la charge

## Logs

Les achievements débloqués sont loggés:

```json
{
  "level": 30,
  "msg": "User 123 unlocked 1 achievements from combat",
  "environment": "production"
}

{
  "level": 30,
  "msg": "Achievement unlocked for user 123: Première Victoire"
}
```

## Recommandations

1. **Notifications**: Ajouter Socket.IO pour notifier l'utilisateur en temps réel
2. **UI Feedback**: Toast/popup quand un achievement est débloqué
3. **Sound Effects**: Son de déblocage pour renforcer l'engagement
4. **Animation**: Effet visuel dans l'interface
5. **Recalculation**: Script de maintenance pour recalculer tous les achievements existants
