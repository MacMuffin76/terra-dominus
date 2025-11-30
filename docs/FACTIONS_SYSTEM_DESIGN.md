# Factions & Territorial Bonuses System - Design Document

**Version:** 1.0  
**Date:** 30 novembre 2025  
**Status:** Design Phase  
**Implémentation estimée:** 80h (Semaine 8, Phase 2)

---

## 1. VISION & OBJECTIFS

### 1.1 Concept Core

Le système de Factions ajoute une **couche méta-stratégique** au jeu en créant trois super-alliances permanentes avec identités uniques, bonus passifs différenciés, et objectifs de domination territoriale globaux.

**Inspirations:**
- **EVE Online**: Factions nullsec avec contrôle territorial
- **Planetside 2**: 3 factions asymétriques en guerre permanente
- **World of Warcraft**: Horde vs Alliance (rivalité narrative)

### 1.2 Objectifs Gameplay

| Objectif | Description | Impact Rétention |
|----------|-------------|------------------|
| **Identité joueur** | Choix faction = personnalisation stratégique | +15% J7 (appartenance) |
| **Objectifs collectifs** | Capturer zones = bonus faction-wide | +25% J30 (endgame) |
| **Rivalité emergente** | Guerres inter-factions naturelles | +30% engagement social |
| **Spécialisation** | 3 playstyles distincts (militaire, économique, défensif) | +20% session time |

### 1.3 Non-Objectifs

- ❌ Pas de changement de faction fréquent (cooldown 30 jours)
- ❌ Pas de déséquilibre P2W (bonus équilibrés)
- ❌ Pas de lock content (toutes factions accèdent même contenu)

---

## 2. DESIGN DES 3 FACTIONS

### 2.1 TERRAN FEDERATION (Défense & Technologie)

**Identité:** Humains technologues, maîtres de la fortification et recherche scientifique.

**Couleur thème:** 🔵 Bleu (high-tech)

**Bonus Passifs (Faction-wide):**
```javascript
const TERRAN_BONUSES = {
  defense: 1.15,              // +15% puissance défenses
  building_speed_research: 1.1, // +10% vitesse labo recherche
  shield_regen: 1.2,          // +20% regen boucliers (si implémenté)
  tech_cost_reduction: 0.95   // -5% coût recherches
};
```

**Unité unique:** `Shield Guardian` (défenseur lourd, +50% HP, -20% vitesse)

**Capitale:** Coordonnées `(50, 50)` — "New Terra Prime"

**Philosophie:** *"Science et ordre protègent l'humanité."*

**Joueurs cibles:** Builders, défenseurs, joueurs PvE focus

---

### 2.2 NOMAD RAIDERS (Attaque & Mobilité)

**Identité:** Pillards du désert, mobilité extrême et puissance offensive.

**Couleur thème:** 🔴 Rouge (agression)

**Bonus Passifs:**
```javascript
const NOMAD_BONUSES = {
  attack: 1.20,               // +20% puissance attaque
  movement_speed: 1.15,       // +15% vitesse déplacement unités
  raid_loot: 1.10,            // +10% ressources pillées
  training_speed_military: 1.1 // +10% vitesse caserne
};
```

**Unité unique:** `Desert Raider` (cavalerie rapide, +30% vitesse, -10% défense)

**Capitale:** Coordonnées `(150, 50)` — "Sandstorm Citadel"

**Philosophie:** *"La vitesse et la force sont les seules lois."*

**Joueurs cibles:** PvP agressifs, raiders, joueurs solo skill-based

---

### 2.3 INDUSTRIAL SYNDICATE (Économie & Production)

**Identité:** Commerçants industriels, domination économique et efficacité.

**Couleur thème:** 🟡 Jaune/Or (richesse)

**Bonus Passifs:**
```javascript
const SYNDICATE_BONUSES = {
  production: 1.25,           // +25% production ressources
  trade_tax_reduction: 0.5,   // -50% taxes commerciales
  market_fee_reduction: 0.7,  // -30% frais marché
  construction_cost: 0.95     // -5% coût constructions
};
```

**Unité unique:** `Corporate Enforcer` (infanterie polyvalente, bonus vs bâtiments)

**Capitale:** Coordonnées `(100, 150)` — "Trade Hub Omega"

**Philosophie:** *"L'or construit des empires plus sûrement que l'acier."*

**Joueurs cibles:** Traders, farmers, joueurs économie focus

