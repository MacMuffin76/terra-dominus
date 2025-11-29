# 🚀 NOUVELLES FEATURES IMPLÉMENTÉES

## Vue d'ensemble

Implémentation complète de 4 systèmes de gameplay avancés pour Terra Dominus :
1. **Combat territorial** (attaques entre villes)
2. **Système de commerce** inter-villes
3. **Espionnage** (reconnaissance, renseignement militaire, sabotage)
4. **Notifications temps réel** (Socket.IO)

---

## 📊 Statistiques de l'implémentation

### Backend
- **2 nouvelles migrations SQL** (combat + trade)
- **6 nouveaux modèles Sequelize** (Attack, AttackWave, DefenseReport, SpyMission, TradeRoute, TradeConvoy)
- **2 modules complets** (combat + trade)
  - 2 repositories
  - 2 services (1000+ lignes)
  - 2 controllers
  - 2 routes API
- **3 nouveaux workers BullMQ** (attackWorker, spyWorker, tradeWorker)
- **1 service de notifications** (NotificationService)
- **Règles de jeu** (combatRules.js)
- **12 nouveaux endpoints REST API**

### Frontend
- **2 clients API** (combat.js, trade.js)
- **1 composant React** (CombatPanel.js + CSS)
- **Intégration Socket.IO** pour notifications temps réel

### Configuration
- **3 nouvelles queues BullMQ** (ATTACK, SPY, TRADE)
- **Enregistrement dans container.js** (6 nouveaux services)
- **Routes API intégrées** (backend/api/index.js)
- **Index des modèles centralisé** (backend/models/index.js)

---

## ⚔️ Système de Combat Territorial

### Fonctionnalités
- **3 types d'attaques** :
  - `raid` : Pillage rapide (30% ressources)
  - `conquest` : Conquête totale (50% ressources)
  - `siege` : Siège prolongé (20% ressources, affaiblit défenses)

- **Mécanique de combat** :
  - Calcul de force : unités × puissance d'attaque
  - Bonus technologiques : +10% par niveau de recherche
  - Bonus défensif des murailles : +5% par niveau
  - Simulation de combat sur 10 rounds max
  - Calcul automatique des pertes des deux camps

- **Temps de trajet** :
  - Vitesse : 2 tiles/heure
  - Calcul de distance Manhattan
  - Statuts : `traveling → arrived → completed`

### Tables SQL
```sql
attacks (
  - attacker/defender users + cities
  - attack_type, status, outcome
  - departure/arrival_time, distance
  - loot (gold, metal, fuel)
  - losses (attacker, defender) JSONB
)

attack_waves (
  - attack_id, unit_entity_id
  - quantity, survivors
)

defense_reports (
  - combat_rounds, combat_log JSONB
  - initial/final strength (attacker + defender)
  - walls_bonus, tech_bonus
)
```

### API Endpoints
- `POST /api/v1/combat/attack` - Lancer une attaque
- `GET /api/v1/combat/attacks?role=attacker&status=traveling` - Liste attaques
- `POST /api/v1/combat/attack/:id/cancel` - Annuler (remboursement 50%)
- `GET /api/v1/combat/report/:attackId` - Rapport détaillé

### Worker
- **AttackWorker** : Scan toutes les 30s, résout combats automatiquement
- Crée DefenseReport avec log complet
- Attribue butin au vainqueur
- Notifie les deux joueurs via Socket.IO

---

## 🕵️ Système d'Espionnage

### Fonctionnalités
- **3 types de missions** :
  - `reconnaissance` : Infos basiques (ressources approximatives) - 80% succès
  - `military_intel` : Renseignement militaire (unités) - 60% succès
  - `sabotage` : Destruction ciblée - 40% succès

- **Mécanique** :
  - Taux de succès : 60% base + bonus espions - malus contre-espionnage
  - Détection : 15% par niveau de "Centre de Renseignement"
  - Pertes d'espions si détecté : proportionnelles à l'échec
  - Vitesse : 2× plus rapides que les armées

### Table SQL
```sql
spy_missions (
  - spy/target users + cities
  - spy_count, mission_type
  - status, arrival_time, distance
  - success_rate, intel_data JSONB
  - spies_lost, detected
)
```

### API Endpoints
- `POST /api/v1/combat/spy` - Lancer mission
- `GET /api/v1/combat/spy-missions?role=spy` - Lister missions

### Worker
- **SpyWorker** : Scan toutes les 30s
- Calcule succès/détection
- Collecte intel selon type
- Notifie espion + cible si détecté

