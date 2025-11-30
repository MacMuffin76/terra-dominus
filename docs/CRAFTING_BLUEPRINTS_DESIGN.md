# 🔧 CRAFTING & BLUEPRINTS SYSTEM — DESIGN DOCUMENT

**Date:** 30 novembre 2025  
**Auteur:** Architecture Lead & Game Designer  
**Statut:** 🟢 Design Phase  
**Dépendances:** ✅ T2 Resources System (Titanium, Plasma, Nanotubes)

---

## 📋 EXECUTIVE SUMMARY

### Vision
Le **Crafting & Blueprints System** transforme Terra Dominus d'un jeu de construction passif en un MMO avec progression profonde et stratégique. Les joueurs découvrent des blueprints rares, collectent des ressources T1/T2, et craftent des équipements, bâtiments, et unités légendaires.

### Objectifs Core
1. **Sink de ressources** : Consommer T1/T2 pour réguler économie
2. **Progression verticale** : Débloquer items puissants via craft, pas P2W
3. **Engagement loop** : Découverte → Collecte → Craft → Upgrade
4. **Social gameplay** : Blueprints échangeables, crafts coopératifs alliance
5. **Monétisation éthique** : Speedup craft + blueprint cosmétiques (non-P2W)

### Metrics Cibles (Post-Implémentation)
- **Engagement** : +40% session time (nouveaux objectifs craft)
- **Rétention J30** : +25% (progression long-terme)
- **Économie** : 60% des ressources T2 consommées via craft (sink efficace)
- **Social** : 30% joueurs échangent blueprints/matériaux

---

## 🎯 GAMEPLAY MECHANICS

### 1. BLUEPRINTS (Recettes)

#### 1.1 Types de Blueprints

| Catégorie | Exemples | Rareté | Source |
|-----------|----------|--------|--------|
| **Units** | Super Tank Mk2, Elite Infantry | Rare | Portails Bleus/Violets |
| **Buildings** | Orbital Defense System, Mega Refinery | Epic | Recherche lv20+, Portails Rouges |
| **Equipment** | Commander Armor, Tactical Scanner | Rare | Quêtes, Achievement rewards |
| **Cosmetics** | Golden Banner, Neon City Skin | Legendary | Battle Pass, Événements |
| **Consumables** | Shield Booster (1h), Production Accelerator (24h) | Common | Craft de masse, marché |

#### 1.2 Rareté & Drop Rates

```javascript
const BLUEPRINT_RARITY = {
  COMMON: {
    color: '#9E9E9E',
    drop_rate: 0.50, // 50% portails gris/verts
    craft_uses: 'unlimited', // Réutilisable infini
    market_tradeable: true
  },
  RARE: {
    color: '#2196F3',
    drop_rate: 0.30, // 30% portails bleus
    craft_uses: 'unlimited',
    market_tradeable: true
  },
  EPIC: {
    color: '#9C27B0',
    drop_rate: 0.15, // 15% portails violets/rouges
    craft_uses: 'unlimited',
    market_tradeable: true,
    soulbound_first_craft: false // Peut vendre même après 1er craft
  },
  LEGENDARY: {
    color: '#FF9800',
    drop_rate: 0.04, // 4% portails rouges
    craft_uses: 'unlimited',
    market_tradeable: true,
    unique_per_player: false // Plusieurs exemplaires possibles
  },
  MYTHIC: {
    color: '#E91E63',
    drop_rate: 0.01, // 1% portails dorés uniquement
    craft_uses: 'unlimited',
    market_tradeable: false, // Soulbound, jamais vendable
    unique_per_player: true // 1 seul exemplaire maximum
  }
};
```

#### 1.3 Blueprint Discovery

**Méthodes d'obtention :**
1. **Portails PvE** : Loot primaire (60% blueprints)
2. **Recherche avancée** : Unlock via tech tree (20%)
3. **Quêtes campagne** : Récompenses fixes (10%)
4. **Achievements** : Déblocages spéciaux (5%)
5. **Événements saisonniers** : Exclusifs temporaires (5%)

**Exemple drop Portail Bleu :**
```javascript
const PORTAL_BLUE_LOOT = {
  guaranteed: {
    resources_t1: { metal: [5000, 10000], carburant: [2000, 5000] },
    resources_t2: { titanium: [10, 30] }
  },
  random_rolls: 3, // 3 tirages indépendants
  loot_table: [
    { type: 'blueprint', rarity: 'common', chance: 0.40 },
    { type: 'blueprint', rarity: 'rare', chance: 0.25 },
    { type: 'blueprint', rarity: 'epic', chance: 0.08 },
    { type: 'resources_t2', resource: 'plasma', amount: [5, 15], chance: 0.15 },
    { type: 'premium_currency', amount: [10, 50], chance: 0.12 }
  ]
};
```

---

### 2. CRAFTING MECHANICS

#### 2.1 Crafting Queue System

Inspiré des conversions T2, mais avec plus de complexité.

**Contraintes :**
- **Max 5 crafts simultanés** (base, +1 slot avec Premium VIP)
- **Durée variable** : 30min (Consumables) → 72h (Legendary Buildings)
- **Building requirement** : Crafting Station (nouveau bâtiment)

**Crafting Station (Nouveau Bâtiment) :**