---

## 3. SYSTÈME DE CONTRÔLE TERRITORIAL

### 3.1 Zones de Contrôle (Control Zones)

**Carte divisée en 20+ zones stratégiques:**

```javascript
const CONTROL_ZONES = {
  // Zones Centrales (haute valeur)
  CENTRAL_HIGHLANDS: {
    id: 1,
    name: "Highlands Centraux",
    coordinates: { x: 100, y: 100, radius: 30 },
    control_threshold: 1000,  // Points pour capturer
    current_controller: null, // null = neutral
    bonuses: {
      metal: 1.15,            // +15% production métal faction
      defense: 1.10           // +10% défense faction
    },
    strategic_value: 5        // 1-5 (importance)
  },
  
  TITANIUM_CRATER: {
    id: 2,
    name: "Cratère de Titanium",
    coordinates: { x: 150, y: 80, radius: 25 },
    control_threshold: 1500,
    current_controller: null,
    bonuses: {
      titanium: 2.0,          // x2 production titanium
      research_speed: 1.05
    },
    strategic_value: 5
  },

  // Zones Périphériques (valeur moyenne)
  NORTHERN_DESERT: {
    id: 3,
    name: "Désert du Nord",
    coordinates: { x: 100, y: 50, radius: 40 },
    control_threshold: 750,
    current_controller: 'NOMAD_RAIDERS', // Contrôlé initialement
    bonuses: {
      movement_speed: 1.10,
      carburant: 1.20
    },
    strategic_value: 3
  },

  INDUSTRIAL_BELT: {
    id: 4,
    name: "Ceinture Industrielle",
    coordinates: { x: 120, y: 130, radius: 35 },
    control_threshold: 800,
    current_controller: 'INDUSTRIAL_SYNDICATE',
    bonuses: {
      production: 1.20,
      construction_speed: 1.10
    },
    strategic_value: 4
  },

  RESEARCH_VALLEY: {
    id: 5,
    name: "Vallée de Recherche",
    coordinates: { x: 60, y: 70, radius: 30 },
    control_threshold: 900,
    current_controller: 'TERRAN_FEDERATION',
    bonuses: {
      research_speed: 1.25,
      tech_cost: 0.90
    },
    strategic_value: 4
  }
};
```

**Total zones:** 20-25 pour une map 200x200

### 3.2 Mécanique de Capture

**Points de Contrôle:**
- **Construction dans zone:** +10 points/bâtiment niveau 5+
- **Présence militaire:** +5 points/1000 puissance unités stationnées
- **Victoire attaque:** +20 points par raid réussi dans zone
- **Commerce actif:** +3 points/convoi passant par zone

**Capture:**
```javascript
// Faction atteint threshold → zone change de contrôleur
if (factionControlPoints[factionId] >= zone.control_threshold) {
  zone.current_controller = factionId;
  zone.captured_at = Date.now();
  
  // Notification globale
  io.emit('zone_captured', {
    zone: zone.name,
    faction: factionId,
    bonuses: zone.bonuses
  });
  
  // Bonus appliqués immédiatement à tous les membres faction
  applyFactionBonuses(factionId, zone.bonuses);
}
```

**Contestation:**
- Une zone peut être **contestée** si 2+ factions ont >50% du threshold
- Status: `neutral` → `contested` → `controlled`
- Période de contestation: 48h minimum avant flip

### 3.3 Calcul Bonus Cumulatifs

**Exemple: Faction Terran contrôle 5 zones**

```javascript
// Bonus de base faction
const baseBonuses = TERRAN_BONUSES; // { defense: 1.15, ... }

// Bonus zones contrôlées
const zonesBonuses = [
  { defense: 1.10 },     // Zone 1
  { metal: 1.15 },       // Zone 2
  { research_speed: 1.25 }, // Zone 3
  // ...
];

// Agrégation multiplicative
const finalBonuses = {
  defense: 1.15 * 1.10 = 1.265,    // +26.5% total
  metal: 1.0 * 1.15 = 1.15,        // +15%
  research_speed: 1.0 * 1.25 = 1.25 // +25%
};

// Appliqué à tous les joueurs Terran
users.filter(u => u.faction === 'TERRAN_FEDERATION').forEach(user => {
  user.active_bonuses = finalBonuses;
});
```