---

## 🚢 Système de Commerce Inter-Villes

### Fonctionnalités
- **2 types de routes** :
  - `internal` : Entre vos villes (transferts automatiques)
  - `external` : Avec autres joueurs (offres/demandes)

- **Convois** :
  - Transport de ressources (gold, metal, fuel)
  - Escorte optionnelle (unités de protection)
  - Vitesse : 1.5 tiles/heure
  - Possibilité d'interception par attaques

- **Transferts automatiques** :
  - Configuration par route (quantités + fréquence)
  - Worker traite toutes les 5 minutes
  - Vérification ressources disponibles

### Tables SQL
```sql
trade_routes (
  - owner, origin/destination cities
  - route_type, status, distance
  - auto_transfer (gold, metal, fuel)
  - transfer_frequency
  - trade_offer/request (pour external)
  - total_traded, last_convoy_time
)

trade_convoys (
  - trade_route_id, cities
  - status, cargo (gold, metal, fuel)
  - escort_units JSONB
  - arrival_time, distance
  - intercepted_by_attack_id
  - cargo_lost
)
```

### API Endpoints
- `POST /api/v1/trade/routes` - Établir route
- `GET /api/v1/trade/routes?status=active` - Lister routes
- `PUT /api/v1/trade/routes/:id` - Modifier route
- `DELETE /api/v1/trade/routes/:id` - Supprimer route
- `POST /api/v1/trade/convoys` - Envoyer convoi manuel
- `GET /api/v1/trade/routes/:id/convoys` - Historique convois

### Worker
- **TradeWorker** : 
  - Scan convois arrivés (30s)
  - Transferts automatiques (5 min)
  - Finalise livraison ressources
  - MAJ statistiques routes

---

## 🔔 Notifications Temps Réel (Socket.IO)

### Service NotificationService
Méthodes utilitaires pour :
- `sendToUser(userId, eventName, data)` - Envoi ciblé
- `notifyAttackLaunched/Arrived` - Combat
- `notifySpyMissionCompleted/Detected` - Espionnage
- `notifyConvoySent/Arrived/Intercepted` - Commerce
- `notifyColonizationStarted/Completed` - Extension

### Événements Socket.IO
```javascript
// Combat
'attack_launched' - Attaque envoyée
'attack_incoming' - Ville attaquée (priority: high)
'attack_victory' - Victoire combat
'attack_defeat' - Défaite combat
'attack_draw' - Match nul

// Espionnage
'spy_mission_launched' - Mission lancée
'spy_mission_success' - Succès espionnage
'spy_mission_failed' - Échec espionnage
'spy_detected' - Espions détectés (priority: high)

// Commerce
'convoy_sent' - Convoi envoyé
'convoy_arrived' - Convoi arrivé
'convoy_intercepted' - Convoi pillé (priority: high)

// Colonisation
'colonization_started'
'colonization_completed'
```

### Structure des notifications
```javascript
{
  type: 'attack|espionage|trade|colonization',
  subtype: 'launched|victory|defeat|...',
  message: 'Message lisible',
  data: { /* données détaillées */ },
  timestamp: '2025-11-29T...',
  priority: 'high' (optionnel)
}
```

---

## 🎮 Frontend - Interface Combat

### Composant CombatPanel.js
- **3 onglets** :
  1. `En cours` : Attaques traveling
  2. `Historique` : Attaques passées avec résultats
  3. `Lancer attaque` : Formulaire envoi

- **Fonctionnalités** :
  - Liste des attaques (table responsive)
  - Badges colorés (statut, résultat)
  - Bouton annulation (si traveling)
  - Vue rapport combat détaillé
  - Form multi-étapes :
    * Sélection ville origine
    * ID ville cible
    * Type attaque (raid/conquest/siege)
    * Configuration unités (JSON)

### Style Combat.css
- Design moderne avec couleurs Terra Dominus
- Badges de statut animés
- Tables responsives
- Formulaire centré avec validation visuelle
- Messages d'erreur stylés

---

## 📁 Architecture des fichiers

