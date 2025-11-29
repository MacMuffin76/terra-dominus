# 🎯 TERRA DOMINUS — ROADMAP STRATÉGIQUE VERS UN MMO AAA NAVIGATEUR

**Date d'analyse :** 29 novembre 2025  
**Version projet :** 1.0.0 (Bêta, 0 joueurs actifs)  
**Analyste :** Game Designer Senior + Architecte Logiciel  
**Objectif :** Transformation d'un prototype technique en jeu MMO rentable et engageant

---

## 📊 EXECUTIVE SUMMARY

### État actuel : Fondations solides, gameplay incomplet

**Points forts techniques ✅**
- Architecture backend DDD propre et scalable
- Stack moderne : Node.js, React, PostgreSQL, Redis, BullMQ
- Système de combat temps réel fonctionnel avec Socket.IO
- Tests d'intégration (12/12 auth, coverage backend 80%+)
- CI/CD en place, documentation Swagger complète
- Patterns avancés : DI, transaction provider, optimistic locking

**Lacunes critiques bloquant l'adoption 🚨**
- **Gameplay ultra-limité** : OGame-like de 2005, pas de 2025
- **Boucle d'engagement faible** : pas de quêtes, événements, progression narrative
- **PvP déséquilibré** : pas de protection débutants, zerging, pas de diplomatie
- **Économie simple** : pas de marché joueurs, rareté, crafting, spécialisation
- **Absence de méta-jeu** : pas de saisons, classements, récompenses cosmétiques
- **UX/UI datée** : Material-UI 4, pas de tutoriel interactif, onboarding inexistant
- **Pas de contenu PvE** : 0 IA, 0 quêtes, 0 PNJ, 0 boss de monde
- **Monétisation absente** : 0 modèle économique défini

### Score de maturité produit : **3.5/10**

| Catégorie | Score | Commentaire |
|-----------|-------|-------------|
| **Architecture technique** | 8/10 | Excellente base, prête pour scale |
| **Gameplay Core Loop** | 2/10 | Basique, répétitif, pas de hook |
| **Contenu** | 1/10 | 6 bâtiments, combat binaire, 0 PvE |
| **Progression** | 3/10 | Recherches linéaires, pas de branches |
| **Social/Communautaire** | 1/10 | Pas d'alliances fonctionnelles, 0 chat |
| **Économie** | 2/10 | 4 ressources, pas de marché dynamique |
| **Rétention J1/J7/J30** | 1/10 | Aucun système de fidélisation |
| **Monétisation** | 0/10 | Aucun modèle défini |

**Verdict : Le moteur tourne, mais il n'y a pas de voiture.**

---

## 🔍 ANALYSE DÉTAILLÉE PAR PILIER

### 1. GAMEPLAY & GAME DESIGN 🎮

#### 1.1 Core Loop actuel (trop simple)

```
Construire Mine d'Or Lv.2 → Attendre 300s → Lancer raid → Pillage 500 or
    ↓
Répéter indéfiniment (ennui à J+3)
```

**Problèmes majeurs :**
- **Pas de décisions stratégiques** : tout est linéaire (plus de ressources = gagne toujours)
- **Pas de spécialisation** : toutes les villes identiques, pas de meta
- **Pas de risque/reward** : attaquer coûte peu, défendre impossible
- **Temps morts** : 90% du jeu = attendre que des timers finissent

#### 1.2 Core Loop cible (engageant)

```
[Exploration] Découvrir biome rare (Cratère de Titan) avec bonus Metal +50%
    ↓
[Décision] Coloniser (5000 or) OU vendre info à alliance (2000 or immédiat)
    ↓
[Spécialisation] Ville Minière (débloquer raffinerie T3) → produire Alliages Rares
    ↓
[Économie] Vendre sur marché 10 alliages = 5000 or (ou garder pour Super Tank)
    ↓
[Combat/Défense] Protéger route commerciale avec escorte OU rejoindre siège de Boss
    ↓
[Progression] XP Boss → débloquer tech "Boucliers Énergétiques" (avantage compétitif)
    ↓
[Social] Partager butin avec alliance → points influence → élection Dirigeant
    ↓
RÉPÉTER avec complexité croissante
```

**Différences clés :**
- Décisions à chaque étape (3+ options, pas 1)
- Systèmes interconnectés (économie ↔ combat ↔ progression)
- Interactions sociales valorisées (coopération > solo)
- Récompenses variées (cosmétiques, pouvoir, prestige)

---

### 2. SYSTÈMES MANQUANTS CRITIQUES 🚨

#### 2.1 Progression & Fidélisation (ROI : ★★★★★)

**Actuellement :** Rien. Joueur quitte après 2h.

**À implémenter IMMÉDIATEMENT :**

##### A) Système de Quêtes (Semaine 1-2)

```javascript
// backend/modules/quests/domain/questRules.js
const QUEST_CHAINS = {
  TUTORIAL: [
    { id: 1, title: "Premier Pas", objective: "build_mine_or_1", reward: { or: 500, xp: 10 } },
    { id: 2, title: "Exploration", objective: "explore_5_tiles", reward: { carburant: 200, xp: 20 } },
    { id: 3, title: "Combat Initiation", objective: "attack_npc_city", reward: { units: [{ type: "Infantry", qty: 5 }], xp: 50 } }
  ],
  DAILY: [
    { id: 101, title: "Collecteur Diligent", objective: "collect_resources_3000", reward: { premium_currency: 5 } },
    { id: 102, title: "Conquérant", objective: "win_1_attack", reward: { random_unit_blueprint: true } }
  ],
  WEEKLY: [
    { id: 201, title: "Maître Bâtisseur", objective: "upgrade_buildings_10", reward: { speedup_24h: 1, xp: 200 } }
  ]
};
```