**Limites équilibrage:**
- **Max bonus cumulé:** +50% pour éviter snowball
- **Diminishing returns:** Chaque zone additionnelle = 90% efficacité
  - Zone 1: 100% bonus
  - Zone 2: 90% bonus
  - Zone 3: 81% bonus
  - Etc.

---

## 4. DATABASE SCHEMA

### 4.1 Table: `factions`

Factions statiques (3 factions codées en dur, rarement modifiées).

```sql
CREATE TABLE factions (
  id VARCHAR(50) PRIMARY KEY,  -- 'TERRAN_FEDERATION', 'NOMAD_RAIDERS', 'INDUSTRIAL_SYNDICATE'
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7),             -- Hex color (#0066FF)
  capital_x INTEGER,
  capital_y INTEGER,
  
  -- Bonus JSON
  bonuses JSONB NOT NULL DEFAULT '{}',
  -- { "defense": 1.15, "building_speed_research": 1.1, ... }
  
  -- Unité unique
  unique_unit_type VARCHAR(50),
  unique_unit_stats JSONB,
  
  -- Meta
  lore TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed data (3 factions)
INSERT INTO factions (id, name, description, color, capital_x, capital_y, bonuses, unique_unit_type, lore) VALUES
('TERRAN_FEDERATION', 'Terran Federation', 'Defenders of humanity through science and order', '#0066FF', 50, 50, '{"defense": 1.15, "building_speed_research": 1.1}', 'Shield_Guardian', 'Science and order protect humanity.'),
('NOMAD_RAIDERS', 'Nomad Raiders', 'Desert warriors valuing speed and strength', '#FF3333', 150, 50, '{"attack": 1.20, "movement_speed": 1.15, "raid_loot": 1.10}', 'Desert_Raider', 'Speed and strength are the only laws.'),
('INDUSTRIAL_SYNDICATE', 'Industrial Syndicate', 'Economic powerhouse controlling trade routes', '#FFD700', 100, 150, '{"production": 1.25, "trade_tax_reduction": 0.5, "market_fee_reduction": 0.7}', 'Corporate_Enforcer', 'Gold builds empires more surely than steel.');
```

### 4.2 Table: `control_zones`

Zones territoriales stratégiques.

```sql
CREATE TABLE control_zones (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  
  -- Géographie
  center_x INTEGER NOT NULL,
  center_y INTEGER NOT NULL,
  radius INTEGER NOT NULL DEFAULT 30,  -- Rayon zone influence
  
  -- Contrôle
  current_controller VARCHAR(50) REFERENCES factions(id) ON DELETE SET NULL,
  control_threshold INTEGER NOT NULL DEFAULT 1000,
  captured_at TIMESTAMPTZ,
  
  -- Bonus conférés
  bonuses JSONB NOT NULL DEFAULT '{}',
  -- { "metal": 1.15, "defense": 1.10 }
  
  -- Importance stratégique
  strategic_value INTEGER DEFAULT 3 CHECK (strategic_value BETWEEN 1 AND 5),
  
  -- Status
  status VARCHAR(20) DEFAULT 'neutral' CHECK (status IN ('neutral', 'contested', 'controlled')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_control_zones_controller ON control_zones(current_controller);
CREATE INDEX idx_control_zones_coordinates ON control_zones(center_x, center_y);
```

### 4.3 Table: `faction_control_points`

Points de contrôle accumulés par faction dans chaque zone.

```sql
CREATE TABLE faction_control_points (
  id SERIAL PRIMARY KEY,
  zone_id INTEGER NOT NULL REFERENCES control_zones(id) ON DELETE CASCADE,
  faction_id VARCHAR(50) NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
  
  -- Points
  control_points INTEGER NOT NULL DEFAULT 0,
  
  -- Contributions détaillées (analytics)
  points_buildings INTEGER DEFAULT 0,
  points_military INTEGER DEFAULT 0,
  points_attacks INTEGER DEFAULT 0,
  points_trade INTEGER DEFAULT 0,
  
  last_contribution_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(zone_id, faction_id)
);

CREATE INDEX idx_faction_control_points_zone ON faction_control_points(zone_id);
CREATE INDEX idx_faction_control_points_faction ON faction_control_points(faction_id);
```

### 4.4 Table: `user_factions`

Lien joueurs ↔ factions (many-to-one, avec historique).

