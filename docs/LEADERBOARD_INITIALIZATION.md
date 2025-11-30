# Guide d'Initialisation des Leaderboards - Terra Dominus

## Vue d'ensemble

Le système de leaderboard calcule et suit automatiquement les scores des joueurs dans différentes catégories. Le script d'initialisation permet de recalculer tous les scores pour les utilisateurs existants, ce qui est utile pour:

- Initialisation initiale du système
- Recalcul après modifications de formules
- Correction de données
- Ajout de nouveaux utilisateurs

## Script d'Initialisation

### Fichier

`backend/scripts/initLeaderboards.js`

### Commande NPM

```bash
npm run init-leaderboards
```

### Options

Le script supporte des filtres optionnels:

```bash
# Tous les utilisateurs, toutes les catégories
npm run init-leaderboards

# Utilisateurs spécifiques
npm run init-leaderboards -- --users=78,79,80

# Catégories spécifiques
npm run init-leaderboards -- --categories=total_power,economy

# Combinaison
npm run init-leaderboards -- --users=78,79 --categories=total_power,buildings
```

## Catégories de Leaderboard

### Catégories Calculables (recalculées par le script)

| Catégorie | Description | Calcul |
|-----------|-------------|--------|
| `total_power` | Puissance militaire totale | (Niveaux bâtiments × 100) + (Quantité unités × puissance) |
| `economy` | Volume d'échanges économiques | Somme des transactions (achat + vente) |
| `buildings` | Progression des bâtiments | Somme des niveaux de tous les bâtiments |
| `research` | Progression de la recherche | Somme des niveaux de toutes les recherches |
| `achievements` | Succès débloqués | Nombre de `UserAchievement` |
| `battle_pass` | Progression Battle Pass | (tier × 1000) + XP actuel |

### Catégories Incrémentales (historique requis)

Ces catégories ne peuvent PAS être recalculées car elles nécessitent l'historique complet des actions:

- `combat_victories`: Nombre de combats gagnés (incrémenté à chaque victoire)
- `resources`: Ressources produites cumulées (incrémenté à chaque production)
- `portals`: Portails explorés (incrémenté à chaque exploration)

## Architecture Technique

### Dépendances

Le script utilise:

- `backend/models`: User, LeaderboardEntry, City, Building, Research, Unit, MarketTransaction, UserAchievement, UserBattlePass
- `backend/utils/leaderboardIntegration.js`: Service d'intégration leaderboard
- `backend/utils/logger.js`: Logging structuré

### Flux d'Exécution

```
1. Parse command line arguments (users, categories)
2. Fetch users from database
3. For each user:
   a. Calculate scores for each category
   b. Call leaderboardIntegration.updateXXXScore()
   c. leaderboardService.updateScore() creates/updates LeaderboardEntry
4. Display progress bar
5. Show summary and sample results
```

### Calcul des Scores

#### Total Power

```javascript
// Buildings power (via cities)
const cities = await City.findAll({ where: { user_id } });
const cityIds = cities.map(c => c.id);
const buildings = await Building.findAll({ where: { city_id: cityIds } });
const buildingPower = buildings.reduce((sum, b) => sum + (b.level || 0) * 100, 0);

// Units power (via cities)
const units = await Unit.findAll({ where: { city_id: cityIds } });
const unitPower = units.reduce((sum, u) => {
  const powerMap = { Infantry: 10, Tank: 50, Aircraft: 100 };
  return sum + (u.quantity || 0) * (powerMap[u.type] || 10);
}, 0);

const totalPower = buildingPower + unitPower;
```

#### Buildings Score

```javascript
const buildings = await Building.findAll({ where: { city_id: cityIds } });
const totalLevels = buildings.reduce((sum, b) => sum + (b.level || 0), 0);
```

#### Research Score

```javascript
const researches = await Research.findAll({ where: { user_id } });
const totalLevels = researches.reduce((sum, r) => sum + (r.level || 0), 0);
```

#### Economy Score

```javascript
const transactions = await MarketTransaction.findAll({
  where: { [Op.or]: [{ buyer_id: userId }, { seller_id: userId }] }
});
const totalVolume = transactions.reduce((sum, tx) => sum + parseFloat(tx.total_price || 0), 0);
```