**Impact attendu :**
- Rétention J1 : 20% → 45% (objectifs guidés)
- Rétention J7 : 5% → 25% (daily habits)
- Session length : 15min → 40min

##### B) Battle Pass / Saison (Semaine 3-4)

```javascript
// Saison 1 : "Guerre des Titans" (durée 60 jours)
const SEASON_REWARDS = {
  tier_1: { level: 1, reward: { cosmetic: "banner_bronze", premium_currency: 10 } },
  tier_10: { level: 10, reward: { unit_skin: "tank_desert_camo" } },
  tier_50: { level: 50, reward: { building_skin: "command_center_elite", title: "Général" } },
  tier_100: { level: 100, reward: { unique_unit: "Titan_Mk1", premium_currency: 500 } }
};
```

**Justification :** 
- Génère FOMO (Fear Of Missing Out)
- Modèle éprouvé (Fortnite, Dota 2, tous les F2P)
- Monétisation immédiate (Premium Battle Pass : 9.99€)

##### C) Système d'Achievements (Semaine 2)

```javascript
const ACHIEVEMENTS = {
  EXPLORER_BRONZE: { condition: "explore_100_tiles", reward: { title: "Éclaireur", xp: 100 } },
  WARLORD_GOLD: { condition: "win_attacks_100", reward: { unique_cosmetic: "general_helmet", xp: 1000 } },
  ECONOMIST: { condition: "trade_volume_1M", reward: { tax_reduction: 5, title: "Magnat" } }
};
```

**ROI estimé :** 
- **Coût dev :** 80h (1 dev × 2 semaines)
- **Gain rétention :** +30% J7, +50% J30
- **LTV augmente :** 0€ → 2.5€/joueur (avec Battle Pass)

---

#### 2.2 Économie & Boucle de Valeur (ROI : ★★★★☆)

**Problème actuel :** Économie locale uniquement, pas de sink (joueurs accumulent ressources infiniment).

**Solution : Économie à 3 niveaux**

##### A) Marché Dynamique Joueurs (Semaine 4-5)

```javascript
// backend/modules/market/domain/marketRules.js
const MARKET_MECHANICS = {
  TAX: 5, // 5% taxe sur chaque transaction (sink)
  PRICE_FLOORS: { or: 0.8, metal: 1.2, carburant: 2.0 }, // Prix min/max pour éviter manipulation
  PRICE_CEILINGS: { or: 1.5, metal: 2.5, carburant: 4.0 },
  ORDER_TYPES: ['limit', 'market', 'stop_loss'], // Profondeur stratégique
};

// Exemple ordre
POST /api/v1/market/orders
{
  "type": "limit",
  "action": "sell",
  "resource": "metal",
  "quantity": 10000,
  "price_per_unit": 1.5, // en "or" (monnaie de référence)
  "expires_at": "2025-12-01T00:00:00Z"
}
```

**Impact :**
- Spécialisation géographique (mines dans montagnes = avantage compétitif)
- Trading devient une voie de progression (pas obligé de combattre)
- Sink de ressources (taxes) régule inflation

##### B) Ressources Rares & Crafting (Semaine 6-7)

```javascript
// Nouvelles ressources T2
const RARE_RESOURCES = {
  titanium: { source: 'mountain_tiles_rare', rarity: 0.05 }, // 5% spawn
  plasma: { source: 'energy_facility_lv10+', production_rate: 0.1 },
  nanotubes: { source: 'research_lab_lv15+', research_only: true }
};

// Recettes de crafting
const BLUEPRINTS = {
  SUPER_TANK: {
    inputs: { metal: 5000, titanium: 200, plasma: 50 },
    duration: 7200, // 2h
    output: { unit: 'Heavy_Tank_Mk2', quantity: 1 }
  },
  ORBITAL_DEFENSE: {
    inputs: { metal: 10000, plasma: 500, nanotubes: 100 },
    duration: 86400, // 24h
    output: { building: 'Orbital_Laser', level: 1 }
  }
};
```

**ROI estimé :**
- **Coût dev :** 120h (1 dev backend + 1 dev frontend × 3 semaines)
- **Engagement :** +40% session time (nouveaux objectifs)
- **Monétisation :** Blueprints rares = récompenses Battle Pass Premium

##### C) Routes Commerciales Dynamiques (Déjà implémenté ✅, à améliorer)

**Ajouts nécessaires :**
- **Événements aléatoires** : convois attaqués par PNJ bandits (15% chance)
- **Taxation inter-villes** : villes alliées = 2% taxe, neutres = 10%
- **Optimisation IA** : suggestions de routes rentables basées sur prix marché

```javascript
// Événement aléatoire
socket.on('convoy_attacked', (data) => {
  // {
  //   convoyId: 123,
  //   attackers: [{ type: 'Bandit', quantity: 20 }],
  //   loot_at_risk: { metal: 5000 },
  //   options: ['send_escort', 'abandon_convoy', 'request_alliance_help']
  // }
});
```

---

#### 2.3 Combat & PvP Équilibré (ROI : ★★★★★)

**Problème actuel :** Zerging non puni, pas de protection débutants.