| Niveau | Craft Slots | Max Rarity Craftable | Upgrade Cost | Duration |
|--------|-------------|----------------------|--------------|----------|
| 1 | 3 | Common | 5000 metal, 2000 carburant | 30min |
| 5 | 4 | Rare | 10000 metal, 5000 carburant, 50 titanium | 2h |
| 10 | 5 | Epic | 20000 metal, 10000 carburant, 200 titanium, 50 plasma | 6h |
| 15 | 6 | Legendary | 50000 metal, 100 plasma, 50 nanotubes | 12h |

#### 2.2 Crafting Recipes (Blueprints)

**Exemple 1 : Super Tank Mk2 (Rare Unit)**

```javascript
{
  id: 'super_tank_mk2',
  name: 'Super Tank Mk2',
  category: 'unit',
  rarity: 'rare',
  blueprint_required: 'blueprint_super_tank_mk2', // Doit posséder blueprint
  inputs: {
    resources_t1: { metal: 8000, carburant: 3000 },
    resources_t2: { titanium: 100, plasma: 20 },
    base_unit: { type: 'Tank', quantity: 5 } // Consomme 5 tanks standards
  },
  outputs: {
    unit: { type: 'Super_Tank_Mk2', quantity: 1 }
  },
  duration_seconds: 7200, // 2h
  crafting_station_level_min: 5,
  experience_reward: 150, // XP joueur
  unlock_requirements: {
    research: 'advanced_armor',
    building: { type: 'barracks', level: 10 }
  },
  stats: {
    attack: 180, // vs 100 Tank standard
    defense: 150, // vs 80
    speed: 8, // vs 10 (plus lent)
    special_ability: 'armor_penetration_25%'
  }
}
```

**Exemple 2 : Orbital Defense System (Epic Building)**

```javascript
{
  id: 'orbital_defense',
  name: 'Orbital Defense System',
  category: 'building',
  rarity: 'epic',
  blueprint_required: 'blueprint_orbital_defense',
  inputs: {
    resources_t1: { metal: 50000, energie: 100000, carburant: 20000 },
    resources_t2: { titanium: 500, plasma: 300, nanotubes: 100 }
  },
  outputs: {
    building: { type: 'orbital_defense_system', level: 1 }
  },
  duration_seconds: 259200, // 72h
  crafting_station_level_min: 15,
  experience_reward: 5000,
  unlock_requirements: {
    research: 'orbital_mechanics',
    alliance_tech: 'space_warfare_tier_3'
  },
  building_effects: {
    defense_boost_city: 2.0, // Double défense ville
    auto_defense_vs_attacks: true, // Tire automatiquement sur attaquants
    cooldown_between_shots: 3600 // 1h entre tirs
  }
}
```

**Exemple 3 : Shield Booster (Common Consumable)**

```javascript
{
  id: 'shield_booster_1h',
  name: 'Shield Booster (1h)',
  category: 'consumable',
  rarity: 'common',
  blueprint_required: 'blueprint_shield_booster', // Unlocked via research lv5
  inputs: {
    resources_t1: { energie: 5000, carburant: 2000 },
    resources_t2: { plasma: 5 }
  },
  outputs: {
    item: { type: 'shield_booster_1h', quantity: 1 }
  },
  duration_seconds: 1800, // 30min craft
  crafting_station_level_min: 1,
  experience_reward: 10,
  item_effects: {
    defense_multiplier: 1.5, // +50% défense
    duration_seconds: 3600, // 1h actif
    stackable: false // Ne peut pas cumuler plusieurs
  }
}
```

**Exemple 4 : Neon City Skin (Legendary Cosmetic)**

```javascript
{
  id: 'neon_city_skin',
  name: 'Neon City Skin Pack',
  category: 'cosmetic',
  rarity: 'legendary',
  blueprint_required: 'blueprint_neon_city', // Battle Pass Season 1 reward tier 100
  inputs: {
    resources_t1: { metal: 10000, energie: 20000 },
    resources_t2: { plasma: 200, nanotubes: 50 },
    premium_currency: 100 // Coût CT en plus (cosmétique = premium)
  },
  outputs: {
    cosmetic: { type: 'city_skin_neon', permanent: true }
  },
  duration_seconds: 86400, // 24h (long pour rareté)
  crafting_station_level_min: 10,
  experience_reward: 1000,
  cosmetic_effects: {
    buildings_glow: true,
    animated_lights: true,
    theme_color: '#00FFFF'
  }
}
```

#### 2.3 Crafting Process Flow

```
1. Player possesses blueprint (discovered via Portals/Research/Quests)
   ↓
2. Player opens Crafting Station interface
   ↓
3. Selects blueprint from collection
   ↓
4. System checks:
   - Crafting Station level >= blueprint requirement
   - Player has required resources (T1 + T2 + units/items)
   - Player has unlock requirements (research, building levels)
   - Free crafting slot available (<= max_slots)
   ↓
5. If valid:
   - Deduct resources immediately
   - Create crafting job in queue
   - Set completedAt = now + duration_seconds
   - Emit Socket.IO event: 'craft:started'
   ↓
6. During crafting:
   - Player can view progress in Crafting Station UI
   - Player can cancel (refund 50% resources)
   - Player can speedup (premium currency: 1 CT / 60s, min 20 CT)
   ↓
7. On completion (cron job checks every 5min):
   - Award output item/unit/building to player inventory
   - Grant experience reward
   - Emit Socket.IO event: 'craft:completed'
   - Log craft history
   ↓
8. Player can craft again (blueprint unlimited use)
```

#### 2.4 Crafting Station UI (Frontend Spec)

**Route :** `/crafting`

