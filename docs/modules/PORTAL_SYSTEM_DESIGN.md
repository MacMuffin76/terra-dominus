# Portal System Design Document

## Overview
The Portal System introduces PvE content through dimensional rifts that spawn enemies and grant rewards. Players can challenge portals of increasing difficulty for progression and loot.

## Portal Tiers

### 1. Grey Portal (Starter)
**Level Requirement:** 1-10  
**Difficulty:** Very Easy  
**Enemy Strength:** 50-100 power  
**Rewards:**
- Basic resources (100-500 each)
- Common blueprints (5% drop rate)
- Experience: 100-250 XP
- Gold: 50-150

**Spawn Mechanics:**
- Frequency: High (every 2-4 hours)
- Duration: 24 hours
- Respawn: Yes
- Location: Near player bases (safe zones)

**Enemy Types:**
- Scouts (Infantry-based)
- Weak Drones
- Resource Gatherers

---

### 2. Green Portal (Beginner)
**Level Requirement:** 10-20  
**Difficulty:** Easy  
**Enemy Strength:** 200-500 power  
**Rewards:**
- Standard resources (500-1500 each)
- Uncommon blueprints (10% drop rate)
- T2 resource fragments (20% chance)
- Experience: 300-600 XP
- Gold: 150-400

**Spawn Mechanics:**
- Frequency: Medium (every 4-8 hours)
- Duration: 36 hours
- Respawn: Yes
- Location: Neutral territories

**Enemy Types:**
- Raiders (Mixed units)
- Guard Drones
- Fortified Positions

---

### 3. Blue Portal (Intermediate)
**Level Requirement:** 20-35  
**Difficulty:** Medium  
**Enemy Strength:** 800-1500 power  
**Rewards:**
- Advanced resources (1000-3000 each)
- Rare blueprints (15% drop rate)
- T2 resources guaranteed (500-1000 each)
- Experience: 700-1200 XP
- Gold: 400-800

**Spawn Mechanics:**
- Frequency: Low (every 8-12 hours)
- Duration: 48 hours
- Respawn: Limited (3x per week per player)
- Location: Contested zones

**Enemy Types:**
- Elite Soldiers
- Heavy Armor Units
- Artillery Support
- Shield Generators

---

### 4. Purple Portal (Advanced)
**Level Requirement:** 35-50  
**Difficulty:** Hard  
**Enemy Strength:** 2000-4000 power  
**Rewards:**
- Premium resources (2000-5000 each)
- Epic blueprints (20% drop rate)
- T3 resource fragments (30% chance)
- Legendary component (5% chance)
- Experience: 1500-2500 XP
- Gold: 1000-2000

**Spawn Mechanics:**
- Frequency: Very Low (every 12-24 hours)
- Duration: 72 hours
- Respawn: Limited (2x per week per player)
- Location: High-level zones, near faction territories

**Enemy Types:**
- Elite Commanders
- Mech Units
- Advanced Defense Grids
- Boss-tier enemy (mini-boss)

---

### 5. Red Portal (Expert)
**Level Requirement:** 50-70  
**Difficulty:** Very Hard  
**Enemy Strength:** 5000-8000 power  
**Rewards:**
- Elite resources (5000-10000 each)
- Legendary blueprints (25% drop rate)
- T3 resources guaranteed (1000-2000 each)
- Legendary components (15% chance)
- Unique unit unlock (5% chance)
- Experience: 3000-5000 XP
- Gold: 2500-5000

**Spawn Mechanics:**
- Frequency: Rare (every 24-48 hours)
- Duration: 96 hours (4 days)
- Respawn: Limited (1x per week per player)
- Location: Faction-controlled zones only

**Enemy Types:**
- Champion Units
- Siege Mechs
- Plasma Turrets
- Field Boss (challenging mini-boss)

---