##### A) Bouclier Débutant (Semaine 1 - CRITIQUE)

```javascript
// backend/modules/combat/domain/combatRules.js
const PROTECTION_RULES = {
  NEW_PLAYER_SHIELD: {
    duration: 259200, // 3 jours (72h)
    conditions: {
      max_attacks_sent: 5, // Perd bouclier si attaque trop
      max_cities: 2,
      expires_at: 'account_creation + 3 days'
    }
  },
  RAID_COOLDOWN: {
    same_target: 3600, // 1h entre raids sur même cible
    total_daily_attacks: 20 // Max 20 attaques/jour pour éviter spam
  }
};
```

**Justification :** Sans cela, 80% des nouveaux quittent à J1 après raid écrasant.

##### B) Factions & Guerre de Territoire (Semaine 8-10)

```javascript
// 3 factions avec bonus uniques
const FACTIONS = {
  TERRAN_FEDERATION: {
    bonus: { defense: 1.15, building_speed: 1.1 },
    capital: { x: 50, y: 50 },
    lore: "Humains technologues, maîtres de la défense"
  },
  NOMAD_RAIDERS: {
    bonus: { attack: 1.2, movement_speed: 1.15 },
    capital: { x: 150, y: 50 },
    lore: "Pillards du désert, mobilité extrême"
  },
  INDUSTRIAL_SYNDICATE: {
    bonus: { production: 1.25, trade_tax: 0.5 },
    capital: { x: 100, y: 150 },
    lore: "Commerçants industriels, domination économique"
  }
};

// Territoires contrôlés = bonus faction-wide
const CONTROL_ZONES = {
  CENTRAL_HIGHLANDS: {
    controlled_by: 'TERRAN_FEDERATION',
    bonus_all_faction: { metal: 1.1 }, // Tous les Terrans +10% métal
    control_points: 1250 // Seuil pour capturer
  }
};
```

**Impact :**
- Crée des alliés "naturels" (même faction)
- Objectifs collectifs (capturer territoires)
- Meta-jeu à long terme (domination de faction)

##### C) Système de Siège & Boss de Monde PvE (Semaine 11-12)

```javascript
// PNJ Boss avec HP partagé
const WORLD_BOSSES = {
  TITAN_ALPHA: {
    location: { x: 200, y: 200 },
    hp: 10000000, // 10M HP (nécessite 100+ joueurs)
    phases: [
      { hp_threshold: 75, unlocks: 'weak_points', damage_multiplier: 1.5 },
      { hp_threshold: 50, spawns: 'reinforcements', adds: [{ type: 'Elite_Guard', qty: 50 }] },
      { hp_threshold: 25, mode: 'berserk', boss_damage: 2.0 }
    ],
    loot_table: {
      guaranteed: { blueprint_legendary: 'Titan_Chassis', premium_currency: 100 },
      top_10_damage: { unique_title: 'Titan Slayer', cosmetic: 'titan_armor_skin' }
    },
    respawn: 604800 // 7 jours
  }
};
```

**ROI :**
- **Coût dev :** 160h (2 devs × 4 semaines)
- **Engagement communautaire :** Events hebdomadaires = pics de connexion prévisibles
- **Rétention :** +50% J30 (objectifs long-terme collectifs)

---

#### 2.4 UX/UI & Onboarding (ROI : ★★★★★)

**Problème :** Courbe d'apprentissage brutale, UI Material-UI datée.

##### A) Tutoriel Interactif (Semaine 1-2 - CRITIQUE)

```javascript
// frontend/src/components/tutorial/TutorialOverlay.js
const TUTORIAL_STEPS = [
  {
    step: 1,
    target: '#resources-widget',
    title: 'Vos Ressources',
    message: 'Collectez Or, Métal, Carburant pour construire votre empire.',
    highlight: true,
    action: { type: 'wait_click', next: 2 }
  },
  {
    step: 2,
    target: '#menu-resources',
    title: 'Bâtiments de Production',
    message: 'Cliquez ici pour améliorer vos mines.',
    action: { type: 'navigate', route: '/resources', next: 3 }
  },
  {
    step: 5,
    target: '.unit-card',
    title: 'Entraîner des Unités',
    message: 'Construisez une armée pour défendre et conquérir.',
    reward: { units: [{ type: 'Infantry', qty: 10 }], or: 1000 },
    action: { type: 'complete_action', action: 'train_unit', next: 6 }
  }
];
```

**Impact :**
- Complétion tutoriel : 15% → 75%
- Rétention J1 : 20% → 60%

##### B) UI Redesign (Semaine 15-18)

**Migration Material-UI 4 → MUI 5 + Thème Dark Custom**

```javascript
// frontend/src/theme.js
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#00D9FF' }, // Cyan néon
    secondary: { main: '#FF6B35' }, // Orange militaire
    background: {
      default: '#0A0E27',
      paper: '#151B3B'
    }
  },
  typography: {
    fontFamily: '"Rajdhani", "Roboto", sans-serif', // Police militaire
    h1: { fontSize: '3rem', fontWeight: 700, letterSpacing: '0.1em' }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 0, // Boutons carrés type RTS
          textTransform: 'uppercase',
          boxShadow: '0 0 20px rgba(0,217,255,0.3)' // Glow effect
        }
      }
    }
  }
});
```

**Inspirations visuelles :**
- **Starcraft II** (UI RTS, clarté info)
- **EVE Online** (complexité élégante)
- **Dune: Spice Wars** (couleurs désertiques)