**Sections :**
1. **Active Crafts** (Top)
   - Cards showing in-progress crafts
   - Progress bar (% complete)
   - Time remaining
   - Buttons: [Cancel] [Speedup (X CT)]

2. **Blueprint Collection** (Center)
   - Grid of discovered blueprints
   - Filters: [All] [Units] [Buildings] [Consumables] [Cosmetics]
   - Sort: [Rarity] [Recently Discovered] [Craftable Now]
   - Blueprint Card:
     - Thumbnail image
     - Name + rarity color border
     - Required resources (with icon + quantity, red if insufficient)
     - Duration
     - [Craft] button (disabled if requirements not met)

3. **Crafting Station Info** (Sidebar)
   - Current level
   - Active slots: 3/5
   - Next level benefits
   - [Upgrade] button

**Mockup ASCII :**
```
┌─────────────────────────────────────────────────────────────┐
│ 🔧 CRAFTING STATION (Level 10)                    [Upgrade]│
├─────────────────────────────────────────────────────────────┤
│ ACTIVE CRAFTS (3/5)                                         │
│ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────┐│
│ │ Super Tank Mk2   │ │ Shield Booster   │ │ Titanium Bar ││
│ │ ████████░░ 80%   │ │ ████████████ 100%│ │ ███░░░░░ 30% ││
│ │ 24min remaining  │ │ READY TO COLLECT │ │ 2h 15min     ││
│ │ [Cancel][Speedup]│ │    [COLLECT]     │ │ [Cancel][↑]  ││
│ └──────────────────┘ └──────────────────┘ └──────────────┘│
├─────────────────────────────────────────────────────────────┤
│ BLUEPRINTS DISCOVERED (24)       [All▼][Sort: Rarity▼]    │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐   │
│ │Super │ │Orbital│ │Shield│ │Neon  │ │Elite │ │Mega  │   │
│ │Tank  │ │Defense│ │Boost │ │Skin  │ │Infan │ │Refine│   │
│ │━━━━━━│ │━━━━━━│ │━━━━━━│ │━━━━━━│ │━━━━━━│ │━━━━━━│   │
│ │RARE  │ │EPIC  │ │COMMON│ │LEGEND│ │RARE  │ │EPIC  │   │
│ │      │ │      │ │      │ │      │ │      │ │      │   │
│ │⚒ 2h  │ │⚒ 72h │ │⚒ 30m │ │⚒ 24h │ │⚒ 1h  │ │⚒ 12h │   │
│ │[CRAFT│ │[CRAFT│ │[CRAFT│ │[NEED │ │[CRAFT│ │[NEED │   │
│ │ NOW] │ │ NOW] │ │ NOW] │ │ 100CT│ │ NOW] │ │PLASMA│   │
│ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

### 3. ADVANCED FEATURES

#### 3.1 Blueprint Trading (Marketplace)

**Mechanic :**
- Players can sell/buy blueprints on global market
- Prices dynamic (supply/demand)
- 10% market tax (sink)

**API Endpoint (extends existing market) :**
```javascript
POST /api/v1/market/blueprints
{
  "type": "sell",
  "blueprint_id": "blueprint_super_tank_mk2",
  "price": 50000, // en "or" (monnaie de référence)
  "quantity": 1,
  "expires_at": "2025-12-10T00:00:00Z"
}
```

**UI :** Section "Blueprints" dans marché existant.

#### 3.2 Crafting Coopératif (Alliance)

**Mechanic :**
- Alliance peut lancer "Alliance Crafts" (Epic/Legendary only)
- Membres contribuent ressources (pool partagé)
- Résultat distribué à tous contributeurs

**Exemple : Orbital Superweapon (Mythic)**
```javascript
{
  id: 'alliance_superweapon',
  name: 'Alliance Orbital Superweapon',
  category: 'alliance_building',
  rarity: 'mythic',
  blueprint_required: 'blueprint_alliance_superweapon', // Alliance achievement
  inputs: {
    resources_t1: { metal: 1000000, energie: 2000000, carburant: 500000 },
    resources_t2: { titanium: 10000, plasma: 5000, nanotubes: 2000 }
  },
  outputs: {
    alliance_building: { type: 'orbital_superweapon', level: 1 }
  },
  duration_seconds: 1209600, // 14 jours
  contribution_required: {
    min_members: 10, // Au moins 10 membres contributeurs
    min_contribution_per_member: 0.05 // Chaque membre >= 5% du total
  },
  alliance_effects: {
    can_launch_orbital_strike: true, // Frappe dévastatrice 1x/semaine
    alliance_defense_boost: 1.5, // +50% défense toutes villes membres
    prestige_points: 10000 // Leaderboard alliance
  }
}
```

**UI Alliance Crafts :**
- Alliance leader lance craft
- Barre de progression collective
- Liste contributeurs + % contribution
- Bouton [Contribuer Ressources]

#### 3.3 Crafting XP & Masteries

**Mechanic :**
- Chaque craft donne XP joueur (5-5000 selon rareté)
- Levels crafteur débloquent passifs :

| Crafting Level | Unlock |
|----------------|--------|
| 5 | -5% craft duration (global) |
| 10 | -10% resource costs (global) |
| 15 | Unlock "Mass Craft" (craft 10x common simultanément) |
| 20 | +1 crafting slot permanent |
| 25 | 5% chance double output (Legendary crafts) |
| 30 | Unlock "Instant Craft" (1x/day, skip 1 craft duration) |

**Progression visible :**
```
Crafting Mastery: Level 12 / 30
XP: 15,340 / 20,000 to next level
Next reward: -10% resource costs
```

#### 3.4 Craft History & Statistics

**Player Profile Section :**
```javascript
{
  total_crafts_completed: 245,
  most_crafted_item: { name: 'Shield Booster', count: 78 },
  rarest_craft: { name: 'Orbital Defense System', rarity: 'epic' },
  total_resources_consumed: {
    metal: 1500000,
    titanium: 5000,
    plasma: 1200
  },
  crafting_level: 12,
  achievements_unlocked: ['First Craft', 'Legendary Crafter', 'Mass Producer']
}
```

**Leaderboard :**
- **Top Crafters** (by total crafts)
- **Master Crafters** (by rarity crafts)
- **Resource Titans** (by T2 resources consumed)

---

## 🗄️ DATABASE SCHEMA

### 3 Tables Principales

#### 1. `blueprints` (Master Data)

```sql
CREATE TABLE blueprints (
  id SERIAL PRIMARY KEY,
  
  -- Identity
  name VARCHAR(100) NOT NULL UNIQUE,
  category VARCHAR(30) NOT NULL, -- 'unit', 'building', 'consumable', 'cosmetic', 'alliance_building'
  rarity VARCHAR(20) NOT NULL, -- 'common', 'rare', 'epic', 'legendary', 'mythic'
  
  -- Requirements
  crafting_station_level_min INTEGER DEFAULT 1,
  unlock_requirements JSONB DEFAULT '{}', -- { research: 'tech_id', building: { type: 'barracks', level: 10 } }
  
  -- Recipe
  inputs JSONB NOT NULL, -- { resources_t1: {...}, resources_t2: {...}, units: [...], items: [...], premium_currency: 100 }
  outputs JSONB NOT NULL, -- { unit: {...}, building: {...}, item: {...}, cosmetic: {...} }
  duration_seconds INTEGER NOT NULL,
  
  -- Rewards
  experience_reward INTEGER DEFAULT 0,
  
  -- Metadata
  description TEXT,
  icon_url VARCHAR(255),
  
  -- Flags
  is_active BOOLEAN DEFAULT true,
  is_tradeable BOOLEAN DEFAULT true,
  is_alliance_craft BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_blueprints_category ON blueprints(category);
CREATE INDEX idx_blueprints_rarity ON blueprints(rarity);
CREATE INDEX idx_blueprints_active ON blueprints(is_active);
```

#### 2. `player_blueprints` (User-Owned Blueprints)

```sql
CREATE TABLE player_blueprints (
  id SERIAL PRIMARY KEY,
  
  -- Relations
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blueprint_id INTEGER NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  
  -- Discovery
  discovered_at TIMESTAMP DEFAULT NOW(),
  discovery_source VARCHAR(50), -- 'portal_blue', 'research', 'quest_reward', 'market_purchase', 'event'
  
  -- Stats
  times_crafted INTEGER DEFAULT 0,
  
  UNIQUE(user_id, blueprint_id)
);

CREATE INDEX idx_player_blueprints_user ON player_blueprints(user_id);
CREATE INDEX idx_player_blueprints_blueprint ON player_blueprints(blueprint_id);
```

#### 3. `crafting_queue` (Active Crafts)

```sql
CREATE TABLE crafting_queue (
  id SERIAL PRIMARY KEY,
  
  -- Relations
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blueprint_id INTEGER NOT NULL REFERENCES blueprints(id),
  
  -- Craft Details
  quantity_target INTEGER DEFAULT 1, -- Pour mass craft future
  resources_consumed JSONB NOT NULL, -- Snapshot des inputs au moment du craft
  
  -- Timing
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP NOT NULL,
  collected_at TIMESTAMP, -- NULL si pas encore collecté
  
  -- Status
  status VARCHAR(20) NOT NULL, -- 'in_progress', 'completed', 'cancelled', 'collected'
  
  -- Output (stocké après complétion)
  output_items JSONB, -- Ce qui a été crafté (avec quantités exactes)
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_crafting_queue_user ON crafting_queue(user_id);
CREATE INDEX idx_crafting_queue_status ON crafting_queue(status);
CREATE INDEX idx_crafting_queue_completed ON crafting_queue(completed_at) WHERE status = 'completed';
```

#### 4. `player_crafting_stats` (Progression)

```sql
CREATE TABLE player_crafting_stats (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  
  -- XP & Level
  crafting_xp INTEGER DEFAULT 0,
  crafting_level INTEGER DEFAULT 1,
  
  -- Statistics
  total_crafts_completed INTEGER DEFAULT 0,
  total_crafts_cancelled INTEGER DEFAULT 0,
  
  -- Resources consumed lifetime
  resources_t1_consumed JSONB DEFAULT '{}', -- { metal: 500000, carburant: 200000, energie: 100000 }
  resources_t2_consumed JSONB DEFAULT '{}', -- { titanium: 5000, plasma: 1200, nanotubes: 300 }
  
  -- Achievements
  first_craft_at TIMESTAMP,
  first_rare_craft_at TIMESTAMP,
  first_epic_craft_at TIMESTAMP,
  first_legendary_craft_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔌 BACKEND ARCHITECTURE

### Modules Structure

```
backend/modules/crafting/
  domain/
    craftingRules.js          # Constants, validation rules
    blueprintData.js          # Seeded blueprints (10+ recipes)
  
  application/
    CraftingService.js        # Business logic
  
  infra/
    SequelizeRepositories/
      CraftingRepository.js   # Data access layer
  
  controllers/
    craftingController.js     # HTTP endpoints
  
  routes/
    craftingRoutes.js         # Route definitions

backend/models/
  Blueprint.js                # Sequelize model
  PlayerBlueprint.js          # User-blueprint relation
  CraftingQueue.js            # Active crafts
  PlayerCraftingStats.js      # Progression
  CraftingStation.js          # Building model (extends UserBuilding)

backend/jobs/
  craftingJobs.js             # Cron: processCompletedCrafts, awardCraftXP
```

### API Endpoints (REST)

#### Blueprints

```
GET    /api/v1/crafting/blueprints              # Liste tous blueprints découverts par user
GET    /api/v1/crafting/blueprints/:id          # Détails blueprint spécifique
POST   /api/v1/crafting/blueprints/:id/discover # Admin: forcer discovery (testing)
```

#### Crafting

```
POST   /api/v1/crafting/craft                   # Lancer un craft
  Body: { blueprint_id, quantity (optional, default 1) }

GET    /api/v1/crafting/queue                   # Liste crafts en cours + completed non-collectés
GET    /api/v1/crafting/queue/:id               # Détails craft spécifique

POST   /api/v1/crafting/queue/:id/speedup       # Speedup avec CT
DELETE /api/v1/crafting/queue/:id               # Cancel craft (refund 50%)
POST   /api/v1/crafting/queue/:id/collect       # Collecter craft completed
```

#### Crafting Station

```
GET    /api/v1/crafting/station                 # Info Crafting Station user
POST   /api/v1/crafting/station/upgrade         # Upgrade station (consomme ressources)
```

#### Statistics

```
GET    /api/v1/crafting/stats                   # Stats crafting user (XP, level, totals)
GET    /api/v1/crafting/leaderboard             # Top crafters (query: ?type=total_crafts|rarity_crafts)
```

---

## 🎮 FRONTEND IMPLEMENTATION

### Routes

```
/crafting                  # Main crafting interface
/crafting/blueprints       # Full blueprint collection view
/crafting/station          # Crafting Station management
/crafting/history          # Craft history & stats
```

### Redux Slices

```javascript
// src/redux/craftingSlice.js
const craftingSlice = createSlice({
  name: 'crafting',
  initialState: {
    blueprints: [],             // Discovered blueprints
    activeQueue: [],            // In-progress crafts
    completedQueue: [],         // Ready to collect
    station: null,              // Crafting Station info
    stats: null,                // Crafting stats
    loading: false,
    error: null
  },
  reducers: { /* ... */ },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBlueprints.fulfilled, (state, action) => {
        state.blueprints = action.payload;
      })
      .addCase(startCraft.fulfilled, (state, action) => {
        state.activeQueue.push(action.payload);
      })
      .addCase(collectCraft.fulfilled, (state, action) => {
        state.completedQueue = state.completedQueue.filter(c => c.id !== action.payload.id);
      });
  }
});
```

### Components

```
src/components/Crafting/
  CraftingDashboard.jsx       # Main view with active crafts + blueprints grid
  BlueprintCard.jsx           # Individual blueprint card (rarity colors, requirements)
  CraftingQueueItem.jsx       # Active craft progress bar + actions
  CraftingStationWidget.jsx   # Sidebar station info + upgrade
  BlueprintModal.jsx          # Detailed view blueprint (recipe, stats, requirements)
  CraftConfirmDialog.jsx      # Confirmation avant craft (montre coûts)
```

### Socket.IO Events

```javascript
// Real-time updates
socket.on('craft:started', (data) => {
  // { craftId, blueprintName, completedAt }
  dispatch(addToCraftingQueue(data));
  toast.success(`Craft started: ${data.blueprintName}`);
});

socket.on('craft:completed', (data) => {
  // { craftId, outputItems }
  dispatch(moveCraftToCompleted(data));
  toast.info('🎉 Craft completed! Collect your items.', { autoClose: false });
});

socket.on('blueprint:discovered', (data) => {
  // { blueprintId, blueprintName, rarity, source }
  dispatch(addBlueprint(data));
  toast.success(`🎁 Blueprint discovered: ${data.blueprintName} (${data.rarity})`, {
    style: { borderColor: RARITY_COLORS[data.rarity] }
  });
});
```

---

## 📊 GAME ECONOMY BALANCING

### Resource Sinks (Objectif)

**Avant Crafting :**
- Consommation T2 : 10% (conversions uniquement)
- Inflation : +20%/semaine (ressources s'accumulent)

**Après Crafting :**
- Consommation T2 cible : 60%+ (crafts + conversions)
- Inflation régulée : +5%/semaine (sink efficace)

### Blueprint Drop Rates (Calibration)

**Objectif : Joueur moyen découvre 1 blueprint Epic/semaine.**

```javascript
// Portails par semaine (joueur actif)
const WEEKLY_PORTALS_ACTIVE_PLAYER = {
  grey: 10,   // 50% Epic drop = 0 Epic (pas de Epic en gris)
  green: 5,   // 0 Epic
  blue: 2,    // 8% Epic × 3 rolls × 2 portails = 0.48 Epic/semaine ≈ 1 tous les 2 semaines
  purple: 0.5 // 15% Epic × 3 rolls × 0.5 = 0.225 Epic/semaine
};

// Total Epic/semaine : ~0.7 → Ajusté à 1.0 en augmentant purple à 1 portail/semaine
```

**Ajustement final :**
- Blue : 8% → **12% Epic chance**
- Purple : 1 portail/semaine garanti (événement hebdomadaire)
- Total : **~1 Epic/semaine** (satisfaisant pour progression)

### Craft Duration Balancing

**Formule :**
```
Duration = Base_Time × Rarity_Multiplier × Output_Power_Factor

Common:    30min - 2h
Rare:      2h - 8h
Epic:      8h - 24h
Legendary: 24h - 72h
Mythic:    72h - 14 jours (alliance crafts)
```

**Speedup Cost (CT) :**
```
Cost = MAX(20, CEIL(Duration_Seconds / 60) × 1)
Exemples:
- 2h craft = 120min × 1 CT/min = 120 CT (~1.20€)
- 24h craft = 1440min × 1 CT/min = 1440 CT (~14.40€) → Capped at 500 CT (whales)
```

---

## 🎯 SUCCESS METRICS (KPIs)

### Post-Launch (1 mois après implémentation)

| Metric | Baseline (Before) | Target (After) | Measurement |
|--------|-------------------|----------------|-------------|
| **Engagement** | | | |
| Avg Session Time | 45min | 65min (+44%) | Google Analytics |
| Crafts started/day | 0 | 500+ | DB query |
| Blueprints discovered/week | 0 | 200+ | DB query |
| **Retention** | | | |
| Day 7 | 30% | 40% (+33%) | Cohort analysis |
| Day 30 | 15% | 20% (+33%) | Cohort analysis |
| **Economy** | | | |
| T2 resource consumption % | 10% | 60% (+500%) | Production vs Consumed |
| Inflation rate | +20%/week | +5%/week (-75%) | Price tracking |
| **Monetization** | | | |
| Speedup revenue/month | 0€ | 500€+ | Stripe dashboard |
| Cosmetic blueprints sold | 0 | 50+ | Market transactions |
| **Social** | | | |
| Blueprint trades/week | 0 | 100+ | Market API |
| Alliance crafts started | 0 | 5+ | DB query |

### Long-term (6 mois)

- **40% des joueurs actifs** craftent au moins 1 item/semaine
- **Top 10% crafters** = whales potentiels (ciblage marketing)
- **Crafting = #1 sink ressources T2** (>50% total consumed)

---

## 🚀 IMPLEMENTATION ROADMAP

### Phase 1 : MVP (Semaine 1-2) — 80h

**Objectif :** Crafting basique fonctionnel (Common + Rare blueprints uniquement).

| Tâche | Hours | Owner |
|-------|-------|-------|
| Database migration (4 tables) | 8h | Backend |
| Sequelize models (4 models) | 8h | Backend |
| Seed 10 blueprints (5 Common, 5 Rare) | 4h | Backend |
| CraftingRepository (20+ methods) | 12h | Backend |
| CraftingService (business logic) | 16h | Backend |
| craftingController (8 endpoints) | 12h | Backend |
| Routes + DI integration | 4h | Backend |
| Crafting Station building model | 4h | Backend |
| Frontend: CraftingDashboard UI | 16h | Frontend |
| Frontend: Blueprint cards + grid | 8h | Frontend |
| Frontend: Redux slice + API calls | 8h | Frontend |
| Integration tests (8 scenarios) | 12h | QA |

**Deliverables :**
- ✅ Players can discover blueprints (manual admin grant for testing)
- ✅ Players can craft Common/Rare items
- ✅ Crafting queue (max 3 slots)
- ✅ Cancel craft (50% refund)
- ✅ Crafting Station upgradeable (lv1-5)

---

### Phase 2 : Advanced (Semaine 3) — 40h

**Objectif :** Epic/Legendary, speedup, blueprint trading.

| Tâche | Hours | Owner |
|-------|-------|-------|
| Seed 10 Epic/Legendary blueprints | 6h | Backend |
| Speedup craft logic (CT cost calc) | 6h | Backend |
| Blueprint market integration | 8h | Backend |
| Crafting XP & leveling system | 8h | Backend |
| Socket.IO events (craft:started, craft:completed) | 4h | Backend |
| Frontend: Speedup UI + CT display | 6h | Frontend |
| Frontend: Blueprint market tab | 8h | Frontend |
| Frontend: Crafting stats page | 6h | Frontend |

**Deliverables :**
- ✅ Epic/Legendary crafts available
- ✅ Speedup with premium currency
- ✅ Blueprint trading on market
- ✅ Crafting XP progression visible

---

### Phase 3 : Polish & Integration (Semaine 4) — 30h

**Objectif :** Portails integration, alliance crafts, leaderboards.

| Tâche | Hours | Owner |
|-------|-------|-------|
| Portails: Add blueprint drops to loot tables | 6h | Backend |
| Alliance crafts (Mythic tier) | 10h | Backend |
| Leaderboards (Top Crafters) | 4h | Backend |
| Unit tests (Jest, 80% coverage) | 8h | QA |
| Documentation (API guide) | 4h | Tech Writer |

**Deliverables :**
- ✅ Blueprints drop from Portals
- ✅ Alliance cooperative crafts
- ✅ Leaderboards functional
- ✅ 80%+ test coverage

---

### Total : ~150h (3-4 semaines, 1 dev backend + 1 dev frontend)

**Budget estimé :** 8,500€ (salaires)

---

## 🎨 UI/UX MOCKUPS (Detailed)

### Blueprint Card (Component)

```
┌────────────────────────────┐
│  ╔════════════════════╗    │
│  ║  [SUPER TANK MK2] ║    │ ← Image/Icon
│  ╚════════════════════╝    │
│                            │
│  Super Tank Mk2            │ ← Name
│  ━━━━━━━━━━━━━━━━━━━━      │ ← Rarity border (blue for Rare)
│                            │
│  Requirements:             │
│  🔧 Crafting Station Lv5   │ ← Green if met, red if not
│  📚 Advanced Armor (✓)     │
│                            │
│  Costs:                    │
│  💰 8,000 Metal            │ ← Green if has, red if insufficient
│  ⚡ 3,000 Carburant        │
│  🔩 100 Titanium           │
│  ⚛️ 20 Plasma              │
│  🎖️ 5 Tank (units)         │
│                            │
│  ⏱️ Duration: 2h           │
│  ⭐ XP Reward: 150         │
│                            │
│  [        CRAFT NOW      ] │ ← Button (disabled if can't craft)
│  [      VIEW STATS       ] │ ← Opens modal with unit stats
└────────────────────────────┘
```

### Crafting Queue Item (Component)

```
┌─────────────────────────────────────────────────┐
│ Super Tank Mk2                            [RARE]│
│ ████████████████░░░░░░░░░░░░ 65%               │ ← Progress bar
│ 42 minutes remaining                            │
│                                                 │
│ Resources consumed:                             │
│ 💰 8,000 Metal | ⚡ 3,000 Carburant | 🔩 100 Ti│
│                                                 │
│ [Cancel (50% refund)]  [⚡ Speedup (84 CT)]    │
└─────────────────────────────────────────────────┘
```

### Crafting Station Upgrade

```
┌──────────────────────────────────┐
│ 🔧 CRAFTING STATION              │
│                                  │
│ Current Level: 5                 │
│ Active Slots: 4 / 4              │
│ Max Rarity: Rare                 │
│                                  │
│ ────────────────────────────     │
│                                  │
│ UPGRADE TO LEVEL 6               │
│ Cost:                            │
│  💰 12,000 Metal                 │
│  ⚡ 6,000 Carburant              │
│  🔩 80 Titanium                  │
│                                  │
│ Duration: 3 hours                │
│                                  │
│ Unlocks:                         │
│  ✓ +1 Crafting Slot (5 total)   │
│  ✓ Epic rarity craftable         │
│                                  │
│ [      UPGRADE NOW      ]        │
└──────────────────────────────────┘
```

---

## 🔐 ANTI-CHEAT & SECURITY

### Validation Backend

```javascript
// craftingController.js - startCraft()
async startCraft(req, res) {
  const { blueprint_id, quantity = 1 } = req.body;
  const userId = req.user.id;
  
  // Validation 1: User owns blueprint
  const playerBlueprint = await PlayerBlueprint.findOne({ 
    where: { user_id: userId, blueprint_id } 
  });
  if (!playerBlueprint) {
    return res.status(403).json({ message: 'Blueprint not discovered' });
  }
  
  // Validation 2: Blueprint exists and active
  const blueprint = await Blueprint.findOne({ 
    where: { id: blueprint_id, is_active: true } 
  });
  if (!blueprint) {
    return res.status(404).json({ message: 'Blueprint not found or inactive' });
  }
  
  // Validation 3: Crafting Station level sufficient
  const station = await UserBuilding.findOne({
    where: { user_id: userId, type: 'crafting_station' }
  });
  if (!station || station.level < blueprint.crafting_station_level_min) {
    return res.status(400).json({ 
      message: `Crafting Station level ${blueprint.crafting_station_level_min} required` 
    });
  }
  
  // Validation 4: Unlock requirements met (research, buildings)
  const requirementsMet = await craftingService.checkUnlockRequirements(
    userId, 
    blueprint.unlock_requirements
  );
  if (!requirementsMet.valid) {
    return res.status(400).json({ 
      message: 'Requirements not met', 
      missing: requirementsMet.missing 
    });
  }
  
  // Validation 5: Resources available
  const hasResources = await craftingService.checkResourcesAvailable(
    userId, 
    blueprint.inputs
  );
  if (!hasResources.valid) {
    return res.status(400).json({ 
      message: 'Insufficient resources', 
      missing: hasResources.missing 
    });
  }
  
  // Validation 6: Free crafting slot
  const activeCount = await CraftingQueue.count({
    where: { 
      user_id: userId, 
      status: 'in_progress' 
    }
  });
  const maxSlots = station.level >= 15 ? 6 : (station.level >= 10 ? 5 : (station.level >= 5 ? 4 : 3));
  if (activeCount >= maxSlots) {
    return res.status(400).json({ 
      message: `Max ${maxSlots} crafts active. Cancel or wait for completion.` 
    });
  }
  
  // All validations passed → Start craft
  try {
    const craft = await craftingService.startCraft(userId, blueprint_id, quantity);
    
    // Emit real-time event
    req.io.to(`user_${userId}`).emit('craft:started', {
      craftId: craft.id,
      blueprintName: blueprint.name,
      completedAt: craft.completed_at
    });
    
    return res.status(201).json({ success: true, craft });
  } catch (error) {
    logger.error('Craft start failed', { error, userId, blueprint_id });
    return res.status(500).json({ message: 'Craft failed' });
  }
}
```

### Rate Limiting

```javascript
// Prevent abuse (spam craft starts)
const craftRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Max 10 craft starts/minute
  message: 'Too many craft attempts. Please slow down.'
});

router.post('/craft', protect, craftRateLimiter, craftingController.startCraft);
```

---

## 📚 TESTING STRATEGY

### Integration Tests (Jest)

```javascript
// backend/__tests__/crafting.integration.test.js

describe('Crafting System Integration', () => {
  let testUser, testBlueprint, craftingStation;
  
  beforeEach(async () => {
    testUser = await createTestUser();
    testBlueprint = await createTestBlueprint({
      name: 'Test Super Tank',
      rarity: 'rare',
      inputs: { resources_t1: { metal: 5000 } },
      duration_seconds: 3600
    });
    await grantBlueprintToUser(testUser.id, testBlueprint.id);
    craftingStation = await createCraftingStation(testUser.id, 5);
  });
  
  test('Should start craft successfully with valid blueprint and resources', async () => {
    await addResourcesToUser(testUser.id, { metal: 10000 });
    
    const response = await request(app)
      .post('/api/v1/crafting/craft')
      .set('Authorization', `Bearer ${testUser.token}`)
      .send({ blueprint_id: testBlueprint.id });
    
    expect(response.status).toBe(201);
    expect(response.body.craft).toBeDefined();
    expect(response.body.craft.status).toBe('in_progress');
    
    // Verify resources deducted
    const userResources = await getUserResources(testUser.id);
    expect(userResources.metal).toBe(5000); // 10000 - 5000
  });
  
  test('Should fail craft if insufficient resources', async () => {
    await addResourcesToUser(testUser.id, { metal: 1000 }); // Not enough
    
    const response = await request(app)
      .post('/api/v1/crafting/craft')
      .set('Authorization', `Bearer ${testUser.token}`)
      .send({ blueprint_id: testBlueprint.id });
    
    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Insufficient resources');
  });
  
  test('Should cancel craft and refund 50% resources', async () => {
    await addResourcesToUser(testUser.id, { metal: 10000 });
    
    const craftResponse = await request(app)
      .post('/api/v1/crafting/craft')
      .set('Authorization', `Bearer ${testUser.token}`)
      .send({ blueprint_id: testBlueprint.id });
    
    const craftId = craftResponse.body.craft.id;
    
    const cancelResponse = await request(app)
      .delete(`/api/v1/crafting/queue/${craftId}`)
      .set('Authorization', `Bearer ${testUser.token}`);
    
    expect(cancelResponse.status).toBe(200);
    expect(cancelResponse.body.cancelled).toBe(true);
    expect(cancelResponse.body.refund.metal).toBe(2500); // 50% of 5000
    
    // Verify refund added to user
    const userResources = await getUserResources(testUser.id);
    expect(userResources.metal).toBe(7500); // 5000 remaining + 2500 refund
  });
  
  test('Should complete craft and award items', async () => {
    await addResourcesToUser(testUser.id, { metal: 10000 });
    
    const craftResponse = await request(app)
      .post('/api/v1/crafting/craft')
      .set('Authorization', `Bearer ${testUser.token}`)
      .send({ blueprint_id: testBlueprint.id });
    
    const craftId = craftResponse.body.craft.id;
    
    // Simulate time passing (set completed_at to past)
    await CraftingQueue.update(
      { completed_at: new Date(Date.now() - 1000) }, // 1 sec ago
      { where: { id: craftId } }
    );
    
    // Run cron job
    const processedCount = await craftingService.processCompletedCrafts();
    expect(processedCount).toBe(1);
    
    // Verify craft marked completed
    const craft = await CraftingQueue.findByPk(craftId);
    expect(craft.status).toBe('completed');
    
    // Verify XP awarded
    const stats = await PlayerCraftingStats.findOne({ where: { user_id: testUser.id } });
    expect(stats.crafting_xp).toBe(150); // Blueprint reward
    expect(stats.total_crafts_completed).toBe(1);
  });
  
  test('Should fail craft if max slots reached', async () => {
    await addResourcesToUser(testUser.id, { metal: 50000 });
    
    // Start 4 crafts (max for station lv5)
    for (let i = 0; i < 4; i++) {
      await request(app)
        .post('/api/v1/crafting/craft')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({ blueprint_id: testBlueprint.id });
    }
    
    // Try 5th craft (should fail)
    const response = await request(app)
      .post('/api/v1/crafting/craft')
      .set('Authorization', `Bearer ${testUser.token}`)
      .send({ blueprint_id: testBlueprint.id });
    
    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Max 4 crafts active');
  });
});
```

---

## 🎯 CONCLUSION

Le **Crafting & Blueprints System** est la pièce maîtresse de la progression long-terme dans Terra Dominus. Il transforme le jeu d'un simple "build & attack" en un MMO avec :

✅ **Depth** : 10+ heures de contenu craft (découverte, collecte, optimisation)  
✅ **Progression** : Unlock graduel d'items puissants via gameplay, pas P2W  
✅ **Économie saine** : Sink efficace de ressources T2 (60%+ consommées)  
✅ **Engagement** : Boucle addictive (Discover → Collect → Craft → Upgrade)  
✅ **Monétisation** : Speedups + cosmétiques (éthique, non-invasif)

**Priorité Phase 2 :** Implémentation immédiate après T2 Resources (dépendance directe).

**Estimation finale :** 150h (3-4 semaines, 2 devs) | Budget : 8,500€

---

**Préparé par :** Architecture Lead  
**Pour :** Terra Dominus Development Team  
**Version :** 1.0 — Design Document Complet  
**Date :** 30 novembre 2025