```sql
CREATE TABLE user_factions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  faction_id VARCHAR(50) NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
  
  -- Dates
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,  -- NULL si actif
  
  -- Contributions personnelles
  contribution_points INTEGER DEFAULT 0,
  
  -- Cooldown changement faction
  can_change_at TIMESTAMPTZ,  -- NULL = peut changer, sinon date future
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  CONSTRAINT user_active_faction_unique UNIQUE(user_id, is_active) WHERE is_active = TRUE
);

CREATE INDEX idx_user_factions_user ON user_factions(user_id);
CREATE INDEX idx_user_factions_faction ON user_factions(faction_id) WHERE is_active = TRUE;
```

### 4.5 Table: `faction_war_history`

Historique guerres inter-factions (optionnel, analytics).

```sql
CREATE TABLE faction_war_history (
  id SERIAL PRIMARY KEY,
  attacker_faction VARCHAR(50) NOT NULL REFERENCES factions(id),
  defender_faction VARCHAR(50) NOT NULL REFERENCES factions(id),
  
  zone_id INTEGER REFERENCES control_zones(id) ON DELETE SET NULL,
  
  -- Résultat
  outcome VARCHAR(20) CHECK (outcome IN ('attacker_victory', 'defender_victory', 'stalemate')),
  
  -- Stats
  attacks_count INTEGER DEFAULT 0,
  resources_pillaged BIGINT DEFAULT 0,
  
  war_started_at TIMESTAMPTZ DEFAULT NOW(),
  war_ended_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. GAME LOGIC & RÈGLES

### 5.1 Choix Faction Initial

**Quand:** À la création du compte OU après tutoriel (niveau 5).

**Restriction:** Choix permanent pendant 30 jours (cooldown changement).

**UI Flow:**
```javascript
// POST /api/v1/factions/join
{
  "factionId": "TERRAN_FEDERATION"
}

// Vérifie:
// 1. Utilisateur n'a pas déjà faction active
// 2. Cooldown expiré si changement
// 3. Faction existe

// Crée entrée user_factions
// Applique bonus faction immédiatement
```

**Recommandation IA:**
```javascript
const FACTION_RECOMMENDATIONS = {
  TERRAN_FEDERATION: {
    playstyle: ['defensive', 'builder', 'research'],
    difficulty: 'medium',
    recommended_for: 'Joueurs préférant défense et technologie'
  },
  NOMAD_RAIDERS: {
    playstyle: ['aggressive', 'pvp', 'raider'],
    difficulty: 'hard',
    recommended_for: 'Joueurs PvP expérimentés'
  },
  INDUSTRIAL_SYNDICATE: {
    playstyle: ['economic', 'trader', 'farmer'],
    difficulty: 'easy',
    recommended_for: 'Nouveaux joueurs, focus économie'
  }
};
```

### 5.2 Accumulation Points de Contrôle

**Contribution automatique lors d'actions:**

```javascript
// Event: User construit bâtiment niveau 5+
async function onBuildingUpgraded(userId, building) {
  if (building.level < 5) return;
  
  const user = await getUserWithFaction(userId);
  const zone = await getZoneContainingCoordinates(building.x, building.y);
  
  if (zone && user.faction) {
    await addControlPoints(zone.id, user.faction, 10, 'building');
    await incrementUserContribution(userId, 10);
  }
}

// Event: User gagne attaque
async function onAttackVictory(attackerId, targetId, loot) {
  const attacker = await getUserWithFaction(attackerId);
  const target = await User.findByPk(targetId);
  const zone = await getZoneContainingCoordinates(target.x, target.y);
  
  if (zone && attacker.faction) {
    await addControlPoints(zone.id, attacker.faction, 20, 'attack');
    await incrementUserContribution(attackerId, 20);
  }
}