##### C) Animations & Feedback (Semaine 16-17)

```javascript
// Animations Framer Motion
import { motion, AnimatePresence } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, scale: 0.8 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 0.8 }}
  transition={{ type: 'spring', stiffness: 300 }}
>
  <BuildingCard {...props} />
</motion.div>
```

**Feedback audio :** Sons pour actions critiques
- Click bouton : `clic_metal.mp3` (30ms)
- Construction complète : `construction_complete.wav` (2s)
- Attaque lancée : `alarm.mp3` (3s)

---

#### 2.5 Social & Communautaire (ROI : ★★★☆☆)

**Actuellement :** Alliance vide (code existe mais 0 fonctionnalités).

##### A) Système d'Alliance Complet (Semaine 6-8)

```javascript
// backend/modules/alliances/domain/allianceRules.js
const ALLIANCE_FEATURES = {
  ROLES: ['Leader', 'Officer', 'Member', 'Recruit'],
  PERMISSIONS: {
    Leader: ['invite', 'kick', 'declare_war', 'manage_treasury'],
    Officer: ['invite', 'manage_research_pool'],
    Member: ['donate_resources', 'participate_wars']
  },
  ALLIANCE_BONUSES: {
    members_10: { bonus: { production: 1.05 }, unlocks: 'alliance_chat' },
    members_50: { bonus: { production: 1.1 }, unlocks: 'alliance_territory' },
    members_100: { bonus: { production: 1.15 }, unlocks: 'alliance_superweapon' }
  },
  ALLIANCE_WARS: {
    declaration_cost: 50000, // or
    duration: 604800, // 7 jours
    victory_conditions: ['destroy_enemy_cities_50%', 'control_territory_80%', 'economic_dominance']
  }
};
```

##### B) Chat Global + Alliance (Semaine 5-6)

```javascript
// Socket.IO rooms
socket.join(`alliance_${allianceId}`);
socket.join('global_chat');

// Anti-spam
const CHAT_LIMITS = {
  global: { messages_per_min: 5, cooldown_violation: 300 },
  alliance: { messages_per_min: 10 }
};
```

**Modération :** Filtres auto (bad words) + système de report joueurs.

##### C) Classements & Leaderboards (Semaine 3)

```javascript
const LEADERBOARD_CATEGORIES = {
  TOP_POWER: { metric: 'total_power', rewards: { top_1: { title: 'Empereur', premium: 500 } } },
  TOP_ECONOMY: { metric: 'total_trade_volume', rewards: { top_1: { title: 'Titan Industriel', premium: 300 } } },
  TOP_ALLIANCE: { metric: 'alliance_total_power', rewards: { all_members: { cosmetic: 'alliance_banner' } } }
};
```

---

### 3. INFRASTRUCTURE & TECHNIQUE 🏗️

**État actuel :** Excellent (8/10). Quelques optimisations nécessaires pour scale.

#### 3.1 Scaling Horizontal (Semaine 20+, post-MVP)

**Problème anticipé :** 1000+ joueurs simultanés = surcharge Socket.IO sur instance unique.

**Solution :** Redis Adapter + Load Balancing

```javascript
// backend/server.js
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');

const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

await Promise.all([pubClient.connect(), subClient.connect()]);

io.adapter(createAdapter(pubClient, subClient));
```

**Déploiement :**
```yaml
# docker-compose.prod.yml
services:
  backend_1:
    image: terra-backend:latest
    environment:
      - REDIS_URL=redis://redis:6379
  backend_2:
    image: terra-backend:latest
    environment:
      - REDIS_URL=redis://redis:6379
  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    ports:
      - "80:80"
```

**ROI :** Capacité 100 CCU → 5000 CCU sans refonte code.

---

#### 3.2 Observabilité & Monitoring (Semaine 13-14)

**Ajouts nécessaires :**

##### A) Sentry (Frontend + Backend)

```javascript
// frontend/src/index.js
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% transactions
  beforeSend(event, hint) {
    // Filtrer erreurs non-critiques
    if (event.exception?.values?.[0]?.type === 'ChunkLoadError') {
      return null; // Ignorer erreurs de chunk loading
    }
    return event;
  }
});
```

##### B) Grafana + Prometheus Dashboards

**Métriques clés à monitorer :**
```promql
# Active users
sum(rate(http_requests_total{endpoint="/api/v1/dashboard"}[5m]))

# Attack success rate
sum(rate(attacks_completed{outcome="victory"}[1h])) / sum(rate(attacks_completed[1h]))

# Revenue per user (avec monétisation)
sum(payments_total) / count(users_active)
```

**Alertes Opsgenie/PagerDuty :**
- Latence P95 > 500ms (Severity: Warning)
- Error rate > 1% (Severity: Critical)
- Database connection pool > 90% (Severity: High)

---

#### 3.3 Tests E2E Playwright (Semaine 9)

**Scénarios critiques à couvrir :**

