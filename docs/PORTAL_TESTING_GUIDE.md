# Portal System - Guide de Test

## Tests Manuels Recommandés

### 1. Test Backend - Spawn Portal

```bash
cd backend
node testSpawnPortal.js
```

Ce script va:
- Spawner un portail aléatoire
- Afficher tous ses détails (tier, enemies, loot, etc.)
- Afficher les statistiques des portails actifs

### 2. Test API - Vérifier les endpoints

#### Obtenir tous les portails actifs
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:5000/api/v1/portals
```

#### Obtenir portails près de coordonnées
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:5000/api/v1/portals/near/500/500?radius=100
```

#### Challenge un portail
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"cityId": 1, "units": {"Infantry": 50, "Tank": 10}}' \
  http://localhost:5000/api/v1/portals/1/challenge
```

#### Voir vos expéditions
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:5000/api/v1/portals/expeditions
```

### 3. Test Frontend

1. **Démarrer le backend:**
```bash
cd backend
npm run start
```

2. **Démarrer le frontend (dans un autre terminal):**
```bash
cd frontend
npm start
```

3. **Naviguer vers WorldMap:**
   - Se connecter avec un compte
   - Aller sur la carte du monde
   - Les portails devraient apparaître comme des cercles colorés pulsants

4. **Interagir avec un portail:**
   - Cliquer sur un portail
   - Le modal s'ouvre avec les détails
   - Sélectionner une ville de départ
   - Entrer des unités
   - Lancer l'expédition

5. **Vérifier la résolution:**
   - Attendre le temps de voyage (ou réduire pour test)
   - Une notification devrait apparaître
   - Vérifier les survivants et le loot

### 4. Test Workers BullMQ

#### Vérifier les jobs schedulés
```bash
# Dans la console Redis
redis-cli
> KEYS *portal*
> HGETALL bull:portal:repeat:portal-spawn-recurring
```

#### Vérifier qu'un portal spawn automatiquement
- Attendre 30 minutes (ou modifier le cron pour 1 minute)
- Vérifier les logs du backend: "Portal spawned"
- Refresh la WorldMap, nouveau portal doit apparaître

### 5. Test Socket.IO Events

#### Test portal_spawned
1. Ouvrir la console browser (F12)
2. Dans un terminal backend: `node testSpawnPortal.js`
3. La WorldMap devrait automatiquement afficher le nouveau portail

#### Test portal_expedition_resolved
1. Lancer une expédition
2. Attendre l'arrival_time
3. Alert doit apparaître avec victoire/défaite
4. Vérifier les survivants retournent à la ville

### 6. Test Database

#### Vérifier les tables
```sql
-- Voir tous les portails actifs
SELECT id, tier, coord_x, coord_y, power, status, expires_at 
FROM portals 
WHERE status = 'active';

-- Voir toutes les expéditions
SELECT pe.id, pe.user_id, pe.status, pe.arrival_time, p.tier
FROM portal_expeditions pe
JOIN portals p ON pe.portal_id = p.id
ORDER BY pe.created_at DESC;

-- Statistiques par tier
SELECT tier, COUNT(*) as count
FROM portals
WHERE status = 'active'
GROUP BY tier;
```

## Checklist Tests Complets

### Backend
- [ ] Migration DB exécutée sans erreur
- [ ] Server démarre sans erreur
- [ ] Workers initialisés (logs "Scheduled portal spawning")
- [ ] API GET /portals retourne 200
- [ ] API POST /portals/:id/challenge avec JWT valide retourne 201
- [ ] Portal spawn manuel avec testSpawnPortal.js fonctionne
- [ ] Tiers random respectent les probabilités (50% GREY, 0.5% GOLD)
- [ ] Enemies générés selon tier
- [ ] Loot table assignée selon tier
- [ ] Expiration calculée correctement

### Frontend
- [ ] WorldMap charge sans erreur
- [ ] Portails s'affichent sur la carte
- [ ] Couleurs correspondent aux tiers (GREY gris, GOLD doré)
- [ ] Animation pulse fonctionne
- [ ] Clic sur portal ouvre le modal
- [ ] Modal affiche détails: enemies, loot, power
- [ ] Sélection ville de départ fonctionne
- [ ] Calcul distance/travel time correct
- [ ] Sélection unités fonctionne
- [ ] Power comparison affiche verdict (fort/moyen/faible)
- [ ] Bouton "Lancer expédition" fonctionne
- [ ] Modal se ferme après lancement

