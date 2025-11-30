# 🌀 Système Portails PvE — Implémentation Complète

**Date:** 30 novembre 2025  
**Status:** ✅ **COMPLETE MVP** (Backend + Frontend)  
**Temps de développement:** 60h (30h backend + 30h frontend)  
**Inspiration:** Solo Leveling (système de donjons/Gates)

---

## 📋 Vue d'Ensemble

Le système Portails PvE est une implémentation complète d'un système de combat PvE inspiré du manga/anime Solo Leveling. Il offre aux joueurs des défis progressifs avec des récompenses croissantes et un système de maîtrise à long terme.

### Caractéristiques Principales

- **6 Tiers de Portails** : Gris (E) → Vert (D) → Bleu (C) → Violet (B) → Rouge (A) → Doré (S)
- **Spawn Automatique** : Cron job toutes les 2 heures avec chances variables par tier
- **Système de Maîtrise** : 5 niveaux (0-4) par tier avec bonus cumulatifs
- **Combat Tactique** : 3 tactiques (Équilibrée, Agressive, Défensive) avec modificateurs
- **Événements Mondiaux** : Portails Dorés rares avec récompenses légendaires
- **Progression Complète** : Historique, classements, statistiques

---

## 🏗️ Architecture Technique

### Backend (Node.js + Express + Sequelize)

```
backend/
├── modules/portals/
│   ├── domain/
│   │   ├── Portal.js                    # Entity portail
│   │   ├── PortalAttempt.js            # Tentative de combat
│   │   └── PortalMastery.js            # Progression joueur
│   ├── application/
│   │   ├── PortalService.js            # Logique métier
│   │   ├── PortalSpawnerService.js     # Génération portails
│   │   └── PortalCombatService.js      # Simulation combat
│   └── infra/
│       ├── SequelizeRepositories/
│       │   ├── PortalRepository.js
│       │   ├── PortalAttemptRepository.js
│       │   └── PortalMasteryRepository.js
│       └── cron/
│           ├── portalSpawner.js        # Spawn automatique
│           ├── portalExpiry.js         # Nettoyage expirés
│           └── portalCleanup.js        # Maintenance
├── controllers/
│   └── portalController.js             # API endpoints
├── routes/
│   └── portals.js                      # Routes Express
└── docs/modules/
    └── PORTAL_SYSTEM_DESIGN.md         # Design complet
```

### Frontend (React + Material-UI)

```
frontend/
├── src/
│   ├── pages/
│   │   ├── Portals.jsx                 # Page principale (3 tabs)
│   │   └── Portals.css                 # Styles dark theme
│   ├── components/portals/
│   │   ├── PortalCard.jsx              # Carte portail dans grid
│   │   ├── PortalCard.css
│   │   ├── PortalDetailModal.jsx       # Vue détaillée + attaque
│   │   ├── PortalDetailModal.css
│   │   ├── PortalAttackForm.jsx        # Sélection unités/tactiques
│   │   ├── PortalAttackForm.css
│   │   ├── PortalBattleEstimation.jsx  # Prédiction bataille
│   │   ├── PortalBattleEstimation.css
│   │   ├── PortalMasteryPanel.jsx      # Progression par tier
│   │   ├── PortalMasteryPanel.css
│   │   ├── PortalHistoryPanel.jsx      # Historique combats
│   │   ├── PortalHistoryPanel.css
│   │   └── index.js                    # Barrel exports
│   ├── api/
│   │   └── portals.js                  # Client API
│   └── App.js                          # Routing /portals
└── e2e/
    └── portals.spec.js                 # Tests E2E (15 scénarios)
```

---

## 🎮 Fonctionnalités Implémentées

### 1. Système de Portails (Backend)

#### 1.1 Configuration par Tier

| Tier | Rank | Fréquence Spawn | Durée Vie | Chance Spawn | Puissance Min | Récompenses |
|------|------|----------------|-----------|--------------|---------------|-------------|
| **Gris** | E | Très élevée | 4h | 60% | 500 | 100-300 gold/food |
| **Vert** | D | Élevée | 6h | 40% | 1500 | 300-800 gold/metal |
| **Bleu** | C | Moyenne | 8h | 25% | 4000 | 800-1500 + T2 resources |
| **Violet** | B | Faible | 12h | 15% | 10000 | 1500-3000 + rare items |
| **Rouge** | A | Très faible | 24h | 8% | 25000 | 3000-6000 + legendary |
| **Doré** | S | Événement | 1h | 2% | 50000+ | Epic rewards + cosmetics |