#### Achievements Score

```javascript
const count = await UserAchievement.count({ where: { user_id } });
```

#### Battle Pass Score

```javascript
const activeSeason = await BattlePassSeason.findOne({ where: { is_active: true } });
const userProgress = await UserBattlePass.findOne({
  where: { user_id, season_id: activeSeason.id }
});
const score = (userProgress.current_tier * 1000) + userProgress.current_xp;
```

### Gestion des Erreurs

- Les erreurs dans chaque catégorie sont loguées mais n'arrêtent pas le traitement
- `Promise.allSettled` garantit que toutes les catégories sont traitées même en cas d'erreur
- Le script affiche le nombre total d'erreurs dans le résumé

### Performance

- **Throttling**: Pause de 100ms tous les 10 utilisateurs pour éviter de surcharger la DB
- **Batch processing**: Les mises à jour sont groupées par utilisateur avec `Promise.allSettled`
- **Optimisations**: Sélection uniquement des attributs nécessaires (ex: `attributes: ['id', 'level']`)

## Utilisation

### Initialisation Initiale

Lors du premier déploiement:

```bash
npm run init-leaderboards
```

Cela calculera les scores pour tous les utilisateurs existants.

### Mise à Jour après Modification de Formule

Si vous modifiez le calcul d'une catégorie:

```bash
# Recalculer uniquement cette catégorie pour tous les utilisateurs
npm run init-leaderboards -- --categories=total_power
```

### Test sur Utilisateurs Spécifiques

Pour tester avant de lancer sur toute la base:

```bash
# Test sur 3 utilisateurs
npm run init-leaderboards -- --users=1,2,3

# Vérification des résultats
psql -U terra_dominus_user -d terra_dominus_db -c "SELECT * FROM leaderboard_entries WHERE user_id IN (1,2,3);"
```

### Maintenance Régulière

Il est recommandé de relancer périodiquement le script pour:

- Corriger les éventuelles désynchonisations
- Recalculer après des corrections de bugs
- Vérifier la cohérence des données

Fréquence suggérée: **1 fois par semaine** ou **après chaque mise à jour majeure**

## Vérification

### Vérifier les Entrées Créées

```sql
-- Compter les entrées par catégorie
SELECT category, COUNT(*) 
FROM leaderboard_entries 
GROUP BY category;

-- Top 10 dans chaque catégorie
SELECT le.category, u.username, le.score, le.previous_rank
FROM leaderboard_entries le
JOIN users u ON u.id = le.user_id
WHERE le.category = 'total_power'
ORDER BY le.score DESC
LIMIT 10;
```

### Vérifier un Utilisateur Spécifique

```sql
SELECT * FROM leaderboard_entries WHERE user_id = 78;
```

### Script Node.js de Vérification

Créer `backend/checkLeaderboard.js`:

```javascript
const { sequelize, LeaderboardEntry } = require('./models');

async function check() {
  const entries = await LeaderboardEntry.findAll({
    where: { user_id: 78 },
    order: [['category', 'ASC']]
  });
  
  console.log(`User 78 leaderboard entries:`);
  entries.forEach(e => console.log(`  ${e.category}: ${e.score}`));
  
  await sequelize.close();
}

check();
```

Exécuter:

```bash
node backend/checkLeaderboard.js
```

## Dépannage

### Problème: "Error updating XXX score for user YYY"

**Cause**: Le service leaderboardIntegration logue des erreurs même quand tout va bien (problème de conception à améliorer).

**Solution**: Vérifier si les entrées ont été créées malgré l'erreur:

```bash
node backend/checkLeaderboard.js
```

Si les données sont présentes, l'erreur peut être ignorée.

### Problème: Scores à 0 pour tous les utilisateurs

**Causes possibles**:

1. Les utilisateurs n'ont pas encore d'activité (bâtiments, recherches, etc.)
2. Les relations entre modèles ne sont pas correctes (Building → City, Unit → City)
3. Les données sont dans des tables différentes

**Solution**: Vérifier les données brutes:

```sql
-- Vérifier les bâtiments
SELECT c.user_id, COUNT(b.id) as building_count
FROM cities c
LEFT JOIN buildings b ON b.city_id = c.id
GROUP BY c.user_id;

-- Vérifier les recherches
SELECT user_id, COUNT(*) FROM researches GROUP BY user_id;
```

### Problème: Script très lent

**Cause**: Trop d'utilisateurs traités en même temps

**Solution**: Traiter par batches:

```bash
# Batch 1: users 1-100
npm run init-leaderboards -- --users=1,2,3,...,100

# Batch 2: users 101-200
npm run init-leaderboards -- --users=101,102,...,200
```

Ou augmenter le délai dans le script:

```javascript
// Dans initLeaderboards.js, changer:
if (i % 10 === 0 && i > 0) {
  await new Promise(resolve => setTimeout(resolve, 500)); // 500ms au lieu de 100ms
}
```

## Intégration CI/CD

### Déploiement

Ajouter au script de déploiement:

```bash
# après les migrations DB
npm run init-leaderboards

# ou seulement certaines catégories si formules modifiées
npm run init-leaderboards -- --categories=total_power,buildings
```

### Tests

Ajouter un test dans `.github/workflows/ci.yml`:

```yaml
- name: Test Leaderboard Initialization
  run: |
    cd backend
    npm run init-leaderboards -- --users=1,2,3
    # Vérifier que des entrées ont été créées
    node -e "require('./models').LeaderboardEntry.count().then(c => { if (c === 0) throw new Error('No entries'); })"
```

## Améliorations Futures

### Quick Wins

1. **Logging amélioré**: Retirer les faux messages d'erreur dans leaderboardIntegration
2. **Parallélisation**: Traiter plusieurs utilisateurs en parallèle (avec contrôle de concurrence)
3. **Dry-run mode**: Option `--dry-run` pour simuler sans écrire en DB

### Fonctionnalités Avancées

1. **Incremental updates**: Tracker quels utilisateurs ont besoin d'un recalcul (dirty flag)
2. **Webhook notifications**: Notifier les joueurs quand leur rang change significativement
3. **Historical snapshots**: Sauvegarder l'historique des leaderboards (top 100 quotidien)
4. **Real-time recalculation**: Recalculer automatiquement quand un score devrait changer

### Performance

1. **Bulk updates**: Utiliser `bulkCreate` avec `updateOnDuplicate` au lieu de `updateScore` individuel
2. **Caching**: Redis cache pour les top 100 de chaque catégorie
3. **Database indexes**: Ajouter index sur `leaderboard_entries(category, score)` pour accélérer le tri

## Références

- [PHASE_1_STATUS.md](../archive_docs/PHASE_1_STATUS.md): État d'avancement Phase 1
- [Battle Pass XP Sources](./BATTLE_PASS_XP_SOURCES.md): Intégration XP battle pass
- [Achievement Auto-Detection](./ACHIEVEMENT_AUTO_DETECTION.md): Système de détection automatique
- [Leaderboard Module](../backend/modules/leaderboard/): Code source du module leaderboard

## Notes Techniques

### Pourquoi Building et Unit utilisent city_id?

Dans Terra Dominus, les bâtiments et unités appartiennent à des **villes**, pas directement aux utilisateurs. Cela permet:

- Plusieurs villes par utilisateur
- Gestion géographique (coordonnées de ville)
- Logique de jeu plus riche (attaque de ville spécifique)

### Pourquoi Ne Pas Utiliser Sequelize includes?

Le script utilise des requêtes séparées au lieu de `include`:

```javascript
// ❌ Ne fonctionne pas (pas d'association définie)
const cities = await City.findAll({
  where: { user_id },
  include: [Building]
});

// ✅ Fonctionne
const cities = await City.findAll({ where: { user_id }, attributes: ['id'] });
const buildings = await Building.findAll({ where: { city_id: cityIds } });
```

Raison: Les associations Sequelize ne sont pas toutes définies dans `models/worldAssociations.js`. C'est une amélioration future possible.

---

**Auteur**: GitHub Copilot  
**Date**: 2024  
**Version**: 1.0  
**Statut**: ✅ Quick Win #3 Complété