### Socket.IO
- [ ] Event portal_spawned reçu et WorldMap refresh
- [ ] Event portal_expired reçu et portal retiré
- [ ] Event portal_expedition_resolved reçu avec alert
- [ ] Notification browser si autorisée

### Workers
- [ ] Job spawn s'exécute toutes les 30min
- [ ] Job expire s'exécute toutes les 10min
- [ ] Job resolve s'exécute à arrival_time
- [ ] Expedition resolve calcule victoire correctement
- [ ] Survivors calculés (60-80% victoire, 10-30% défaite)
- [ ] Loot généré uniquement si victoire
- [ ] Portal marqué 'cleared' après victoire

### Game Logic
- [ ] AttackerPower > PortalPower = victoire
- [ ] AttackerPower < PortalPower = défaite
- [ ] Unités: Infantry=1, Tank=5, Artillery=4, etc.
- [ ] Distance euclidienne calculée correctement
- [ ] Travel speed: 2 tiles/heure
- [ ] Portal expire après duration (GREY 4h, GOLD 30min)
- [ ] Loot garanti + random selon drop chances

## Scénarios de Test Recommandés

### Scénario 1: First Portal Challenge (Happy Path)
1. Spawner un GREY portal (facile)
2. Envoyer 50 Infantry + 10 Tanks (puissance ~100)
3. Vérifier victoire
4. Vérifier survivors (60-80%)
5. Vérifier loot reçu
6. Vérifier portal status = 'cleared'

### Scénario 2: Defeat Scenario
1. Spawner un PURPLE portal (puissance 400-1000)
2. Envoyer seulement 20 Infantry (puissance 20)
3. Vérifier défaite
4. Vérifier survivors (10-30%)
5. Vérifier aucun loot
6. Vérifier portal status reste 'active'

### Scénario 3: Portal Expiration
1. Spawner un portal
2. Modifier expires_at dans DB pour NOW + 1 minute
3. Attendre expiration
4. Vérifier status = 'expired'
5. Vérifier ne peut plus être challengé

### Scénario 4: Multiple Portals
1. Spawner 5 portals
2. Vérifier tous s'affichent sur WorldMap
3. Vérifier statistiques (count par tier)
4. Challenge 2 portals simultanément
5. Vérifier 2 expéditions en cours

### Scénario 5: Real-time Updates
1. Ouvrir 2 browsers (2 users)
2. User 1 spawne portal
3. Vérifier User 2 voit portal apparaître
4. User 1 challenge portal
5. Vérifier User 1 reçoit notification résolution

## Commandes Utiles

### Clear tous les portails (reset)
```sql
DELETE FROM portal_expeditions;
DELETE FROM portals;
```

### Créer portal de test (DB direct)
```sql
INSERT INTO portals (tier, coord_x, coord_y, power, enemies, loot_table, status, spawned_at, expires_at, created_at, updated_at)
VALUES (
  'GREY',
  500, 500,
  50,
  '[{"type":"Slime","quantity":10,"attack":2,"defense":1}]',
  '{"guaranteed":{"gold":{"min":100,"max":200}},"random":[]}',
  'active',
  NOW(),
  NOW() + INTERVAL '4 hours',
  NOW(),
  NOW()
);
```

### Forcer résolution expédition (DB direct)
```sql
UPDATE portal_expeditions
SET arrival_time = NOW() - INTERVAL '1 minute'
WHERE status = 'traveling' AND id = 1;
```

## Problèmes Connus / À Surveiller

1. **Redis version warning**: Version 5.0.14 < 6.2.0 recommandée
   - Fonctionnel mais logs verbeux
   - Recommandation: upgrade Redis

2. **Portal spawn overlap**: Plusieurs portals peuvent spawn aux mêmes coords
   - Acceptable car rare
   - TODO futur: Vérifier coords non utilisées

3. **Socket.IO multiple connections**: User peut avoir plusieurs tabs
   - Notifications en double possible
   - Acceptable pour MVP

4. **Expedition cancellation**: Pas implémenté
   - TODO futur: Bouton annuler expédition

5. **Portal quality/difficulty balance**: Valeurs à ajuster après playtests
   - Power ranges par tier peuvent être tweakés
   - Drop chances à optimiser

## Next Steps Après Tests

1. **Ajustements balance**: Modifier power ranges, drop chances selon feedback
2. **Quest system**: Intégrer portals dans quests "Kill 10 GREY portals"
3. **Leaderboard**: Top players par portals cleared
4. **Portal history**: Voir historique des portals cleared
5. **Expedition history**: Logs détaillés par expédition
6. **Advanced features**: Co-op raids, portal difficulty modifiers, rare boss portals