#### 1.2 Spawning Automatique

**Cron Job:** Toutes les 2 heures (configurable)

```javascript
// Logique de spawn
for (const tier of TIERS) {
  const roll = Math.random();
  if (roll <= tier.spawnChance) {
    const portal = await spawnPortal({
      tier: tier.name,
      coordinates: generateRandomCoords(),
      difficulty: calculateDifficulty(tier),
      expiryTime: Date.now() + tier.duration,
      globalEvent: (tier.name === 'golden')
    });
  }
}
```

**Coordonnées:** Génération aléatoire dans bounds (-500, 500) avec vérification collision

#### 1.3 Combat Service

**Calcul Puissance Joueur:**
```javascript
const unitPower = {
  infantry: 5,
  tank: 20,
  artillery: 15,
  apc: 12,
  helicopter: 25,
  fighter: 30
};

let playerPower = 0;
for (const [type, count] of Object.entries(units)) {
  playerPower += unitPower[type] * count;
}

// Tactical modifiers
switch (tactic) {
  case 'aggressive': playerPower *= 1.2; break;
  case 'defensive': playerPower *= 0.9; break;
  default: playerPower *= 1.0; // balanced
}
```

**Simulation Bataille:**
```javascript
const powerRatio = playerPower / portalPower;
const randomFactor = 0.85 + Math.random() * 0.3; // ±15%

const victory = (powerRatio * randomFactor) >= 0.95;

if (victory) {
  // Calculate losses (10-30% of sent units)
  // Grant rewards based on tier
  // Update mastery progression
} else {
  // High losses (50-80%)
  // Small consolation rewards
}
```

#### 1.4 Système de Maîtrise

**5 Niveaux par Tier:**

| Niveau | Nom | Clears Requis | Bonus Récompenses | Réduction Coût | Badge |
|--------|-----|---------------|-------------------|----------------|-------|
| 0 | Novice | 0 | 0% | 0% | 🔒 |
| 1 | Apprenti | 10 | +10% | -5% | 🥉 |
| 2 | Adepte | 25 | +20% | -10% | 🥈 |
| 3 | Expert | 50 | +30% | -15% | 🥇 |
| 4 | Maître | 100 | +50% | -20% | 👑 |

**Progression:** Chaque victoire incrémente compteur, déblocage automatique niveaux

### 2. API Endpoints (10 endpoints)

| Méthode | Route | Description | Auth |
|---------|-------|-------------|------|
| GET | `/api/v1/portals` | Liste portails actifs + filtres | ✅ |
| GET | `/api/v1/portals/:id` | Détail portail spécifique | ✅ |
| POST | `/api/v1/portals/:id/attack` | Attaquer portail | ✅ |
| POST | `/api/v1/portals/:id/estimate` | Estimer bataille | ✅ |
| GET | `/api/v1/portals/mastery` | Maîtrise joueur (tous tiers) | ✅ |
| GET | `/api/v1/portals/history` | Historique batailles | ✅ |
| GET | `/api/v1/portals/leaderboard` | Classements par tier | ✅ |
| GET | `/api/v1/portals/events` | Portails dorés actifs | ✅ |
| POST | `/api/v1/portals/admin/spawn` | Spawn manuel (admin) | 🔒 Admin |
| GET | `/api/v1/portals/admin/stats` | Statistiques spawning | 🔒 Admin |

**Exemples de requêtes:**

```javascript
// GET /api/v1/portals?tier=blue&minDifficulty=3&maxDifficulty=7&sortBy=difficulty
{
  "portals": [
    {
      "portal_id": 123,
      "tier": "blue",
      "difficulty": 6,
      "recommended_power": 5000,
      "x_coordinate": 120,
      "y_coordinate": -80,
      "expiry_time": "2025-11-30T18:00:00Z",
      "enemy_composition": { "infantry": 100, "tank": 50 },
      "rewards": { "gold": 1200, "titanium": 50 }
    }
  ],
  "count": 5
}

// POST /api/v1/portals/123/attack
{
  "units": {
    "infantry": 150,
    "tank": 75,
    "artillery": 30
  },
  "tactic": "aggressive"
}

// Response:
{
  "result": "victory",
  "losses": { "infantry": 25, "tank": 10 },
  "rewards": { "gold": 1500, "titanium": 65, "xp": 120 },
  "mastery_update": {
    "tier": "blue",
    "new_level": 2,
    "total_clears": 27
  }
}
```