// Event: Convoi commercial passe par zone
async function onTradeConvoyPassed(userId, convoyId, zoneId) {
  const user = await getUserWithFaction(userId);
  if (user.faction) {
    await addControlPoints(zoneId, user.faction, 3, 'trade');
    await incrementUserContribution(userId, 3);
  }
}
```

### 5.3 Capture & Flip de Zone

**Vérification périodique (cron job toutes les heures):**

```javascript
async function checkZoneControl() {
  const zones = await ControlZone.findAll();
  
  for (const zone of zones) {
    const factionPoints = await FactionControlPoints.findAll({
      where: { zone_id: zone.id },
      order: [['control_points', 'DESC']]
    });
    
    const topFaction = factionPoints[0];
    const secondFaction = factionPoints[1];
    
    // Cas 1: Capture claire (1 faction > threshold)
    if (topFaction.control_points >= zone.control_threshold) {
      if (zone.current_controller !== topFaction.faction_id) {
        await captureZone(zone, topFaction.faction_id);
      }
    }
    
    // Cas 2: Contestation (2+ factions > 50% threshold)
    else if (
      topFaction.control_points >= zone.control_threshold * 0.5 &&
      secondFaction?.control_points >= zone.control_threshold * 0.5
    ) {
      if (zone.status !== 'contested') {
        zone.status = 'contested';
        await zone.save();
        io.emit('zone_contested', { zone: zone.name, factions: [topFaction.faction_id, secondFaction.faction_id] });
      }
    }
    
    // Cas 3: Neutre (aucune faction dominante)
    else {
      if (zone.status !== 'neutral') {
        zone.status = 'neutral';
        zone.current_controller = null;
        await zone.save();
      }
    }
  }
}

async function captureZone(zone, factionId) {
  const previousController = zone.current_controller;
  
  zone.current_controller = factionId;
  zone.status = 'controlled';
  zone.captured_at = new Date();
  await zone.save();
  
  // Log historique
  await FactionWarHistory.create({
    attacker_faction: factionId,
    defender_faction: previousController,
    zone_id: zone.id,
    outcome: 'attacker_victory'
  });
  
  // Notification globale + sons dramatiques
  io.emit('zone_captured', {
    zone: zone.name,
    new_controller: factionId,
    previous_controller: previousController,
    bonuses: zone.bonuses
  });
  
  // Recalculer bonus tous joueurs factions affectées
  await recalculateFactionBonuses(factionId);
  if (previousController) await recalculateFactionBonuses(previousController);
}
```

### 5.4 Application Bonus

**Bonus stockés dans `users` table (colonne JSONB):**

```sql
ALTER TABLE users ADD COLUMN active_bonuses JSONB DEFAULT '{}';
-- { "defense": 1.265, "metal": 1.15, ... }
```

**Recalcul lors de:**
- Joueur rejoint faction
- Faction capture/perd zone
- Changement faction joueur

```javascript
async function recalculateFactionBonuses(factionId) {
  const faction = await Faction.findByPk(factionId);
  const controlledZones = await ControlZone.findAll({
    where: { current_controller: factionId }
  });
  
  // Bonus de base
  let aggregatedBonuses = { ...faction.bonuses };
  
  // Ajouter bonus zones (avec diminishing returns)
  controlledZones.forEach((zone, index) => {
    const effectiveness = Math.pow(0.9, index); // 90% chaque zone
    
    Object.entries(zone.bonuses).forEach(([key, value]) => {
      const bonusMultiplier = (value - 1) * effectiveness + 1;
      aggregatedBonuses[key] = (aggregatedBonuses[key] || 1.0) * bonusMultiplier;
    });
  });
  
  // Cap max bonus +50%
  Object.keys(aggregatedBonuses).forEach(key => {
    aggregatedBonuses[key] = Math.min(aggregatedBonuses[key], 1.5);
  });
  
  // Appliquer à tous les joueurs faction
  await User.update(
    { active_bonuses: aggregatedBonuses },
    { where: { '$UserFaction.faction_id$': factionId, '$UserFaction.is_active$': true },
      include: [{ model: UserFaction, as: 'UserFaction', where: { is_active: true } }]
    }
  );
  
  return aggregatedBonuses;
}
```

**Utilisation bonus dans gamelogic:**

```javascript
// Exemple: Calcul production ressources
const baseProduction = building.production_rate;
const factionBonus = user.active_bonuses.production || 1.0;
const finalProduction = baseProduction * factionBonus;
```

---

## 6. API ENDPOINTS

### 6.1 Faction Management

```javascript
// GET /api/v1/factions
// Liste toutes les factions avec stats globales
{
  "factions": [
    {
      "id": "TERRAN_FEDERATION",
      "name": "Terran Federation",
      "color": "#0066FF",
      "total_members": 1523,
      "zones_controlled": 8,
      "total_control_points": 15230,
      "bonuses": { "defense": 1.15, ... }
    },
    // ...
  ]
}