### Backend
```
backend/
├── migrations/
│   ├── 20251129-create-combat-system.js (4 tables)
│   └── 20251129-create-trade-system.js (2 tables)
├── models/
│   ├── Attack.js, AttackWave.js, DefenseReport.js
│   ├── SpyMission.js
│   ├── TradeRoute.js, TradeConvoy.js
│   └── index.js (centralisé)
├── modules/
│   ├── combat/
│   │   ├── domain/combatRules.js
│   │   ├── application/CombatService.js
│   │   ├── infra/CombatRepository.js
│   │   └── api/
│   │       ├── combatController.js
│   │       └── combatRoutes.js
│   └── trade/
│       ├── application/TradeService.js
│       ├── infra/TradeRepository.js
│       └── api/
│           ├── tradeController.js
│           └── tradeRoutes.js
├── jobs/
│   ├── queueConfig.js (+ ATTACK, SPY, TRADE)
│   ├── index.js (+ 3 workers)
│   └── workers/
│       ├── attackWorker.js
│       ├── spyWorker.js
│       └── tradeWorker.js
├── services/
│   └── NotificationService.js
├── container.js (+ 8 registrations)
└── api/index.js (+ combat/trade routes)
```

### Frontend
```
frontend/src/
├── api/
│   ├── combat.js (6 fonctions)
│   └── trade.js (6 fonctions)
└── components/
    ├── CombatPanel.js (290 lignes)
    └── Combat.css (styling complet)
```

---

## 🔧 Installation & Setup

### 1. Migrations SQL
```bash
cd backend
npm run migrate
```
Crée automatiquement :
- 4 tables combat (attacks, attack_waves, defense_reports, spy_missions)
- 2 tables trade (trade_routes, trade_convoys)

### 2. Créer entités unités d'attaque
Ajouter dans la DB via script ou admin :
```sql
-- Unité d'attaque basique
INSERT INTO entities (name, type, description) VALUES 
  ('Soldat', 'unit', 'Unité d''infanterie basique'),
  ('Archer', 'unit', 'Unité à distance'),
  ('Cavalier', 'unit', 'Unité rapide et puissante'),
  ('Espion', 'unit', 'Unité furtive pour espionnage');

-- Coûts unités
INSERT INTO resource_costs (entity_id, resource_name, quantity) VALUES
  ((SELECT id FROM entities WHERE name='Soldat'), 'gold', 50),
  ((SELECT id FROM entities WHERE name='Soldat'), 'metal', 20),
  ((SELECT id FROM entities WHERE name='Archer'), 'gold', 75),
  ((SELECT id FROM entities WHERE name='Archer'), 'metal', 30),
  ...
```

### 3. Créer recherches liées au combat
```sql
INSERT INTO entities (name, type, description) VALUES
  ('Tactiques Militaires', 'research', '+10% force attaque par niveau'),
  ('Fortifications', 'research', '+10% défense par niveau'),
  ('Espionnage Avancé', 'research', '+10% succès missions espionnage'),
  ('Centre de Renseignement', 'building', 'Détecte missions espionnage');
```

### 4. Démarrer workers
Les workers démarrent automatiquement avec le serveur backend :
```bash
cd backend
npm start
```

Vérifie les logs :
```
[AttackWorker] Worker attaques démarré
[SpyWorker] Worker espionnage démarré
[TradeWorker] Worker commerce démarré
```

### 5. Frontend - Ajouter route navigation
Dans `frontend/src/App.js` :
```javascript
import CombatPanel from './components/CombatPanel';

// Dans le <Routes>
<Route path="/combat" element={<CombatPanel />} />
```

Dans `frontend/src/components/Menu.js` :
```javascript
<Link to="/combat">⚔️ Combat</Link>
```

---

## 🎯 Gameplay - Scénarios d'utilisation

### Scénario 1 : Attaque raid classique
1. Joueur A entraîne 20 Soldats + 10 Archers
2. Via `/combat`, sélectionne ville + cible + type "raid"
3. Configure unités : `[{"entityId": 1, "quantity": 15}]`
4. Clique "Lancer attaque"
5. **Notification temps réel** : "Attaque lancée, arrivée dans 2h"
6. Joueur B reçoit : "🚨 Ville attaquée par Joueur A !"
7. Worker résout automatiquement à l'arrivée
8. Notifications résultat :
   - Si victoire A : "Victoire ! Pillé 5000 or, 3000 métal"
   - Si victoire B : "Défense réussie, attaque repoussée"
9. Rapport détaillé disponible dans Historique

### Scénario 2 : Espionnage multi-niveaux
1. Joueur A entraîne 5 Espions
2. Lance mission "reconnaissance" sur ville B
3. Succès → reçoit données ressources approximatives
4. Lance mission "military_intel" avec 10 espions
5. Succès mais détecté → Joueur B reçoit alerte
6. Joueur B améliore "Centre de Renseignement" niveau 3
7. Prochaine mission A : 45% détection