### 6. Golden Portal (Legendary)
**Level Requirement:** 70+  
**Difficulty:** Extreme  
**Enemy Strength:** 10000-20000 power  
**Rewards:**
- Mythic resources (10000-20000 each)
- Mythic blueprints (30% drop rate)
- T4 resource fragments (50% chance)
- Legendary components guaranteed
- Unique hero unit (10% chance)
- Portal-specific cosmetics (5% chance)
- Experience: 6000-10000 XP
- Gold: 5000-10000

**Spawn Mechanics:**
- Frequency: Ultra Rare (every 48-96 hours)
- Duration: 7 days
- Respawn: Unique (1x per player, permanent clear)
- Location: World map events, announced globally

**Enemy Types:**
- Legendary Warlord (BOSS)
- Ancient Machines
- Quantum Shields
- Multiple phases
- Enrage mechanics

---

## Core Mechanics

### Portal Discovery
1. **World Map Integration**
   - Portals appear as glowing icons on world map
   - Color-coded by tier
   - Distance and coordinates visible
   - Timer shows remaining duration

2. **Notification System**
   - Alert when new portal spawns nearby
   - Push notifications for Golden Portals
   - Alliance-wide portal sharing

3. **Portal Info Panel**
   - Recommended power level
   - Estimated rewards
   - Success rate estimate (based on player power)
   - Previous attempt history

### Combat System

**Pre-Battle:**
- Unit selection screen
- Loadout customization
- Support item usage (buffs, healing)
- Scouting option (costs resources, reveals enemy composition)

**Battle Phases:**
1. **Approach** - Travel time (30s - 5min depending on distance)
2. **Engagement** - Auto-battle with tactical choices
3. **Resolution** - Victory/defeat/retreat

**Tactical Choices (during battle):**
- Focus Fire (target priority)
- Defensive Stance (reduce damage, lower DPS)
- Aggressive Assault (increase damage, take more hits)
- Retreat (30% resource cost, units survive)

**Failure Mechanics:**
- Units lost in battle (percentage based on defeat severity)
- Resources spent (travel + engagement costs)
- 10-minute cooldown before retry
- Portal closes after 3 failed attempts (personal lockout)

### Reward Distribution

**Loot Tables:**
```javascript
const LOOT_TABLES = {
  grey: {
    resources: { min: 100, max: 500, guaranteed: true },
    gold: { min: 50, max: 150, guaranteed: true },
    blueprints: { rarity: 'common', chance: 0.05 },
    xp: { min: 100, max: 250 }
  },
  green: {
    resources: { min: 500, max: 1500, guaranteed: true },
    gold: { min: 150, max: 400, guaranteed: true },
    blueprints: { rarity: 'uncommon', chance: 0.10 },
    t2_fragments: { min: 10, max: 50, chance: 0.20 },
    xp: { min: 300, max: 600 }
  },
  blue: {
    resources: { min: 1000, max: 3000, guaranteed: true },
    gold: { min: 400, max: 800, guaranteed: true },
    blueprints: { rarity: 'rare', chance: 0.15 },
    t2_resources: { min: 500, max: 1000, guaranteed: true },
    xp: { min: 700, max: 1200 }
  },
  purple: {
    resources: { min: 2000, max: 5000, guaranteed: true },
    gold: { min: 1000, max: 2000, guaranteed: true },
    blueprints: { rarity: 'epic', chance: 0.20 },
    t3_fragments: { min: 50, max: 150, chance: 0.30 },
    legendary_component: { chance: 0.05 },
    xp: { min: 1500, max: 2500 }
  },
  red: {
    resources: { min: 5000, max: 10000, guaranteed: true },
    gold: { min: 2500, max: 5000, guaranteed: true },
    blueprints: { rarity: 'legendary', chance: 0.25 },
    t3_resources: { min: 1000, max: 2000, guaranteed: true },
    legendary_component: { chance: 0.15 },
    unique_unit_unlock: { chance: 0.05 },
    xp: { min: 3000, max: 5000 }
  },
  golden: {
    resources: { min: 10000, max: 20000, guaranteed: true },
    gold: { min: 5000, max: 10000, guaranteed: true },
    blueprints: { rarity: 'mythic', chance: 0.30 },
    t4_fragments: { min: 100, max: 300, chance: 0.50 },
    legendary_component: { guaranteed: true },
    unique_hero: { chance: 0.10 },
    cosmetic: { chance: 0.05 },
    xp: { min: 6000, max: 10000 }
  }
};
```