### 3. Frontend UI (9 composants)

#### 3.1 Page Principale (`Portals.jsx`)

**3 Tabs:**
1. **Portails Actifs** - Grid de portails avec filtres
2. **Maîtrise** - Progression par tier
3. **Historique** - Log des batailles

**Filtres:**
- Tier: Dropdown (Tous | Gris | Vert | Bleu | Violet | Rouge | Doré)
- Difficulté: Range sliders (1-10)
- Tri: Par expiry | difficulté | puissance

**Auto-refresh:** setInterval 30 secondes

#### 3.2 PortalCard

**Affichage:**
- Badge tier (E/D/C/B/A/S) avec couleur
- Difficulty stars (⭐ × difficulty)
- Puissance recommandée (formatée)
- Coordonnées (x, y)
- Temps restant (countdown)
- Badge événement mondial (si applicable)

**Animations:**
- Hover: translateY(-5px) + glow
- Golden portals: Pulse animation continue
- Expiring soon (<1h): Red blink animation

#### 3.3 PortalDetailModal

**Sections:**
1. **Info Portail:** Tier, difficulty, power, position, expiry
2. **Composition Ennemie:** Liste types unités + quantités
3. **Récompenses Attendues:** Resources + items
4. **Configuration Attaque:** PortalAttackForm component
5. **Estimation Bataille:** PortalBattleEstimation component (auto-update)

**Actions:**
- Estimer (debounced 500ms)
- Attaquer (confirmation)
- Annuler

#### 3.4 PortalAttackForm

**Inputs Unités:** 6 types avec number inputs
**Presets:**
- 🗑️ Clear: Reset all to 0
- ⚖️ Balanced: 100 de chaque
- 🪖 Ground: Terrestre seulement
- ✈️ Air: Aérien seulement

**Tactiques:** 3 radio buttons avec descriptions

**Total Counter:** Affichage dynamique somme unités

#### 3.5 PortalBattleEstimation

**Power Bars:**
- Joueur (cyan gradient)
- Portail (orange gradient)
- Ratio affiché (×0.85 à ×3.0)

**Verdict:**
- ✅ Victoire probable (ratio ≥1.2) - Vert
- ⚠️ Combat équilibré (0.8-1.2) - Jaune
- ❌ Risque élevé (<0.8) - Rouge

**Pertes Estimées:** Breakdown par type unité

**Conseil Stratégique:** Message contextuel selon ratio

#### 3.6 PortalMasteryPanel

**6 Tier Cards:**
- Header avec rank + nom tier
- Icône mastery level + nom (Novice→Maître)
- Progress bar vers next level (ou badge MAX)
- Stats: Total clears | Bonus rewards | Cost reduction | Fastest time

**Refresh Button:** Reload mastery data

#### 3.7 PortalHistoryPanel

**Table Historique:**
- Date | Portail (tier badge) | Résultat (✅/❌) | Unités envoyées | Pertes | Récompenses

**Filtres:**
- Résultat: Tous | Victoires | Défaites
- Tier: Tous | Gris→Doré

**Summary Stats:**
- Total combats
- Victoires (count + %)
- Défaites (count + %)
- Taux de victoire (%)

**Load More:** Pagination si >20 records

---

## 🎨 Design System

### Couleurs par Tier

```css
:root {
  --tier-grey: #808080;
  --tier-green: #00FF00;
  --tier-blue: #0099FF;
  --tier-purple: #9933FF;
  --tier-red: #FF0000;
  --tier-golden: #FFD700;
}
```

### Thème Principal