```javascript
// frontend/e2e/critical-paths.spec.js
test('Complete user journey: Register → Build → Attack → Win', async ({ page }) => {
  // 1. Register
  await page.goto('/register');
  await page.fill('#username', 'testplayer');
  await page.fill('#password', 'SecurePass123!');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');

  // 2. Build first mine
  await page.click('text=Ressources');
  await page.click('text=Mine d\'or >> button:has-text("Améliorer")');
  await expect(page.locator('.toast-success')).toContainText('Construction lancée');

  // 3. Train units
  await page.click('text=Entraînement');
  await page.fill('#quantity-infantry', '10');
  await page.click('button:has-text("Entraîner")');

  // 4. Launch attack
  await page.click('text=Carte du Monde');
  await page.click('.world-tile[data-npc="true"]'); // Cible PNJ
  await page.click('button:has-text("Attaquer")');
  await expect(page.locator('.attack-launched')).toBeVisible();
});
```

**ROI :** Détection bugs avant production = économie 10h debug/hotfix par semaine.

---

### 4. MONÉTISATION 💰

**Actuellement :** 0€/mois. AUCUN modèle.

#### 4.1 Modèle F2P Éthique (Non Pay-to-Win)

**Principe :** Valoriser le temps, pas la puissance.

##### A) Premium Currency : "Crédits Terra" (CT)

**Moyens d'obtention :**
- Achat direct : 100 CT = 0.99€, 1200 CT = 9.99€ (+20% bonus), 6500 CT = 49.99€ (+30%)
- Quêtes quotidiennes : 5 CT/jour (free)
- Achievements : 10-100 CT selon difficulté
- Battle Pass gratuit : 50 CT/saison

**Utilisations NON-P2W :**
```javascript
const CT_SHOP_ITEMS = {
  // Speedups (gain de temps, pas de puissance)
  speedup_1h: { cost: 10, item: 'construction_speedup', duration: 3600 },
  speedup_24h: { cost: 100, item: 'construction_speedup', duration: 86400 },
  
  // Cosmétiques
  building_skin_gold: { cost: 150, item: 'mine_or_skin_gold', permanent: true },
  unit_skin_elite: { cost: 200, item: 'tank_skin_elite', permanent: true },
  player_title_unique: { cost: 300, item: 'title_legend', permanent: true },
  
  // Commodité
  auto_collect_resources: { cost: 50, duration: 604800 }, // 7 jours
  second_construction_queue: { cost: 500, permanent: true },
  
  // Battle Pass Premium
  battle_pass_season_1: { cost: 999, rewards: 'premium_track_all' }
};
```

**Projections conservatrices (base 1000 joueurs actifs) :**
- 5% achètent Battle Pass (50 joueurs × 9.99€) = **500€/mois**
- 2% whales (20 joueurs × 50€/mois) = **1000€/mois**
- 10% achats ponctuels (100 joueurs × 5€/mois) = **500€/mois**

**Total :** **2000€/mois** (avec 1000 MAU) → **20k€/mois** à 10k MAU.

##### B) Subscription VIP (Optionnel)

```javascript
const VIP_TIERS = {
  BRONZE: {
    cost_monthly: 4.99,
    benefits: [
      'daily_ct_bonus: 10',
      'resource_production: +10%',
      'construction_speedup: +5%',
      'vip_badge: true'
    ]
  },
  GOLD: {
    cost_monthly: 9.99,
    benefits: [
      'daily_ct_bonus: 25',
      'resource_production: +20%',
      'construction_speedup: +10%',
      'exclusive_skins: 2/month',
      'priority_support: true'
    ]
  }
};
```

**Projections :**
- 3% souscrivent Bronze (30 × 4.99€) = **150€/mois**
- 1% souscrivent Gold (10 × 9.99€) = **100€/mois**

**Total subscription :** **+250€/mois** supplémentaires.

---

#### 4.2 Publicité (Revenus Passifs)

**Intégration éthique :** Opt-in uniquement.

```javascript
// Reward Ads (joueur choisit de regarder)
const AD_REWARDS = {
  watch_30s: { reward: { ct: 5, or: 1000 }, daily_limit: 5 }
};
```

**Revenus estimés :**
- 1000 joueurs × 50% regardent 2 ads/jour × $0.01 CPM = **$10/jour** = **300$/mois**

---

### 5. MARKETING & ACQUISITION 📢

**Problème :** 0 joueurs = 0 feedback = développement dans le vide.

#### 5.1 Soft Launch (Semaine 4 - URGENT)

**Objectif :** 100 alpha testers pour valider Core Loop.

**Canaux gratuits :**
1. **Reddit :**
   - r/WebGames, r/incremental_games, r/browserGames
   - Post : "I'm building a free MMO RTS in the browser, looking for testers"
   - Coût : 0€ | ROI : 50-200 signups

2. **Discord Communities :**
   - Serveurs RTS, OGame vétérans, communautés indé
   - Rejoindre + partager dans #showcase channels
   - Coût : 0€ | ROI : 30-100 signups

3. **Twitter/X :**
   - Thread avec GIFs gameplay, "built with Node.js + React"
   - Tags : #indiegame #webgame #mmo #gamedev
   - Coût : 0€ | ROI : 20-50 signups (si viral : 500+)

4. **Hacker News (Show HN) :**
   - "Show HN: Terra Dominus – Open-source MMO RTS built with Node.js"
   - Angle technique pour attirer devs (contributeurs potentiels)
   - Coût : 0€ | ROI : 200-1000 visites si frontpage

**Metrics à tracker :**
```javascript
// Google Analytics + Mixpanel
const FUNNEL_EVENTS = {
  landing_page_view: {},
  register_started: {},
  register_completed: {},
  tutorial_started: {},
  tutorial_completed: {},
  first_attack_launched: {},
  day_1_retention: {},
  day_7_retention: {}
};
```

---

