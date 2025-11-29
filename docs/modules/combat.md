# Module Combat - Terra Dominus

## Vue d'ensemble

Le module Combat gère toutes les interactions militaires entre joueurs :
- Attaques territoriales (raid, conquête, siège)
- Espionnage
- Défenses automatiques
- Rapports de bataille

## Architecture

```
modules/combat/
├── domain/
│   ├── combatRules.js          # Règles de combat (calculs, pertes)
│   ├── BattleReport.js         # Modèle rapport de bataille
│   ├── Fleet.js                # Flotte d'unités
│   └── simulation.js           # Simulation de combat
├── application/
│   ├── CombatService.js        # Logique métier combat
│   └── CombatSimulationService.js  # Simulation batailles
├── infra/
│   ├── CombatRepository.js     # Accès DB attaques
│   └── BattleReportRepository.js   # Accès DB rapports
└── api/
    ├── combatController.js     # Endpoints HTTP
    └── defenseRoutes.js        # Routes défenses
```

## Fonctionnalités

### 1. Lancer une attaque

**Endpoint** : `POST /api/v1/combat/attack`

**Payload** :
```json
{
  "attackerCityId": 1,
  "defenderCityId": 2,
  "attackType": "raid",
  "units": [
    { "entityId": 1, "quantity": 100 },
    { "entityId": 2, "quantity": 50 }
  ]
}
```

**Flux** :
1. Vérification ownership ville attaquante
2. Vérification existence ville cible
3. Vérification disponibilité unités
4. Calcul distance (Manhattan)
5. Calcul temps de voyage (30min/tile)
6. Déduction unités de la ville
7. Création attaque en DB (status: `traveling`)
8. Planification job BullMQ pour arrivée

**Types d'attaque** :
- `raid` : Pillage de ressources
- `conquest` : Conquête territoriale
- `siege` : Siège prolongé

### 2. Processus d'attaque (Worker)

**Queue** : `attackQueue`

**Job** : `process-attack`

**Étapes** :
1. Récupération données attaque
2. Récupération défenses de la ville cible
3. **Simulation de combat** :
   - Calcul puissance attaquant/défenseur
   - Application bonus (recherches, bâtiments)
   - Simulation rounds de combat
   - Détermination vainqueur
4. Calcul pertes des deux côtés
5. Calcul butin (si victoire attaquant)
6. Création rapport de bataille
7. Notification joueurs
8. **Retour des troupes** (job retardé)

### 3. Simulation de combat

**Fichier** : `domain/simulation.js`

**Algorithme** :
```javascript
function simulateCombatRounds(attackerFleet, defenderFleet) {
  let round = 1;
  
  while (attackerFleet.totalPower > 0 && defenderFleet.totalPower > 0 && round <= 10) {
    // Chaque unité tire sur l'ennemi
    attackerFleet.units.forEach(unit => {
      const damage = unit.attack * unit.quantity;
      defenderFleet.takeDamage(damage);
    });
    
    defenderFleet.units.forEach(unit => {
      const damage = unit.attack * unit.quantity;
      attackerFleet.takeDamage(damage);
    });
    
    round++;
  }
  
  return {
    winner: attackerFleet.totalPower > defenderFleet.totalPower ? 'attacker' : 'defender',
    attackerLosses: attackerFleet.calculateLosses(),
    defenderLosses: defenderFleet.calculateLosses(),
    rounds: round
  };
}
```

**Facteurs influençant le combat** :
- Puissance d'attaque des unités
- Défense des unités
- Niveau des recherches militaires
- Défenses statiques (tourelles, murs)
- Moral (future feature)

### 4. Espionnage

**Endpoint** : `POST /api/v1/combat/spy`

**Payload** :
```json
{
  "attackerCityId": 1,
  "targetCityId": 2,
  "spyType": "resources",
  "spyUnits": [{ "entityId": 10, "quantity": 5 }]
}
```

**Types d'espionnage** :
- `resources` : Voir ressources disponibles
- `defenses` : Voir défenses statiques
- `fleet` : Voir unités militaires
- `buildings` : Voir bâtiments et niveaux

**Risque de détection** :
- Basé sur ratio espions attaquant / défenses cible
- Si détecté : perte des espions + alerte défenseur

### 5. Défenses automatiques

**Endpoint** : `GET /api/v1/combat/defenses`

Les défenses statiques se déclenchent automatiquement lors d'une attaque :

- Tourelles laser
- Canons railgun
- Champs de force
- Mines
- Systèmes de brouillage