- **Background:** linear-gradient(135deg, #0A0E27 0%, #151B3B 100%)
- **Accent Primary:** #00D9FF (cyan)
- **Accent Secondary:** #FF6B35 (orange)
- **Success:** #00FF00
- **Warning:** #FFD700
- **Error:** #FF0000

### Animations

**Golden Pulse:**
```css
@keyframes golden-pulse {
  0%, 100% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.4); }
  50% { box-shadow: 0 0 40px rgba(255, 215, 0, 0.8); }
}
```

**Shine Effect:**
```css
@keyframes shine {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

---

## 🧪 Tests

### E2E Playwright (15 scénarios)

**Coverage:**
- T1-T3: Navigation, filtres, tri
- T4-T8: Détail modal, configuration attaque, estimation, exécution
- T9-T11: Maîtrise, historique, filtres
- T12-T15: Événements spéciaux, auto-refresh, warnings, responsive

**API Tests (5 scénarios):**
- API-T1 à API-T5: Endpoints CRUD + auth

**Commandes:**
```bash
# Run all portal tests
npm run test:e2e -- portals.spec.js

# Run specific test
npm run test:e2e -- portals.spec.js -g "T5: Configure attack"

# Run with UI
npm run test:e2e -- portals.spec.js --headed
```

---

## 🚀 Déploiement

### Variables d'Environnement

```env
# Backend
PORTAL_SPAWN_INTERVAL=7200000  # 2h en ms
PORTAL_EXPIRY_INTERVAL=1800000 # 30min
PORTAL_CLEANUP_HOUR=3          # 3AM cleanup

# Frontend
REACT_APP_API_URL=http://localhost:5000/api/v1
```

### Cron Jobs Status

Vérifier les logs au démarrage:
```
✅ Portal cron jobs started
- Spawner: Every 2 hours
- Expiry checker: Every 30 minutes
- Cleanup: Daily at 3 AM
```

---

## 📊 Métriques & KPIs

### À Suivre

| Métrique | Objectif | Importance |
|----------|----------|------------|
| **Portails actifs moyens** | 10-20 | Engagement |
| **Taux d'attaque** | >60% des portails | Utilisation |
| **Taux de victoire** | 40-60% | Équilibre |
| **Progression mastery** | >2 niveaux/joueur | Rétention |
| **Temps moyen par session** | +10min | Engagement |

### Dashboard Grafana (à créer)

```promql
# Portals spawned per hour
sum(rate(portals_spawned_total[1h])) by (tier)

# Attack success rate
sum(rate(portal_attacks_total{result="victory"}[1h])) 
/ 
sum(rate(portal_attacks_total[1h]))

# Active portals count
count(portals{status="active"})
```

---

## 🔮 Améliorations Futures

### Phase 3b: Méchaniques Avancées (25h)

1. **Boss Battles** (10h)
   - Phases multiples (30% HP, 50% HP triggers)
   - Attaques spéciales (AoE, stun)
   - Loot tables améliorées

2. **Co-op Raids** (8h)
   - Portails alliance (5+ joueurs)
   - Contribution tracking
   - Loot distribution équitable

3. **Portal Modifiers** (7h)
   - Buffs/debuffs aléatoires (ex: "Fortified", "Weakened")
   - Environnements spéciaux (désert, arctique)
   - Synergies unités bonus

### Phase 4: Quêtes Campagne (30h)

1. **Tutorial Quest Chain** (15h)
   - 10 quêtes guidées
   - Récompenses: Units + Gold + XP
   - Déblocage progressif tiers

2. **Storyline Principale** (15h)
   - 30 quêtes narratives
   - Boss uniques (nommés)
   - Cosmetics exclusifs

---

## ✅ Checklist Complétion MVP

- [x] Backend architecture (DDD modules)
- [x] Database schema (5 tables + indexes)
- [x] Spawning service (6 tiers configurables)
- [x] Combat simulation (tactics + randomness)
- [x] Mastery system (5 levels × 6 tiers)
- [x] Cron jobs (spawn/expiry/cleanup)
- [x] API endpoints (10 routes)
- [x] DI container registration
- [x] Frontend page structure (3 tabs)
- [x] Portal card component
- [x] Detail modal + attack form
- [x] Battle estimation
- [x] Mastery panel
- [x] History panel
- [x] Routing & navigation
- [x] API client integration
- [x] E2E test suite (15 scenarios)
- [x] Design system (dark theme)
- [x] Animations (golden, expiring, shine)
- [x] Responsive mobile
- [x] Auto-refresh mechanism

**Status: ✅ 100% COMPLETE**

---

## 📚 Références

- **Design Document:** `docs/modules/PORTAL_SYSTEM_DESIGN.md`
- **Strategic Roadmap:** `STRATEGIC_ROADMAP.md` (Phase 3, 51% complete)
- **E2E Tests:** `frontend/e2e/portals.spec.js`
- **Backend Tests:** Coverage incluse dans suites existantes

**Développé par:** MacMuffin76 Team  
**Roadmap Next:** Boss battles (25h) → Quêtes campagne (30h) → PvP balancing (40h)