#### 5.2 Growth Hacking (Semaine 8+)

##### A) Referral Program

```javascript
const REFERRAL_REWARDS = {
  referrer: { per_signup: { ct: 50 }, per_active_d7: { ct: 200 } },
  referee: { on_signup: { or: 5000, ct: 25, units: [{ type: 'Infantry', qty: 20 }] } }
};
```

**Impact :** Viralité coefficient 1.2 (chaque joueur amène 0.2 ami) = croissance exponentielle.

##### B) Contenu Créateurs (Streamers/YouTubers)

**Partenariats micro-influenceurs :**
- Recherche : YouTubers 5k-50k subs (gaming/indie)
- Proposition : Clés beta exclusive + cosmétiques custom alliance
- Coût : 0€ (échange visibilité)
- ROI : 1 vidéo = 500-5000 vues = 10-100 signups

##### C) SEO & Content Marketing

**Articles blog :**
- "How to Dominate in Terra Dominus: Beginner's Guide"
- "Best Defense Strategies for Your City"
- "Economics 101: Trading for Profit in Terra Dominus"

**Impact :** Long-terme (6+ mois), trafic organique gratuit.

---

### 6. FEATURES "AAA" VISIONNAIRES 🚀

Pour tendre vers un jeu premium, innovations différenciantes.

#### 6.1 IA Avancée (Semaine 16+)

**PNJ Dynamiques :** Pas de bots statiques, factions IA avec objectifs.

```javascript
const AI_FACTIONS = {
  DESERT_NOMADS: {
    behavior: 'raid_weak_cities',
    spawn_zones: ['desert_biomes'],
    escalation: {
      player_attacks_10: 'send_revenge_raid',
      player_attacks_50: 'declare_war_siege_capital'
    }
  },
  TECH_CULTISTS: {
    behavior: 'hoard_research_artifacts',
    unique_drops: ['blueprint_legendary'],
    peace_negotiation: { offer: 'trade_tech_for_resources' }
  }
};
```

**Machine Learning (Long-terme) :**
- **Matchmaking PvP :** Équilibrer attaques selon skill (TrueSkill algorithm)
- **Détection triche :** Anomaly detection (impossible production rates, etc.)
- **Recommandations personnalisées :** "Players like you enjoy Trading routes" (collaborative filtering)

---

#### 6.2 Météo Dynamique & Événements (Semaine 18+)

```javascript
const WORLD_EVENTS = {
  SOLAR_STORM: {
    frequency: 'weekly',
    duration: 3600, // 1h
    effects: {
      energy_production: 0, // Coupure électrique
      defense_systems: 0.5, // Défenses affaiblies
      loot: 'meteor_fragments_rare'
    },
    notification: '⚡ ALERTE : Tempête solaire détectée ! Systèmes électriques hors-ligne.'
  },
  RESOURCE_RUSH: {
    frequency: 'daily',
    duration: 7200, // 2h
    effects: {
      all_production: 2.0, // Double production
      attack_cost: 0.5 // Attaquer moins cher
    }
  }
};
```

**Impact :** Crée rythme imprévisible, évite routine ennuyeuse.

---

#### 6.3 Mod Support & Community Content (Semaine 25+)

**API publique pour mods :**

```javascript
// Exemple mod: "Building Pack - Medieval"
const MOD_MANIFEST = {
  id: 'medieval_buildings',
  version: '1.0.0',
  author: 'PlayerXYZ',
  assets: {
    buildings: [
      { name: 'Castle', image: 'castle.png', stats: { defense: 150 } }
    ]
  },
  hooks: {
    on_building_complete: (building) => {
      if (building.name === 'Castle') {
        grantAchievement('medieval_lord');
      }
    }
  }
};
```

**Marketplace mods :**
- Créateurs peuvent vendre cosmétiques custom (70% revenus créateur, 30% Terra Dominus)
- Exemple : Roblox, Steam Workshop

**ROI long-terme :** Communauté crée contenu gratuitement = engagement infini.

---

## 📅 ROADMAP PRIORISÉE (6 MOIS)

### 🔥 PHASE 1 : RETENTION CORE (Semaines 1-4) — CRITIQUE

**Objectif :** Transformer prototype en jeu jouable 1h+ sans ennui.

| Semaine | Tâche | Dev Hours | Priority | Impact Rétention |
|---------|-------|-----------|----------|------------------|
| 1 | Tutoriel interactif (10 steps) | 40h | P0 | +40% J1 |
| 1 | Bouclier débutant 72h | 20h | P0 | +60% J1 |
| 2 | Système Quêtes (Tutorial chain) | 60h | P0 | +30% J7 |
| 2 | Achievements (20 achievements) | 20h | P1 | +10% J7 |
| 3 | Battle Pass Saison 1 (structure) | 40h | P0 | +25% J30 |
| 3 | Leaderboards (3 catégories) | 20h | P1 | +15% J7 |
| 4 | Marché dynamique joueurs V1 | 80h | P0 | +20% J30 |

**Total :** 280h (1.75 dev full-time × 4 semaines) | **Budget :** 15k€ (salaires)

**KPIs cibles :**
- Rétention J1 : 20% → 50%
- Rétention J7 : 5% → 30%
- Session time : 15min → 45min

---

### 🚀 PHASE 2 : SOCIAL & ÉCONOMIE (Semaines 5-8)

**Objectif :** Créer interactions joueurs + meta-économie.