// GET /api/v1/factions/:factionId
// Détails faction spécifique
{
  "id": "TERRAN_FEDERATION",
  "name": "Terran Federation",
  "description": "...",
  "lore": "...",
  "bonuses": { ... },
  "unique_unit": { ... },
  "zones_controlled": [
    { "id": 1, "name": "Central Highlands", "bonuses": { ... } }
  ],
  "leaderboard": [
    { "rank": 1, "username": "Player1", "contribution_points": 5230 }
  ]
}

// POST /api/v1/factions/join
// Rejoindre faction
{
  "factionId": "NOMAD_RAIDERS"
}

// POST /api/v1/factions/leave
// Quitter faction (cooldown 30j)
{}

// GET /api/v1/factions/my-faction
// Faction actuelle utilisateur
{
  "faction": { ... },
  "joined_at": "2025-11-01T...",
  "contribution_points": 230,
  "can_change_at": "2025-12-01T..." // Cooldown
}
```

### 6.2 Control Zones

```javascript
// GET /api/v1/control-zones
// Liste toutes les zones
{
  "zones": [
    {
      "id": 1,
      "name": "Central Highlands",
      "center_x": 100,
      "center_y": 100,
      "radius": 30,
      "current_controller": "TERRAN_FEDERATION",
      "status": "controlled",
      "bonuses": { "metal": 1.15, "defense": 1.10 },
      "control_progress": {
        "TERRAN_FEDERATION": 1200,  // Points actuels
        "NOMAD_RAIDERS": 450,
        "INDUSTRIAL_SYNDICATE": 200
      }
    },
    // ...
  ]
}

// GET /api/v1/control-zones/:zoneId
// Détails zone
{
  "zone": { ... },
  "control_history": [
    { "faction": "TERRAN_FEDERATION", "captured_at": "2025-11-15T...", "duration_hours": 120 }
  ],
  "top_contributors": [
    { "username": "Player1", "faction": "TERRAN_FEDERATION", "points": 350 }
  ]
}

// GET /api/v1/control-zones/near?x=100&y=100&radius=50
// Zones proches coordonnées
{
  "zones": [ ... ]
}
```

### 6.3 Contributions

```javascript
// GET /api/v1/factions/contributions/my-contributions
// Contributions personnelles
{
  "total_points": 1523,
  "breakdown": {
    "buildings": 1200,
    "attacks": 280,
    "trade": 43
  },
  "rank_in_faction": 142,
  "zones_contributed": [
    { "zone_name": "Central Highlands", "points": 450 }
  ]
}

// GET /api/v1/factions/:factionId/leaderboard
// Top contributeurs faction
{
  "leaderboard": [
    { "rank": 1, "username": "TopPlayer", "contribution_points": 8520, "zones_contributed": 12 },
    // ...
  ]
}
```

---

## 7. FRONTEND UI/UX

### 7.1 Écran Choix Faction (Onboarding)

**Wireframe:**
```
┌─────────────────────────────────────────────────────────────┐
│  CHOISISSEZ VOTRE FACTION                     [Skip for now] │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐            │
│  │ 🔵 TERRAN │     │ 🔴 NOMAD  │     │ 🟡 SYNDIC │            │
│  │FEDERATION│     │ RAIDERS   │     │   ATE     │            │
│  └──────────┘     └──────────┘     └──────────┘            │
│                                                               │
│  Defense & Tech   Attack & Speed   Economy & Trade           │
│  ───────────────────────────────────────────────────────     │
│  ✓ +15% Defense   ✓ +20% Attack    ✓ +25% Production        │
│  ✓ +10% Research  ✓ +15% Movement  ✓ -50% Trade Tax         │
│  ✓ Shield Regen   ✓ +10% Loot      ✓ -30% Market Fees       │
│                                                               │
│  [  SELECT  ]     [  SELECT  ]     [  SELECT  ]              │
│                                                               │
│  ⚠️  You can change faction once every 30 days               │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Vue Carte Zones de Contrôle

**Overlay carte monde:**
```
┌─────────────────────────────────────────────────────────────┐
│  WORLD MAP                                  [Toggle Zones ✓] │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│         ╔═════════════╗                                      │
│         ║  🔵 Zone 1  ║  ← Terran (1200/1000 pts)           │
│         ║ +15% Metal  ║                                      │
│         ╚═════════════╝                                      │
│                                                               │
│    ╔═════════════╗         ╔═════════════╗                  │
│    ║  ⚔️ Zone 2  ║         ║  🟡 Zone 3  ║                  │
│    ║ CONTESTED!  ║         ║ +25% Prod   ║                  │
│    ╚═════════════╝         ╚═════════════╝                  │
│     Terran: 800pts           Syndicate (950/800)             │
│     Nomad: 750pts                                            │
│                                                               │
│  Legend: 🔵 Terran  🔴 Nomad  🟡 Syndicate  ⚔️ Contested     │
└─────────────────────────────────────────────────────────────┘
```

