# Scripts de Gestion des Constructions

Ce dossier contient des scripts utilitaires pour gérer et monitorer le système de construction.

## 🔧 Scripts Disponibles

### 1. `fix_stuck_constructions.js`
**Objectif:** Répare les constructions bloquées en état `in_progress` dont le temps de fin est dépassé.

**Utilisation:**
```bash
cd backend
node fix_stuck_constructions.js
```

**Quand l'utiliser:**
- Après un crash du serveur
- Après un redémarrage non planifié
- Quand des joueurs signalent des constructions bloquées à 0
- Après une panne de Redis/BullMQ

**Ce qu'il fait:**
- Recherche toutes les constructions `in_progress` avec `finishTime` dans le passé
- Les marque automatiquement comme `completed`
- Permet au joueur de collecter ces constructions depuis l'interface

**Exemple de sortie:**
```
🔍 Recherche des constructions bloquées...

❌ 1 construction(s) bloquée(s) trouvée(s):

  - ID: 52
    City: 86, Entity: 5
    Finish Time: Fri Dec 05 2025 22:52:43 GMT+0100
    Delay: 36h 22min

🔧 Réparation en cours...

✅ Construction 52 marquée comme 'completed'
✅ 1/1 construction(s) réparée(s)
```

---

### 2. `monitor_constructions.js`
**Objectif:** Affiche un tableau de bord complet de l'état des constructions et des jobs BullMQ.

**Utilisation:**
```bash
cd backend
node monitor_constructions.js
```

**Quand l'utiliser:**
- Pour diagnostiquer des problèmes de construction
- Pour vérifier l'état des jobs BullMQ
- Pour surveiller les constructions actives
- Avant un redémarrage planifié du serveur

**Ce qu'il affiche:**
- Nombre de constructions par statut (queued, in_progress, completed, cancelled)
- Liste détaillée des constructions en cours avec temps restant
- Constructions en attente (queued)
- État des queues BullMQ (construction, resource_upgrade, facility_upgrade)
- Détails des jobs actifs, en attente, ou en échec
- Alertes pour les constructions expirées

**Exemple de sortie:**
```
🏗️  Construction Monitoring Dashboard
════════════════════════════════════════════════════════════

📊 Constructions par statut:
  completed: 37

🔧 BullMQ Jobs:
  Construction queue: 0 jobs
  Resource upgrade queue: 0 jobs
  Facility upgrade queue: 0 jobs

════════════════════════════════════════════════════════════
✅ Monitoring terminé
```

---

### 3. `test_construction_sync.js`
**Objectif:** Test complet du système de synchronisation des constructions.

**Utilisation:**
```bash
cd backend
node test_construction_sync.js
```

**Quand l'utiliser:**
- Pour valider le système de synchronisation après modifications
- Pour vérifier que la synchronisation au démarrage fonctionne
- Pour tester le comportement avec des constructions expirées

**Ce qu'il fait:**
- Affiche l'état actuel des constructions `in_progress`
- Vérifie l'état de la queue BullMQ avant synchronisation
- Exécute `syncConstructionJobs()`
- Compare l'état avant/après
- Affiche les détails des jobs reprogrammés

---

## ⚙️ Système de Synchronisation Automatique

### `jobs/syncConstructionJobs.js`
Ce module est **automatiquement exécuté au démarrage du serveur** dans `server.js`.

**Ce qu'il fait au démarrage:**
1. Recherche toutes les constructions `in_progress`
2. Pour chaque construction :
   - Si `finishTime` est dans le passé → marque comme `completed`
   - Si `finishTime` est dans le futur → reprogramme le job BullMQ
3. Log le résultat de la synchronisation

**Avantages:**
- ✅ Plus de constructions bloquées après un redémarrage
- ✅ Les jobs perdus sont automatiquement recréés
- ✅ Les constructions expirées sont immédiatement collectables
- ✅ Transparent pour les joueurs

**Logs au démarrage:**
```javascript
{"level":30,"module":"construction-sync","msg":"Starting construction jobs synchronization..."}
{"level":30,"module":"construction-sync","msg":"Found active constructions","count":2}
{"level":30,"module":"construction-sync","msg":"Marked expired construction as completed","constructionId":52,"cityId":86,"delayMs":130963000}
{"level":30,"module":"construction-sync","msg":"Rescheduled construction job","constructionId":54,"cityId":87,"remainingSeconds":120}
{"level":30,"module":"construction-sync","msg":"Construction jobs synchronization completed","synced":1,"expired":1}
```

---

## 🔍 Diagnostic de Problèmes

### Scénario 1: Joueur signale "construction bloquée à 0"

**Solution:**
```bash
cd backend
node fix_stuck_constructions.js
```

### Scénario 2: Après un crash du serveur

**Solution:**
Le serveur va automatiquement synchroniser au démarrage. Vérifiez les logs:
```bash
# Dans les logs du serveur, cherchez:
grep "construction-sync" logs/server.log
```

### Scénario 3: Vérifier l'état général du système

**Solution:**
```bash
cd backend
node monitor_constructions.js
```

### Scénario 4: Jobs BullMQ ne s'exécutent pas

**Vérifications:**
1. Redis est actif ?
   ```bash
   redis-cli ping
   ```

2. Les workers BullMQ sont démarrés ?
   ```bash
   # Dans les logs, cherchez:
   grep "worker" logs/server.log
   ```

3. Vérifier les jobs manuellement :
   ```bash
   cd backend
   node checkJobs.js
   ```

---

## 📝 Notes Techniques

### Pourquoi les constructions se bloquent-elles ?

1. **Redémarrage du serveur** : Les jobs BullMQ en attente (delayed) sont perdus si Redis n'est pas persistent
2. **Crash du serveur** : Les jobs programmés ne sont pas réexécutés
3. **Erreurs dans le worker** : Si le worker BullMQ échoue silencieusement
4. **Problèmes Redis** : Si Redis redémarre ou perd des données

### Comment le système les évite maintenant ?

1. **Synchronisation au démarrage** : `syncConstructionJobs()` est appelé automatiquement
2. **Reprogrammation automatique** : Les jobs perdus sont recréés avec le bon délai
3. **Marquage des expirées** : Les constructions déjà terminées sont marquées `completed`
4. **Logging détaillé** : Tous les événements sont loggés pour diagnostic

### Structure des données

```javascript
ConstructionQueue {
  id: INTEGER,
  cityId: INTEGER,        // Ville concernée
  entityId: INTEGER,      // ID du bâtiment dans la table entities
  type: STRING,           // 'building', 'facility', etc.
  status: ENUM,           // 'queued', 'in_progress', 'completed', 'cancelled'
  startTime: DATE,        // Début de la construction
  finishTime: DATE,       // Fin prévue
  slot: INTEGER           // Position dans la file (1 = actif)
}
```

### Queues BullMQ

- `construction` : Bâtiments génériques (legacy)
- `resource-upgrade` : Bâtiments de ressources
- `facility-upgrade` : Installations (caserne, spatioport, etc.)

Chaque queue a son propre worker dans `backend/jobs/workers/`.

---

## 🚀 Améliorations Futures

- [ ] Ajouter un endpoint API `/api/admin/constructions/sync` pour forcer la synchronisation
- [ ] Créer un dashboard admin pour monitorer les constructions en temps réel
- [ ] Ajouter des métriques Prometheus pour les constructions (temps moyen, taux de blocage, etc.)
- [ ] Implémenter une persistance Redis pour survivre aux redémarrages
- [ ] Ajouter des tests automatisés pour le système de synchronisation