| Semaine | Tâche | Dev Hours | Priority | Impact |
|---------|-------|-----------|----------|--------|
| 5 | Chat global + alliance | 40h | P0 | Social foundation |
| 6 | Alliances complètes (roles, guerres) | 80h | P0 | +30% rétention |
| 6 | Ressources rares T2 (3 types) | 40h | P1 | Progression depth |
| 7 | Crafting/Blueprints (10 recipes) | 60h | P1 | Engagement loop |
| 8 | Factions & bonus territoriaux | 80h | P1 | Meta-jeu |

**Total :** 300h | **Budget :** 16k€

**KPIs cibles :**
- Rétention J30 : 10% → 35%
- Social interactions : 0 → 5 messages/jour/joueur
- % joueurs en alliance : 0% → 60%

---

### ⚔️ PHASE 3 : CONTENU PvE & ÉQUILIBRAGE (Semaines 9-12)

**Objectif :** PvP équilibré + contenu PvE engageant.

| Semaine | Tâche | Dev Hours | Priority | Impact |
|---------|-------|-----------|----------|--------|
| 9 | Tests E2E Playwright (10 scénarios) | 40h | P1 | Qualité |
| 10 | PNJ Boss de Monde (3 boss) | 80h | P0 | Events communautaires |
| 11 | IA Factions dynamiques (2 factions) | 60h | P1 | PvE richesse |
| 12 | Équilibrage PvP (cooldowns, matchmaking) | 40h | P0 | Fairness |

**Total :** 220h | **Budget :** 12k€

**KPIs cibles :**
- % joueurs participent events : 0% → 40%
- Satisfaction PvP (sondage) : 3/10 → 7/10

---

### 💎 PHASE 4 : POLISH & MONÉTISATION (Semaines 13-18)

**Objectif :** UX premium + revenues stream.

| Semaine | Tâche | Dev Hours | Priority | Impact |
|---------|-------|-----------|----------|--------|
| 13 | Sentry + Grafana monitoring | 30h | P1 | Ops stabilité |
| 14 | Audit UX + fixes prioritaires | 40h | P0 | Player satisfaction |
| 15-16 | UI Redesign (MUI 5, thème dark) | 120h | P0 | Perception qualité |
| 17 | Animations & Audio feedback | 60h | P1 | Juiciness |
| 18 | Shop CT + intégration paiement (Stripe) | 80h | P0 | **Monétisation** |

**Total :** 330h | **Budget :** 18k€

**KPIs cibles :**
- Conversion free → paying : 0% → 5%
- ARPU (Average Revenue Per User) : 0€ → 2€/mois

---

### 🌟 PHASE 5 : SCALING & AVANCÉ (Semaines 19-24)

**Objectif :** Supporter 5000+ CCU, features avancées.

| Semaine | Tâche | Dev Hours | Priority | Impact |
|---------|-------|-----------|----------|--------|
| 19-20 | Redis Adapter + Load Balancing | 60h | P1 | Scale 5000 CCU |
| 21 | Météo dynamique & événements | 40h | P2 | Engagement |
| 22 | Système de Siège prolongé | 60h | P1 | Depth PvP |
| 23 | Referral program | 30h | P1 | Growth viral |
| 24 | Analytics avancées (Mixpanel) | 20h | P2 | Data-driven |

**Total :** 210h | **Budget :** 11k€

---

### 🏆 PHASE 6 : COMMUNAUTÉ & LONG-TERME (Semaines 25+)

**Objectif :** Autonomie communauté, pérennité.

| Feature | Dev Hours | Priority | Impact |
|---------|-----------|----------|--------|
| Mod Support API | 120h | P2 | Community content |
| Saison 2 Battle Pass | 40h | P0 | Retention continue |
| Guildes niveau 2 (territoires, tech) | 80h | P1 | Endgame |
| Mobile Responsive (PWA) | 100h | P1 | +50% audience |

---

## 💰 BUDGET TOTAL & ROI

### Investissement 6 mois

| Poste | Coût |
|-------|------|
| **Dev Salaires** (2 devs full-time, 6 mois) | 72,000€ |
| **Designer UI/UX** (freelance, 3 mois) | 15,000€ |
| **Infrastructure** (AWS/DigitalOcean) | 1,200€ |
| **Tools** (Sentry, Mixpanel, etc.) | 600€ |
| **Marketing** (ads, influenceurs) | 5,000€ |
| **Legal** (CGU, RGPD, entité) | 2,000€ |
| **TOTAL** | **95,800€** |

### Revenus projetés (conservateurs)

**Hypothèses :**
- Soft launch : 100 joueurs (mois 1)
- Croissance organique : +50% MoM (viralité modérée)
- Conversion 5% (Battle Pass + CT)

| Mois | MAU | Paying Users (5%) | Revenue |
|------|-----|-------------------|---------|
| M1 | 100 | 5 | 50€ |
| M2 | 150 | 8 | 80€ |
| M3 | 225 | 11 | 110€ |
| M4 | 340 | 17 | 340€ |
| M5 | 500 | 25 | 500€ |
| M6 | 750 | 38 | 760€ |
| **M12** | **2,700** | **135** | **2,700€/mois** |
| **M18** | **8,000** | **400** | **8,000€/mois** |
| **M24** | **20,000** | **1,000** | **20,000€/mois** |

**Break-even :** Mois 18-20 (selon growth réel).