### Progression System

**Portal Mastery:**
- Track successful completions per tier
- Unlock mastery bonuses:
  - 10 clears: +5% rewards
  - 25 clears: +10% rewards, -10% costs
  - 50 clears: +15% rewards, -20% costs, unlock next tier early
  - 100 clears: +25% rewards, guaranteed rare drop

**Personal Best:**
- Fastest clear time
- Highest difficulty solo'd
- Total portals cleared
- Leaderboard rankings

**Achievements:**
- "Portal Pioneer" - Clear first portal
- "Rift Walker" - Clear 50 portals
- "Dimension Breaker" - Clear Golden Portal
- "Speed Runner" - Clear any portal in under 2 minutes
- "Solo Champion" - Clear Red Portal without losses

---

## Database Schema

### Tables

#### `portals`
```sql
CREATE TABLE portals (
  id SERIAL PRIMARY KEY,
  tier VARCHAR(20) NOT NULL, -- grey, green, blue, purple, red, golden
  x_coordinate INTEGER NOT NULL,
  y_coordinate INTEGER NOT NULL,
  spawn_time TIMESTAMP NOT NULL DEFAULT NOW(),
  expiry_time TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'active', -- active, expired, completed
  difficulty INTEGER NOT NULL, -- 1-10 scale
  recommended_power INTEGER NOT NULL,
  global_event BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_portals_status ON portals(status);
CREATE INDEX idx_portals_tier ON portals(tier);
CREATE INDEX idx_portals_coordinates ON portals(x_coordinate, y_coordinate);
```

#### `portal_attempts`
```sql
CREATE TABLE portal_attempts (
  id SERIAL PRIMARY KEY,
  portal_id INTEGER REFERENCES portals(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  units_sent JSONB NOT NULL, -- {infantry: 100, tanks: 50, ...}
  result VARCHAR(20) NOT NULL, -- victory, defeat, retreat
  units_lost JSONB, -- {infantry: 20, tanks: 5, ...}
  rewards JSONB, -- {wood: 1000, gold: 500, blueprints: [...]}
  battle_duration INTEGER, -- seconds
  attempt_time TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_portal_attempts_user ON portal_attempts(user_id);
CREATE INDEX idx_portal_attempts_portal ON portal_attempts(portal_id);
CREATE INDEX idx_portal_attempts_result ON portal_attempts(result);
```

#### `portal_mastery`
```sql
CREATE TABLE portal_mastery (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  tier VARCHAR(20) NOT NULL,
  clears INTEGER DEFAULT 0,
  fastest_time INTEGER, -- seconds
  total_rewards JSONB, -- aggregate tracking
  mastery_level INTEGER DEFAULT 0, -- 0-4 (based on clears)
  last_clear TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, tier)
);

CREATE INDEX idx_portal_mastery_user ON portal_mastery(user_id);
```

#### `portal_leaderboard`
```sql
CREATE TABLE portal_leaderboard (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  username VARCHAR(50) NOT NULL,
  tier VARCHAR(20) NOT NULL,
  fastest_time INTEGER NOT NULL,
  clear_date TIMESTAMP NOT NULL,
  rank INTEGER,
  season INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, tier, season)
);

CREATE INDEX idx_portal_leaderboard_tier ON portal_leaderboard(tier, rank);
```

---

## API Endpoints

### GET `/api/v1/portals`
List all active portals

**Query Params:**
- `tier` - Filter by tier (grey, green, blue, etc.)
- `nearby` - Get portals within radius (requires x, y coords)
- `radius` - Search radius in tiles (default: 50)

**Response:**
```json
{
  "portals": [
    {
      "id": 123,
      "tier": "blue",
      "coordinates": { "x": 150, "y": 200 },
      "expiresIn": 3600,
      "recommendedPower": 1200,
      "distance": 25,
      "status": "active"
    }
  ]
}
```

