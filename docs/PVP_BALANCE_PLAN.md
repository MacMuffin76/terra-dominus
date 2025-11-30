# 🎯 PvP Balancing Analysis & Implementation Plan

**Date**: November 30, 2025  
**Status**: Phase 3 - PvP Balancing (40h estimated)  
**Current Progress**: 0h/40h (0%)

---

## 📊 Current State Analysis

### ✅ What EXISTS:
1. **Combat System** (`backend/modules/combat`)
   - Attack types: `raid`, `conquest`, `siege`
   - Travel time calculation (2 tiles/hour)
   - Combat simulation with rounds
   - Loot calculation (30% raid, 50% conquest, 20% siege)
   - Attack/Defense waves
   - Battle reports

2. **Protection System** (`backend/modules/protection`)
   - 72-hour beginner shield (3 days)
   - Shield lost after 5 attacks sent
   - Shield lost if player has >2 cities
   - 1-hour raid cooldown on same target
   - 20 attacks/day limit

3. **Units System**
   - Basic Squad class (attack, defense, initiative, count)
   - Unit entities in database
   - Resource costs system

4. **Combat Rules** (`backend/modules/combat/domain/combatRules.js`)
   - Army speed: 2 tiles/hour
   - Wall bonus: +5% defense per level
   - Tech bonuses
   - Unit strength calculation

### ❌ What's MISSING / UNBALANCED:

1. **Unit Stats Not Defined**
   - No clear unit types (infantry, tanks, aircraft, etc.)
   - No attack/defense/cost values
   - No unit counters system (rock-paper-scissors)
   - No unit speed/capacity differences

2. **Economic Balance**
   - Loot percentages may be too high (30-50%)
   - No diminishing returns on repeated attacks
   - No defense investment incentives
   - Resource costs not defined

3. **Combat Mechanics**
   - Simple strength comparison
   - No tactical depth
   - No terrain effects
   - No formation bonuses

4. **Progression Balance**
   - Early game attackers too strong?
   - Late game turtling too viable?
   - No anti-snowball mechanics

5. **Defense Mechanics**
   - Walls only give +5% per level (weak?)
   - No defensive structures variety
   - No garrison bonuses

---

## 🎯 Balance Goals

### Core Principles:
1. **Early Game Protection** → New players feel safe
2. **Risk/Reward Balance** → Attacking should be profitable but risky
3. **Defense Viability** → Defending should be viable strategy
4. **Counter-Play** → Rock-paper-scissors unit dynamics
5. **Economic Sustainability** → Prevent resource drain spirals

### Target Metrics:
- **Attack Success Rate**: 40-60% (balanced)
- **Average Loot vs Cost**: 1.5x-2x ROI for successful raids
- **Defense Cost Efficiency**: 70% of attack cost to defend
- **Shield Activation Rate**: <5% of active players (only truly new)
- **Daily PvP Engagement**: 30-50% of players participate

---

## 📋 Implementation Plan (40h)

### **Phase 1: Unit Definition & Balance (10h)**

#### 1.1 Define Unit Types (3h)
Create comprehensive unit system with clear roles:

```javascript
// backend/modules/combat/domain/unitDefinitions.js

const UNIT_TYPES = {
  // Tier 1: Basic Units (Early Game)
  MILITIA: {
    id: 'militia',
    name: 'Militia',
    tier: 1,
    attack: 2,
    defense: 3,
    speed: 1.0,
    capacity: 10,
    cost: { gold: 50, metal: 20, fuel: 0 },
    trainTime: 30, // seconds
    counters: [], // Weak against everything
    weakTo: ['infantry', 'cavalry']
  },
  
  INFANTRY: {
    id: 'infantry',
    name: 'Infantry',
    tier: 1,
    attack: 5,
    defense: 4,
    speed: 1.0,
    capacity: 20,
    cost: { gold: 100, metal: 50, fuel: 0 },
    trainTime: 60,
    counters: ['militia'],
    weakTo: ['cavalry', 'artillery']
  },
  
  // Tier 2: Advanced Units (Mid Game)
  CAVALRY: {
    id: 'cavalry',
    name: 'Cavalry',
    tier: 2,
    attack: 8,
    defense: 5,
    speed: 2.0, // Faster movement
    capacity: 30,
    cost: { gold: 250, metal: 100, fuel: 50 },
    trainTime: 120,
    counters: ['infantry', 'artillery'],
    weakTo: ['spearmen', 'fortifications']
  },
  
  ARTILLERY: {
    id: 'artillery',
    name: 'Artillery',
    tier: 2,
    attack: 12,
    defense: 2,
    speed: 0.5, // Slow
    capacity: 0, // Can't carry loot
    cost: { gold: 400, metal: 300, fuel: 100 },
    trainTime: 180,
    counters: ['fortifications', 'infantry'],
    weakTo: ['cavalry', 'aircraft']
  },
  
  // Tier 3: Elite Units (Late Game)
  TANKS: {
    id: 'tanks',
    name: 'Tanks',
    tier: 3,
    attack: 20,
    defense: 18,
    speed: 1.5,
    capacity: 50,
    cost: { gold: 800, metal: 600, fuel: 400 },
    trainTime: 300,
    counters: ['infantry', 'cavalry', 'fortifications'],
    weakTo: ['anti-tank', 'aircraft']
  },
  
  AIRCRAFT: {
    id: 'aircraft',
    name: 'Aircraft',
    tier: 3,
    attack: 25,
    defense: 8,
    speed: 3.0, // Very fast
    capacity: 10,
    cost: { gold: 1500, metal: 1000, fuel: 800 },
    trainTime: 600,
    counters: ['tanks', 'artillery', 'fortifications'],
    weakTo: ['anti-air', 'aircraft']
  },
  
  // Specialized Units
  SPEARMEN: {
    id: 'spearmen',
    name: 'Spearmen',
    tier: 2,
    attack: 6,
    defense: 8,
    speed: 1.0,
    capacity: 15,
    cost: { gold: 200, metal: 80, fuel: 0 },
    trainTime: 90,
    counters: ['cavalry'], // Anti-cavalry
    weakTo: ['artillery', 'tanks']
  },
  
  ANTI_TANK: {
    id: 'anti_tank',
    name: 'Anti-Tank Infantry',
    tier: 3,
    attack: 15,
    defense: 10,
    speed: 1.0,
    capacity: 10,
    cost: { gold: 600, metal: 400, fuel: 200 },
    trainTime: 240,
    counters: ['tanks'], // Anti-tank
    weakTo: ['infantry', 'aircraft']
  }
};

// Counter system multipliers
const COUNTER_BONUS = 1.5; // 50% bonus when countering
const WEAK_TO_PENALTY = 0.7; // 30% penalty when being countered
```

#### 1.2 Implement Unit Balance Database (2h)
- Create migration for unit definitions
- Seed initial unit data
- Add unit stats to Entity model

#### 1.3 Update Combat Simulation (5h)
- Implement counter system
- Add tactical positioning
- Add unit initiative/speed effects
- Rebalance combat rounds

---

### **Phase 2: Economic Balance (8h)**

#### 2.1 Loot Rebalancing (2h)
```javascript
// New loot calculation
function calculateLoot(defenderResources, attackType, attackerLosses, defenderLosses) {
  // Base loot percentages
  const baseLoot = {
    raid: 0.20,      // 20% (down from 30%)
    conquest: 0.40,   // 40% (down from 50%)
    siege: 0.10      // 10% (down from 20%)
  };
  
  // Performance bonus/penalty
  const efficiency = 1 - (attackerLosses / (attackerLosses + defenderLosses));
  const performanceMultiplier = 0.5 + (efficiency * 1.0); // 0.5x to 1.5x
  
  // Victim protection (diminishing returns)
  const victimDebuff = calculateVictimProtection(defenderUserId);
  
  const finalPercentage = baseLoot[attackType] * performanceMultiplier * victimDebuff;
  
  return {
    gold: Math.floor(defenderResources.gold * finalPercentage),
    metal: Math.floor(defenderResources.metal * finalPercentage),
    fuel: Math.floor(defenderResources.fuel * finalPercentage)
  };
}

// Victim protection (recent attack count)
function calculateVictimProtection(userId) {
  const recentAttacks = getAttacksInLast24h(userId);
  
  if (recentAttacks === 0) return 1.0;
  if (recentAttacks === 1) return 0.8;
  if (recentAttacks === 2) return 0.6;
  if (recentAttacks === 3) return 0.4;
  return 0.2; // Max 80% reduction after 4+ attacks
}
```

