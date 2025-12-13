# Fix: Retour des unités après combat

## Problème identifié

Les unités envoyées en attaque ne revenaient jamais à la ville de l'attaquant après le combat.

### Symptômes
- Attaques bloquées en statut `arrived` au lieu de `completed`
- Champ `survivors` à `NULL` dans `attack_waves`
- Unités jamais restituées à l'attaquant (quantité reste à 0)
- Butin non attribué à l'attaquant

### Cause racine
Dans `backend/modules/combat/application/CombatService.js`, la méthode `resolveCombat()` contenait un TODO :
```javascript
// Ajouter au pillard (quand les troupes reviennent)
// TODO: Implémenter le retour des troupes avec le butin
```

Le système :
1. ✅ Déduisait les unités au lancement de l'attaque
2. ✅ Calculait les survivants après le combat
3. ✅ Mettait à jour `attack_waves.survivors`
4. ❌ **Ne restituait JAMAIS les unités à l'attaquant**
5. ❌ **N'attribuait JAMAIS le butin à l'attaquant**

## Solution implémentée

### 1. Fix immédiat avec script de correction
Script `backend/fix_stuck_attacks.js` pour traiter les attaques bloquées :
- Trouve toutes les attaques en statut `arrived`
- Restitue les unités survivantes (ou toutes si `survivors` = NULL)
- Marque l'attaque comme `completed`

```bash
node backend/fix_stuck_attacks.js
```

### 2. Fix permanent dans CombatService
Modification de `backend/modules/combat/application/CombatService.js` (ligne ~480) :

**Avant :**
```javascript
// Ajouter au pillard (quand les troupes reviennent)
// TODO: Implémenter le retour des troupes avec le butin
```

**Après :**
```javascript
// Ajouter le butin aux ressources de l'attaquant
const attackerResources = await this.Resource.findOne({
  where: { city_id: attack.attacker_city_id },
  transaction
});

if (attackerResources) {
  attackerResources.gold += loot.gold;
  attackerResources.metal += loot.metal;
  attackerResources.fuel += loot.fuel;
  await attackerResources.save({ transaction });
  
  this.logger.info('💰 Butin ajouté à l\'attaquant', {
    cityId: attack.attacker_city_id,
    loot
  });
}

// Restituer les unités survivantes à l'attaquant
for (const wave of attack.waves) {
  const survivors = wave.survivors || 0;
  if (survivors > 0) {
    await this.Unit.increment(
      'quantity',
      {
        by: survivors,
        where: { id: wave.unit_entity_id },
        transaction
      }
    );
    
    this.logger.info('↩️  Unités restituées', {
      unitId: wave.unit_entity_id,
      survivors,
      originalQuantity: wave.quantity
    });
  }
}
```

## Scripts de vérification

### Vérifier l'état d'une attaque
```bash
node backend/check_attacks.js
```

Affiche pour chaque attaque :
- Statut et outcome
- Unités envoyées vs survivantes
- Quantité actuelle dans la ville
- Butin pillé

### Tester le flux complet
```bash
node backend/test_attack_return.js
```

Test end-to-end qui :
1. Lance une attaque
2. Vérifie la déduction des unités
3. Résout le combat
4. Vérifie le retour des survivants
5. Vérifie l'attribution du butin

## Résultat

✅ Les unités reviennent correctement après le combat  
✅ Le butin est ajouté aux ressources de l'attaquant  
✅ Le statut passe à `completed`  
✅ Les `survivors` sont enregistrés dans `attack_waves`  

## Architecture du système d'attaque

### 1. Lancement (`launchAttack`)
- Validation des paramètres
- Calcul du coût (carburant, etc.)
- **Déduction des unités de la ville**
- Création de l'attaque avec statut `traveling`
- Création des `attack_waves`

### 2. Arrivée (Worker `attackWorker.js`)
- Scan toutes les 30s des attaques arrivées
- Change le statut à `arrived`
- Lance un job `process-attack`

### 3. Combat (`resolveCombat`)
- Calcul des forces (avec bonus tech, murs, formation)
- Simulation du combat
- **Calcul des pertes et survivants**
- Calcul du butin (si victoire attaquant)
- **Attribution du butin** ✨ NOUVEAU
- **Restitution des unités** ✨ NOUVEAU
- Création du rapport de combat
- Statut → `completed`

### 4. Notifications
- Battle Pass XP si victoire
- Leaderboard mis à jour
- Achievements vérifiés
- Socket.IO events envoyés

## Notes importantes

- Le worker `attackWorker.js` doit tourner pour traiter automatiquement les attaques
- Lancer avec : `npm run worker` dans `/backend`
- Les attaques sont scannées toutes les 30 secondes
- Utiliser `checkJobs.js` pour vérifier l'état des queues BullMQ

## Fichiers modifiés

- ✏️  `backend/modules/combat/application/CombatService.js` (fix permanent)
- 🆕 `backend/fix_stuck_attacks.js` (script de correction)
- 🆕 `backend/check_attacks.js` (script de vérification)
- 🆕 `backend/test_attack_return.js` (test end-to-end)
- 🆕 `backend/ATTACK_RETURN_FIX.md` (cette doc)