### 7.3 Dashboard Faction

**Nouvel onglet "Faction":**
```
┌─────────────────────────────────────────────────────────────┐
│  🔵 TERRAN FEDERATION                          [Leave Faction]│
├─────────────────────────────────────────────────────────────┤
│  Your Contribution: 1,523 pts  │  Rank: #142 / 1,523 members │
│                                                               │
│  ACTIVE BONUSES (Your faction controls 8 zones)              │
│  ─────────────────────────────────────────────────────────  │
│  ✓ Defense: +26.5%   ✓ Metal Production: +15%               │
│  ✓ Research Speed: +25%   ✓ Tech Cost: -5%                  │
│                                                               │
│  CONTROLLED ZONES (8)                                         │
│  ─────────────────────────────────────────────────────────  │
│  • Central Highlands (+15% Metal, +10% Defense)              │
│  • Research Valley (+25% Research Speed)                     │
│  • ... (6 more zones)                                        │
│                                                               │
│  FACTION LEADERBOARD (Top Contributors)                      │
│  ─────────────────────────────────────────────────────────  │
│  1. SuperBuilder     8,520 pts                               │
│  2. TankCommander    7,320 pts                               │
│  3. TechLord         6,100 pts                               │
│  ...                                                          │
│  142. You            1,523 pts                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. BALANCING & TUNING

### 8.1 Équilibrage Bonus

**Tests A/B nécessaires sur bonus values:**

| Bonus Type | Version A | Version B | Gagnant |
|------------|-----------|-----------|---------|
| Defense Terran | +15% | +20% | TBD (A si Terran underpicked) |
| Attack Nomad | +20% | +18% | TBD (B si Nomad OP) |
| Production Syndicate | +25% | +30% | TBD |

**Méthode:**
- Lancer 2 serveurs parallèles (A/B)
- Mesurer win-rate PvP par faction
- Ajuster si faction >55% winrate sur 1000 combats

### 8.2 Diminishing Returns Tuning

**Formule actuelle:** `effectiveness = 0.9^zone_index`

**Alternatives à tester:**
```javascript
// Option 1: Linear decay
effectiveness = 1.0 - (zone_index * 0.05); // -5% par zone

// Option 2: Logarithmic
effectiveness = 1.0 / Math.log2(zone_index + 2);