#### 2.2 Attack Cost Analysis (2h)
- Calculate unit cost per attack type
- Define optimal army compositions
- Set minimum viable attack sizes

#### 2.3 Defense Investment ROI (2h)
- Walls effectiveness curve
- Turret/defense building costs
- Garrison unit efficiency

#### 2.4 Resource Sink Balancing (2h)
- Unit maintenance costs?
- Repair costs after combat
- Training time vs instant buy premium

---

### **Phase 3: Defense Mechanics (8h)**

#### 3.1 Wall Rebalancing (2h)
```javascript
// Enhanced wall bonus
function calculateWallsBonus(wallLevel, defenderTech) {
  // Base: +8% per level (up from 5%)
  const baseBonus = wallLevel * 0.08;
  
  // Tech multiplier
  const techBonus = defenderTech.fortification_level * 0.05;
  
  // Max 200% bonus at level 20 walls + level 10 tech
  return Math.min(baseBonus + techBonus, 2.0);
}
```

#### 3.2 Defensive Structures (3h)
- Turrets (anti-infantry)
- Anti-air batteries
- Tank traps (slow tanks)
- Bunkers (garrison bonus)

#### 3.3 Garrison System (3h)
- Defensive stance (higher defense, can't carry loot)
- Quick reaction force (reinforcement mechanic)
- Alliance reinforcements

---

### **Phase 4: Progression Balance (6h)**

#### 4.1 Early Game (2h)
- Starter units analysis
- First 24 hours optimal progression
- Beginner shield effectiveness

#### 4.2 Mid Game (2h)
- Tier 2 unit unlock timing
- City expansion vs military balance
- Alliance mechanics integration

#### 4.3 Late Game (2h)
- End-game unit balance
- Super units (limited quantity)
- Strategic objectives (not just farming)

---

### **Phase 5: Anti-Snowball Mechanics (4h)**

#### 5.1 Upkeep System (2h)
```javascript
// Army upkeep (prevents infinite armies)
const UPKEEP_COSTS = {
  tier1: { gold: 1, metal: 0, fuel: 0 }, // per unit per hour
  tier2: { gold: 2, metal: 1, fuel: 1 },
  tier3: { gold: 5, metal: 3, fuel: 3 }
};

function calculateHourlyUpkeep(units) {
  return units.reduce((total, unit) => {
    const cost = UPKEEP_COSTS[unit.tier];
    return {
      gold: total.gold + (cost.gold * unit.quantity),
      metal: total.metal + (cost.metal * unit.quantity),
      fuel: total.fuel + (cost.fuel * unit.quantity)
    };
  }, { gold: 0, metal: 0, fuel: 0 });
}
```

#### 5.2 Catch-Up Mechanics (2h)
- Underdog bonuses
- Alliance aid packages
- Protected resource reserves (can't be looted)

---

### **Phase 6: Testing & Iteration (4h)**

#### 6.1 Simulation Testing (2h)
- 100 simulated battles
- Various army compositions
- Win rate analysis

#### 6.2 Balance Adjustments (2h)
- Fine-tune multipliers
- Cost adjustments
- Feedback implementation

---

## 📈 Success Metrics

### Before Balance:
- [ ] Document current win rates
- [ ] Document current loot averages
- [ ] Document current shield usage

### After Balance:
- [ ] Attack success rate: 40-60%
- [ ] Defense viability: 30-40% success rate
- [ ] Average ROI: 1.5x-2x for successful raids
- [ ] New player retention: +20%
- [ ] PvP participation: 40% of daily actives

---

## 🚀 Next Steps

1. **Immediate**: Define complete unit roster with stats
2. **Day 1**: Implement unit definitions migration
3. **Day 2-3**: Rebalance combat simulation
4. **Day 4**: Economic balance (loot, costs)
5. **Day 5**: Defense mechanics
6. **Day 6**: Progression balance
7. **Day 7**: Testing & adjustments

---

## 📝 Notes

- Portal PvE system already has good enemy definitions (can mirror for units)
- Protection system is solid, just needs integration with new balance
- Combat simulation needs most work (currently too simple)
- Need real player data for final tuning (use simulations for now)

**Estimated Total**: 40 hours
**Priority**: HIGH (Phase 3 requirement)
**Dependencies**: None (Quest System complete)