**Scénario optimiste (viral + marketing) :**
- M12 : 10k MAU = 10k€/mois
- M24 : 50k MAU = 50k€/mois = **600k€/an**

---

## 🎯 MÉTRIQUES DE SUCCÈS (KPIs)

### Rétention
- **J1** : 50%+ (actuellement ~20%)
- **J7** : 30%+ (actuellement ~5%)
- **J30** : 15%+ (actuellement ~1%)

### Engagement
- **Session length** : 45min+ (actuellement 15min)
- **Sessions/jour** : 2.5+ (actuellement 1.2)
- **Actions/session** : 15+ (construire, attaquer, trader, etc.)

### Monétisation
- **Conversion free → pay** : 5%+ (industry avg : 2-5%)
- **ARPU** (Average Revenue Per User) : 2€/mois
- **ARPPU** (Paying users) : 40€/mois

### Communauté
- **% en alliance** : 60%+
- **Messages chat/jour** : 500+
- **Events participation** : 40%+ joueurs actifs

### Technique
- **Uptime** : 99.5%+
- **Latence P95** : <300ms
- **Error rate** : <0.5%

---

## 🚧 RISQUES & MITIGATION

### Risque 1 : Manque de joueurs (traction)
**Probabilité :** Élevée (70%) — marché saturé  
**Impact :** Critique — 0 joueurs = échec  
**Mitigation :**
- Soft launch Reddit/HN immédiat (coût 0€)
- Niche focus : "OGame pour devs" (communauté tech)
- Open-source partiel (GitHub stars = visibilité)

### Risque 2 : Churn élevé post-launch
**Probabilité :** Moyenne (50%)  
**Impact :** Élevé — croissance stagne  
**Mitigation :**
- Analytics granulaires (Mixpanel funnels)
- User interviews (10+ joueurs/semaine)
- Itération rapide (deploy daily)

### Risque 3 : Déséquilibre P2W perçu
**Probabilité :** Moyenne (40%)  
**Impact :** Élevé — backlash communauté  
**Mitigation :**
- Politique claire : "Only cosmetics & time, NO power"
- Community council (top players votent changes)
- Transparence économie in-game

### Risque 4 : Coûts infra explosent
**Probabilité :** Faible (20%) — si viral soudain  
**Impact :** Moyen — marges réduites  
**Mitigation :**
- Auto-scaling AWS/GCP (pay-as-you-go)
- Cache agressif (Redis)
- Serverless functions (Firebase Cloud)

### Risque 5 : Concurrence (nouveau jeu similaire)
**Probabilité :** Faible (30%)  
**Impact :** Moyen  
**Mitigation :**
- Différenciation : Open-source, mod-friendly
- First-mover advantage (launch rapide)
- Community lock-in (alliances = social graph)

---

## 📝 RECOMMANDATIONS FINALES

### 🔴 URGENT (Semaine 1)
1. **Tutoriel interactif** (blocker rétention J1)
2. **Bouclier débutant** (protection nouveaux)
3. **Soft launch Reddit** (premiers 100 joueurs)
4. **Analytics Mixpanel** (data-driven decisions)

### 🟠 HAUTE PRIORITÉ (Mois 1-2)
1. **Système Quêtes complet**
2. **Battle Pass Saison 1**
3. **Marché dynamique joueurs**
4. **Alliances fonctionnelles**

### 🟢 MOYEN TERME (Mois 3-4)
1. **PNJ Boss & PvE**
2. **UI Redesign (MUI 5)**
3. **Monétisation éthique**
4. **Tests E2E coverage 80%**

### 🔵 LONG TERME (Mois 5-6+)
1. **Scaling 5000+ CCU**
2. **Mod Support**
3. **Mobile PWA**
4. **Machine Learning features**

---

## 🎬 CONCLUSION : LA VISION

**Terra Dominus a le potentiel de devenir un MMO de référence** dans la niche "browser RTS", à condition d'exécuter cette roadmap avec discipline.

### Pourquoi ce projet peut réussir :

1. **Fondations techniques solides** : Architecture prête pour scale, pas de dette technique majeure
2. **Marché validé** : OGame = 10M+ joueurs lifetime, Travian = 5M+, marché existe
3. **Différenciateur moderne** : Open-source partiel, mod-friendly, F2P éthique (rare)
4. **Stack attractive devs** : Node.js + React = contributeurs potentiels

### Le piège à éviter :

**Ne PAS passer 6 mois de plus à coder dans le vide.**  
→ Lancer une alpha testable MAINTENANT (4 semaines max).  
→ Itérer selon feedback réel joueurs.

### Le pari gagnant :

**Communauté > Technologie.**  
Un jeu moyen avec 1000 fans vaut mieux qu'un jeu parfait avec 0 joueurs.

---

**Next Steps (Semaine 1) :**
1. [ ] Implémenter tutoriel interactif (5 étapes minimum)
2. [ ] Ajouter bouclier débutant (backend + frontend)
3. [ ] Poster sur r/WebGames + r/incremental_games
4. [ ] Setup Mixpanel events tracking
5. [ ] Créer Discord serveur communauté

**Deadline :** 7 jours. Go. 🚀

---

**Préparé par :** GitHub Copilot (Game Design + Architecture Lead)  
**Pour :** Équipe Terra Dominus  
**Confidentialité :** Interne  
**Version :** 1.0 — Roadmap stratégique 6 mois

---

*"The best time to plant a tree was 20 years ago. The second best time is now."*  
— Proverbe chinois (applicable au game dev)