// Option 3: Cap fixe
effectiveness = zone_index <= 5 ? 1.0 : 0.5; // Full bonus pour 5 premières zones
```

### 8.3 Cooldown Changement Faction

**Propositions:**
- **30 jours** (actuel) — sévère, engagement long-terme
- **14 jours** — modéré, permet expérimentation
- **7 jours + coût 10k or** — flexible mais pénalisant

**Metrics à surveiller:**
- % joueurs changent faction < 1 mois
- Balance population (objectif: 30-35-35% répartition)

---

## 9. ÉVÉNEMENTS & SAISONNALITÉ

### 9.1 Faction Wars Events (Mensuel)

**Event:** "Faction Supremacy Month"

**Mécanique:**
- Durée: 1 mois
- Objectif: Faction avec plus de zones à fin mois = gagne
- Récompenses:
  - **1ère faction:** Tous membres reçoivent 500 CT + cosmétique unique
  - **2ème faction:** 200 CT
  - **3ème faction:** 50 CT + badge "Vaillant Défenseur"

**Impact:**
- Augmente engagement +60% pendant event
- Crée pics activité fin de mois (rush capture zones)

### 9.2 Contested Zone Alerts

**Notification push/in-game:**
```javascript
io.to(`faction_${factionId}`).emit('zone_alert', {
  type: 'contested',
  zone: 'Central Highlands',
  message: 'ALERTE! Zone contestée par Nomad Raiders! Défendez le territoire!',
  call_to_action: 'Contribuer maintenant',
  urgency: 'high'
});
```

---

## 10. ANALYTICS & MÉTRIQUES

### 10.1 KPIs à Tracker

```javascript
const FACTION_METRICS = {
  // Engagement
  avg_contribution_per_user: 'SUM(contribution_points) / COUNT(user_id)',
  daily_active_contributors: 'COUNT(DISTINCT user_id WHERE last_contribution_at > NOW() - INTERVAL 24h)',
  
  // Balance
  faction_population_ratio: 'COUNT(users) GROUP BY faction_id',
  faction_win_rate_pvp: 'COUNT(attacks WHERE outcome = victory) / COUNT(attacks)',
  
  // Territorial
  avg_zone_control_duration: 'AVG(zone_flip_timestamp_diff)',
  zones_per_faction: 'COUNT(zones) GROUP BY current_controller',
  contested_zones_count: 'COUNT(zones WHERE status = contested)',
  
  // Rétention
  retention_faction_vs_no_faction: 'D7_retention GROUP BY has_faction',
  retention_by_faction: 'D7_retention GROUP BY faction_id'
};
```

### 10.2 Dashboards Grafana

**Panel 1: Faction Population Balance**
```promql
sum(user_factions_active_count) by (faction_id)
```

**Panel 2: Zone Control Heatmap**
```sql
SELECT faction_id, zone_id, control_points
FROM faction_control_points
```

**Panel 3: Top Contributors (Live)**
```sql
SELECT username, faction_id, contribution_points
FROM users JOIN user_factions ON users.id = user_factions.user_id
WHERE user_factions.is_active = TRUE
ORDER BY contribution_points DESC
LIMIT 100
```

---

## 11. IMPLÉMENTATION ROADMAP

### Phase 1: Backend Core (3 jours / 24h)

- [x] Design document (actuel)
- [ ] Migration database (4 tables)
- [ ] Models Sequelize (Faction, ControlZone, UserFaction, FactionControlPoints)
- [ ] FactionRepository (15 méthodes)
- [ ] FactionService (business logic, bonus calculation)

### Phase 2: API & Routes (2 jours / 16h)

- [ ] FactionController (8 endpoints)
- [ ] Routes + DI container
- [ ] Tests intégration (20 test cases)

### Phase 3: Game Logic Integration (2 jours / 16h)

- [ ] Hooks contribution points (building, attack, trade)
- [ ] Cron job zone control check
- [ ] Bonus application dans production/combat
- [ ] Cooldown changement faction

### Phase 4: Frontend UI (3 jours / 24h)

- [ ] Écran choix faction (onboarding)
- [ ] Dashboard faction
- [ ] Overlay carte zones
- [ ] Notifications zone alerts

**Total:** 10 jours / 80h

---

## 12. RISQUES & MITIGATION

| Risque | Impact | Probabilité | Mitigation |
|--------|--------|-------------|------------|
| **Déséquilibre factions** | Élevé | 70% | A/B testing, tuning continu |
| **Snowball effect** (faction dominante imbattable) | Critique | 50% | Diminishing returns, cap +50% bonus |
| **Population inégale** (1 faction >50% joueurs) | Moyen | 40% | Incentives rejoindre underdogs (+10% XP) |
| **Changement faction exploit** (farm bonus) | Faible | 20% | Cooldown 30j, coût économique |
| **Complexité UI** (joueurs confus) | Moyen | 30% | Tutoriel interactif, tooltips clairs |

---

## 13. POST-LAUNCH ITERATIONS

### V1.1: Alliance-Faction Synergies
- Alliances peuvent "pledge" à faction (+5% bonus si majorité membres même faction)

### V1.2: Faction Capitals
- Capitales faction attaquables (siège 7 jours, super loot si victoire)

### V1.3: Unique Units Implementation
- Débloquer Shield Guardian / Desert Raider / Corporate Enforcer via recherches

### V1.4: Diplomatic Actions
- Factions peuvent déclarer trêves temporaires (48h, vote leaders alliances)

---

## 14. CONCLUSION

Le système Factions & Territorial Bonuses ajoute une **couche stratégique profonde** avec objectifs collectifs, spécialisation gameplay, et rivalité émergente naturelle.

**ROI attendu:**
- **Rétention J30:** +25% (objectifs long-terme)
- **Session time:** +30% (nouveau contenu à explorer)
- **Engagement social:** +40% (coordination faction)

**Prochaine étape:** Migration database + implémentation backend (24h).

---

**Préparé par:** GitHub Copilot  
**Date:** 30 novembre 2025  
**Version:** 1.0 — Design Complete