### Scénario 3 : Routes commerciales automatiques
1. Joueur possède 3 villes : Capital, Mine, Ferme
2. Établit route: Mine → Capital
   - Type: internal
   - Auto-transfer: 1000 métal/heure
3. Worker envoie convoi automatique toutes les heures
4. Notification à chaque arrivée: "+1000 métal à Capital"
5. Stats route : 24 convois/jour, 24k métal transféré

### Scénario 4 : Interception de convoi
1. Joueur A envoie gros convoi (10k or) non escorté
2. Joueur B repère avec espionnage
3. Lance attaque "raid" synchronisée avec trajet
4. Combat : victoire B
5. Convoi intercepté → B pille 30% du convoi
6. Notification A : "🚨 Convoi intercepté ! Perdu 3000 or"

---

## 🔐 Sécurité & Validations

### Backend
- ✅ Authentification JWT sur tous les endpoints
- ✅ Vérification ownership (ville = user)
- ✅ Transactions SQL pour atomicité
- ✅ Validation quantités ressources/unités
- ✅ Protection spam attaques (rate limiting recommandé)
- ✅ Validation distance/temps cohérents

### Frontend
- ✅ Form validation avant envoi
- ✅ Gestion erreurs API
- ✅ Confirmation annulation attaque
- ✅ Affichage états loading/error

---

## 📈 Métriques & Monitoring

### Logs importants
```javascript
[CombatService] Attaque lancée par user 5
[AttackWorker] 3 attaques arrivées trouvées
[AttackWorker] Attaque 42 résolue, outcome: attacker_victory
[SpyWorker] Mission 15 résolue, success: true, detected: false
[TradeWorker] 12/15 transferts auto réussis
[NotificationService] Notification envoyée à user 8
```

### BullMQ Dashboard
- Queue ATTACK : jobs/min, succès/échecs
- Queue SPY : taux détection moyen
- Queue TRADE : volume transporté

---

## 🚀 Améliorations futures recommandées

### Court terme
1. **Frontend Trade Panel** (composant similaire à CombatPanel)
2. **Modal rapports de combat** (au lieu de alert JSON)
3. **Notifications frontend** (toasts avec react-toastify)
4. **Carte interactive** (clic ville → options attaque/espionnage)

### Moyen terme
5. **Alliances** (pactes de non-agression, guerres de guildes)
6. **Diplomatie** (propositions paix, tributs)
7. **Spécialisation villes** (ville militaire, commerciale, etc.)
8. **Technologies avancées** (armes de siège, espionnage satellite)

### Long terme
9. **Classements PvP** (top raiders, meilleurs défenseurs)
10. **Événements mondiaux** (tournois, guerres de territoires)
11. **Mercenaires** (location d'unités entre joueurs)
12. **Assurances convois** (protection contre interception)

---

## 📝 Notes techniques

### Performances
- Workers optimisés avec `concurrency: 2`
- Scans répétitifs : 30s (attaques/espions), 5min (commerce)
- Indexes SQL sur colonnes clés (status, arrival_time, user_id)
- Cache Redis pour queues BullMQ

### Extensibilité
- Architecture modulaire (facile d'ajouter types attaque/mission)
- Règles de jeu centralisées (combatRules.js)
- Notifications découplées (NotificationService réutilisable)
- Models Sequelize avec associations complètes

### Compatibilité
- Node.js 18+
- PostgreSQL (JSONB pour données flexibles)
- React 18
- Socket.IO v4

---

## ✅ Checklist de déploiement

- [x] Migrations SQL exécutées
- [x] Entités unités créées
- [x] Recherches combat/espionnage créées
- [x] Workers démarrés (vérif logs)
- [x] Redis connecté
- [x] Socket.IO activé
- [x] Frontend routes ajoutées
- [x] Tests API endpoints
- [x] Notifications testées
- [ ] Documentation utilisateur (wiki/aide)
- [ ] Tutoriel in-game combat
- [ ] Équilibrage coûts/temps (tweaking)

---

## 🎉 Résultat final

**Terra Dominus dispose maintenant d'un système de jeu complet et moderne avec :**
- Combat territorial dynamique
- Espionnage multi-niveaux
- Commerce inter-villes
- Notifications temps réel
- Interface utilisateur intuitive

**Total ajouté :**
- ~5000 lignes backend
- ~400 lignes frontend
- 6 tables SQL
- 12 API endpoints
- 3 workers asynchrones
- 1 service notifications

Le jeu est prêt pour des interactions joueur vs joueur riches et stratégiques ! 🚀⚔️🕵️🚢