**Bonus défensif** :
```javascript
const wallsBonus = Math.min(wallsLevel * 0.05, 0.5); // +5%/niveau, max 50%
const totalDefensePower = baseDefense * (1 + wallsBonus);
```

## Modèles de données

### Attack
```javascript
{
  id: number,
  attacker_city_id: number,
  defender_city_id: number,
  attacker_user_id: number,
  defender_user_id: number,
  attack_type: 'raid' | 'conquest' | 'siege',
  status: 'traveling' | 'arrived' | 'completed' | 'returning',
  distance: number,
  departure_time: Date,
  arrival_time: Date,
  return_time: Date,
  loot: { gold, metal, fuel },
  waves: [AttackWave]
}
```

### AttackWave
```javascript
{
  id: number,
  attack_id: number,
  units: [
    { entity_id: number, quantity: number, survived: number }
  ]
}
```

### BattleReport
```javascript
{
  id: number,
  attack_id: number,
  attacker_user_id: number,
  defender_user_id: number,
  outcome: 'attacker_victory' | 'defender_victory' | 'draw',
  attacker_losses: { unitId: losses },
  defender_losses: { unitId: losses },
  loot: { gold, metal, fuel },
  rounds: number,
  created_at: Date
}
```

## Règles métier

### Calcul temps de voyage
```javascript
const TRAVEL_SPEED = 30; // minutes par tile
const travelTimeMinutes = distance * TRAVEL_SPEED;
```

### Calcul distance (Manhattan)
```javascript
function calculateDistance(x1, y1, x2, y2) {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}
```

### Calcul butin
```javascript
function calculateLoot(defenderResources, attackType) {
  const lootPercentage = {
    raid: 0.5,      // 50% des ressources
    conquest: 0.75, // 75% des ressources
    siege: 0.9      // 90% des ressources
  };
  
  return {
    gold: defenderResources.gold * lootPercentage[attackType],
    metal: defenderResources.metal * lootPercentage[attackType],
    fuel: defenderResources.fuel * lootPercentage[attackType]
  };
}
```

### Pertes au combat
- Pertes minimales : 10% des unités envoyées (même en victoire écrasante)
- Pertes maximales : 100% (défaite totale)
- Calcul basé sur ratio de puissance attaquant/défenseur

## Events Socket.IO

### `attack_launched`
Émis quand une attaque est lancée :
```javascript
socket.emit('attack_launched', {
  attackId: 123,
  targetCity: 'Paris',
  arrivalTime: '2024-12-01T14:30:00Z'
});
```

### `under_attack`
Émis au défenseur quand attaque arrive :
```javascript
socket.emit('under_attack', {
  attackId: 123,
  attackerName: 'Player1',
  units: [...]
});
```

### `battle_report`
Émis aux deux joueurs après combat :
```javascript
socket.emit('battle_report', {
  reportId: 456,
  outcome: 'attacker_victory',
  losses: {...},
  loot: {...}
});
```

## Tests

### Unit tests
```bash
npm test modules/combat/application/__tests__/CombatService.test.js
```

**Scénarios testés** :
- ✅ Rejet attaque sur ville propre
- ✅ Rejet si ville attaquante non possédée
- ✅ Rejet si unités insuffisantes
- ✅ Calcul correct temps de voyage
- ✅ Déduction unités de l'attaquant
- ✅ Rollback transaction sur erreur

### Tests de simulation
```bash
npm test modules/combat/domain/__tests__/simulation.test.js
```

## Performance

### Optimisations
- Index DB sur `attacker_user_id`, `defender_user_id`, `status`
- Eager loading des AttackWaves lors de `getAttackById`
- Pagination sur liste des attaques (`LIMIT 50`)
- Cache Redis pour recherches militaires (TTL 5min)

### Métriques
- Temps moyen traitement attaque : ~100ms
- Temps simulation combat : ~50ms
- Throughput : ~200 attaques/minute

## Évolutions futures

### Court terme
- [ ] Retour automatique des troupes avec butin
- [ ] Modal frontend pour rapports de bataille
- [ ] Attaques groupées (alliances)

### Moyen terme
- [ ] Système de moral (bonus/malus selon victoires/défaites)
- [ ] Attaques planifiées (timer)
- [ ] Espionnage avancé (sabotage)

### Long terme
- [ ] Batailles spatiales (orbite)
- [ ] Armes de destruction massive
- [ ] Système d'alliances avec guerres globales

## Références

- [combatRules.js](../../backend/modules/combat/domain/combatRules.js) - Règles métier
- [CombatService.js](../../backend/modules/combat/application/CombatService.js) - Service principal
- [AttackWorker](../../backend/jobs/workers/attackWorker.js) - Worker async