### GET `/api/v1/portals/:id`
Get portal details

**Response:**
```json
{
  "id": 123,
  "tier": "blue",
  "coordinates": { "x": 150, "y": 200 },
  "difficulty": 6,
  "recommendedPower": 1200,
  "expiresAt": "2025-12-01T10:00:00Z",
  "estimatedRewards": {
    "resources": "1000-3000",
    "gold": "400-800",
    "blueprints": "15% rare"
  },
  "myAttempts": 1,
  "successRate": 0.65
}
```

### POST `/api/v1/portals/:id/attack`
Challenge a portal

**Request:**
```json
{
  "units": {
    "infantry": 500,
    "tanks": 100,
    "artillery": 50
  },
  "tactic": "balanced"
}
```

**Response:**
```json
{
  "success": true,
  "result": "victory",
  "battleReport": {
    "duration": 120,
    "unitsLost": { "infantry": 50, "tanks": 10 },
    "enemiesDefeated": 800
  },
  "rewards": {
    "wood": 2500,
    "stone": 2200,
    "iron": 1800,
    "food": 2000,
    "gold": 650,
    "xp": 1000,
    "blueprints": [{ "id": 45, "name": "Advanced Turret", "rarity": "rare" }]
  }
}
```

### GET `/api/v1/portals/mastery`
Get player's portal mastery stats

**Response:**
```json
{
  "mastery": {
    "grey": { "clears": 45, "level": 3, "bonuses": "+15% rewards, -20% cost" },
    "green": { "clears": 28, "level": 2, "bonuses": "+10% rewards, -10% cost" },
    "blue": { "clears": 12, "level": 1, "bonuses": "+5% rewards" }
  },
  "totalClears": 85,
  "achievements": ["Portal Pioneer", "Rift Walker"]
}
```

### GET `/api/v1/portals/leaderboard/:tier`
Get leaderboard for specific tier

**Response:**
```json
{
  "leaderboard": [
    { "rank": 1, "username": "SpeedRunner", "time": 87, "date": "2025-11-28T..." },
    { "rank": 2, "username": "ProGamer", "time": 92, "date": "2025-11-29T..." }
  ],
  "myRank": 45,
  "myBestTime": 156
}
```

---

## Implementation Phases

### Phase 1: MVP (Grey, Green, Blue) - 40h
- Database schema + migrations
- Portal spawning cron job
- Basic combat resolution
- Reward distribution
- API endpoints
- Frontend portal list + details

### Phase 2: Advanced Portals (Purple, Red, Golden) - 40h
- Enhanced combat mechanics (tactics, phases)
- Boss battles
- Advanced loot tables
- Mastery system
- Leaderboards

### Phase 3: Quest System Integration - 40h
- Portal-related quests
- Campaign progression
- Story elements
- Achievement unlocks
- Special events

---

## Balance Considerations

### Power Scaling
- Portal difficulty increases exponentially
- Player power increases linearly through levels
- Creates natural gates for progression

### Reward Economy
- Resources from portals should = 20-30% of total player income
- Blueprints are primary unique reward
- Legendary items remain rare (5-15% drop rates)

### Engagement Loop
- Grey/Green: Farm daily for resources
- Blue/Purple: Challenge for progression
- Red/Golden: Endgame content, rare attempts

---

## Testing Checklist

- [ ] Portal spawning at correct intervals
- [ ] Expiry timers work correctly
- [ ] Combat resolution calculates properly
- [ ] Reward RNG follows distribution
- [ ] Unit loss calculation accurate
- [ ] Mastery progression increments
- [ ] Leaderboard updates in real-time
- [ ] UI shows correct portal info
- [ ] Mobile responsive
- [ ] Performance (1000+ active portals)

---

**Status:** Design Complete, Ready for Implementation  
**Priority:** HIGH - Core Phase 3 Feature  
**Estimated Impact:** +70% PvE engagement, +40% D7 retention
