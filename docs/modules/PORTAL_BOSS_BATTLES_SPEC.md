# 🐉 Boss Battles & Advanced Portal Mechanics — Spécification Technique

**Date:** 30 novembre 2025  
**Estimation:** 25h développement  
**Priority:** P1 (Post-MVP Portal)  
**Status:** 📋 Spécification

---

## 🎯 Objectifs

Transformer les portails standards en expériences riches avec:
1. **Boss Battles** — Combats multi-phases avec mécaniques spéciales
2. **Portal Modifiers** — Buffs/debuffs aléatoires ajoutant variété
3. **Co-op Raids** — Portails alliance nécessitant coordination
4. **Special Events** — Boss mondiaux temps limité

---

## 🐲 1. BOSS BATTLES (10h)

### 1.1 Types de Boss

| Boss Type | Tiers | Spawn Rate | Phases | Spécial Abilities |
|-----------|-------|------------|--------|-------------------|
| **Elite Guardian** | Bleu+ | 20% | 2 | Shield regeneration |
| **Ancient Titan** | Violet+ | 15% | 3 | AoE damage waves |
| **Void Reaver** | Rouge+ | 10% | 3 | Unit disable (stun) |
| **Cosmic Emperor** | Doré | 5% | 4 | All abilities |

### 1.2 Phase System

**Phases déclenchées par HP thresholds:**

```javascript
const BOSS_PHASES = {
  phase_1: {
    hp_range: [100, 75],
    behavior: 'standard',
    abilities: []
  },
  phase_2: {
    hp_range: [75, 50],
    behavior: 'defensive',
    abilities: ['shield_regeneration'],
    trigger_message: "⚠️ Le boss active ses boucliers!"
  },
  phase_3: {
    hp_range: [50, 25],
    behavior: 'aggressive',
    abilities: ['aoe_blast', 'shield_regeneration'],
    trigger_message: "🔥 Le boss entre en rage!"
  },
  phase_4: {
    hp_range: [25, 0],
    behavior: 'berserk',
    abilities: ['aoe_blast', 'shield_regeneration', 'unit_disable'],
    trigger_message: "💀 Phase finale! Le boss est désespéré!"
  }
};
```

### 1.3 Abilities System

**Shield Regeneration:**
```javascript
{
  ability_id: 'shield_regen',
  trigger: 'phase_start',
  effect: {
    type: 'heal',
    amount: 0.15, // 15% max HP
    cooldown: 30000 // 30 secondes
  },
  counterplay: 'Attaquer rapidement pendant cooldown'
}
```

**AoE Blast:**
```javascript
{
  ability_id: 'aoe_blast',
  trigger: 'every_20s',
  effect: {
    type: 'damage_all_units',
    damage_multiplier: 0.1, // 10% HP de toutes unités
    unit_types: ['infantry', 'tank', 'artillery']
  },
  counterplay: 'Privilégier unités aériennes résistantes'
}
```

**Unit Disable (Stun):**
```javascript
{
  ability_id: 'unit_disable',
  trigger: 'random_interval',
  effect: {
    type: 'disable_units',
    target: 'random_unit_type',
    duration: 15000, // 15 secondes
    percentage: 0.3 // 30% des unités de ce type
  },
  counterplay: 'Composer armée variée'
}
```

### 1.4 Database Schema Extensions

**Table: `portal_bosses`**
```sql
CREATE TABLE portal_bosses (
  boss_id SERIAL PRIMARY KEY,
  portal_id INTEGER REFERENCES portals(portal_id) ON DELETE CASCADE,
  boss_type VARCHAR(50) NOT NULL,
  base_hp INTEGER NOT NULL,
  current_phase INTEGER DEFAULT 1,
  abilities_used JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_portal_bosses_portal ON portal_bosses(portal_id);
```

**Table: `portal_boss_attempts`**
```sql
CREATE TABLE portal_boss_attempts (
  attempt_id SERIAL PRIMARY KEY,
  boss_id INTEGER REFERENCES portal_bosses(boss_id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
  damage_dealt INTEGER DEFAULT 0,
  phases_reached INTEGER DEFAULT 1,
  abilities_triggered JSONB DEFAULT '[]',
  result VARCHAR(20), -- 'victory', 'defeat', 'phase_cleared'
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_boss_attempts_boss ON portal_boss_attempts(boss_id);
CREATE INDEX idx_boss_attempts_user ON portal_boss_attempts(user_id);
```

### 1.5 Boss Combat Service

**Fichier:** `backend/modules/portals/application/PortalBossCombatService.js`

```javascript
class PortalBossCombatService {
  constructor({ portalRepository, bossRepository, unitRepository }) {
    this.portalRepo = portalRepository;
    this.bossRepo = bossRepository;
    this.unitRepo = unitRepository;
  }

  /**
   * Simulate boss battle with phases and abilities
   */
  async simulateBossBattle(userId, bossId, units, tactic) {
    const boss = await this.bossRepo.findById(bossId);
    if (!boss) throw new Error('Boss not found');

    const battleLog = [];
    let bossHP = boss.current_hp || boss.base_hp;
    let playerUnits = { ...units };
    
    // Calculate initial player power
    let playerPower = this.calculatePlayerPower(playerUnits, tactic);
    
    // Battle simulation loop
    let round = 1;
    let currentPhase = this.determinePhase(bossHP, boss.base_hp);
    
    while (bossHP > 0 && this.hasUnitsRemaining(playerUnits)) {
      // Check phase transition
      const newPhase = this.determinePhase(bossHP, boss.base_hp);
      if (newPhase !== currentPhase) {
        currentPhase = newPhase;
        const phaseData = BOSS_PHASES[`phase_${currentPhase}`];
        battleLog.push({
          round,
          event: 'phase_transition',
          phase: currentPhase,
          message: phaseData.trigger_message
        });
        
        // Trigger phase abilities
        await this.triggerPhaseAbilities(boss, currentPhase, playerUnits, battleLog);
      }
      
      // Player attack
      const playerDamage = this.calculateDamage(playerPower, boss.defense);
      bossHP -= playerDamage;
      battleLog.push({
        round,
        event: 'player_attack',
        damage: playerDamage,
        boss_hp: Math.max(0, bossHP)
      });
      
      // Boss abilities (if any)
      if (currentPhase > 1) {
        await this.processBossAbilities(boss, currentPhase, playerUnits, battleLog);
      }
      
      // Boss counterattack
      const bossAttack = this.calculateBossAttack(boss, currentPhase);
      playerUnits = this.applyDamageToUnits(playerUnits, bossAttack);
      battleLog.push({
        round,
        event: 'boss_attack',
        damage: bossAttack,
        units_remaining: this.countTotalUnits(playerUnits)
      });
      
      round++;
      
      // Safety: max 50 rounds
      if (round > 50) break;
    }
    
    // Determine result
    const victory = bossHP <= 0;
    const phasesReached = currentPhase;
    
    // Calculate rewards (bonus for phases reached)
    const baseRewards = boss.rewards;
    const phaseBonus = 1 + (phasesReached - 1) * 0.25; // +25% per phase
    const finalRewards = this.multiplyRewards(baseRewards, phaseBonus);
    
    // Record attempt
    await this.bossRepo.recordAttempt({
      boss_id: bossId,
      user_id: userId,
      damage_dealt: boss.base_hp - bossHP,
      phases_reached: phasesReached,
      result: victory ? 'victory' : 'defeat',
      battle_log: battleLog
    });
    
    return {
      result: victory ? 'victory' : 'defeat',
      phases_reached: phasesReached,
      damage_dealt: boss.base_hp - bossHP,
      losses: this.calculateLosses(units, playerUnits),
      rewards: victory ? finalRewards : this.consolationRewards(baseRewards),
      battle_log: battleLog
    };
  }

  determinePhase(currentHP, maxHP) {
    const hpPercent = (currentHP / maxHP) * 100;
    if (hpPercent > 75) return 1;
    if (hpPercent > 50) return 2;
    if (hpPercent > 25) return 3;
    return 4;
  }

  async triggerPhaseAbilities(boss, phase, playerUnits, battleLog) {
    const phaseData = BOSS_PHASES[`phase_${phase}`];
    
    for (const abilityId of phaseData.abilities) {
      if (abilityId === 'shield_regeneration') {
        const healAmount = boss.base_hp * 0.15;
        boss.current_hp = Math.min(boss.base_hp, boss.current_hp + healAmount);
        battleLog.push({
          event: 'boss_ability',
          ability: 'shield_regeneration',
          heal: healAmount,
          message: '🛡️ Le boss régénère ses boucliers!'
        });
      }
    }
  }

  async processBossAbilities(boss, phase, playerUnits, battleLog) {
    const phaseData = BOSS_PHASES[`phase_${phase}`];
    
    // Random chance to trigger abilities
    for (const abilityId of phaseData.abilities) {
      if (Math.random() < 0.3) { // 30% chance per ability per round
        
        if (abilityId === 'aoe_blast') {
          // Damage all ground units
          const aoeDamage = 0.1; // 10% of unit count
          for (const unitType of ['infantry', 'tank', 'artillery', 'apc']) {
            const losses = Math.ceil(playerUnits[unitType] * aoeDamage);
            playerUnits[unitType] = Math.max(0, playerUnits[unitType] - losses);
          }
          battleLog.push({
            event: 'boss_ability',
            ability: 'aoe_blast',
            message: '💥 AoE Blast! Vos unités terrestres subissent des dégâts!'
          });
        }
        
        if (abilityId === 'unit_disable') {
          // Disable random unit type
          const unitTypes = Object.keys(playerUnits).filter(t => playerUnits[t] > 0);
          if (unitTypes.length > 0) {
            const targetType = unitTypes[Math.floor(Math.random() * unitTypes.length)];
            const disableCount = Math.ceil(playerUnits[targetType] * 0.3);
            playerUnits[targetType] = Math.max(0, playerUnits[targetType] - disableCount);
            battleLog.push({
              event: 'boss_ability',
              ability: 'unit_disable',
              target: targetType,
              disabled: disableCount,
              message: `⚡ ${disableCount} ${targetType} désactivées!`
            });
          }
        }
      }
    }
  }
}
```

### 1.6 Frontend Boss Battle UI

**Composant:** `frontend/src/components/portals/BossBattleModal.jsx`

**Features:**
- HP bar avec phases visuelles (4 segments colorés)
- Battle log en temps réel (scroll automatique)
- Phase indicators avec countdown
- Ability warnings (animations)
- Victory screen avec phase bonus

**Animations:**
- Phase transitions: Screen shake + flash
- Boss abilities: Particle effects
- HP bar: Pulse sur low HP

---

## 🎲 2. PORTAL MODIFIERS (7h)

### 2.1 Modifier System

**Modifiers appliqués aléatoirement au spawn:**

```javascript
const PORTAL_MODIFIERS = {
  // Positive (player advantage)
  weakened: {
    type: 'positive',
    effect: { portal_power: -0.2 }, // -20% power
    icon: '🔻',
    description: 'Portail affaibli (-20% puissance)'
  },
  exposed: {
    type: 'positive',
    effect: { defense: -0.3 }, // -30% defense
    icon: '🎯',
    description: 'Défenses exposées (-30% résistance)'
  },
  rich_rewards: {
    type: 'positive',
    effect: { rewards: +0.5 }, // +50% rewards
    icon: '💰',
    description: 'Récompenses enrichies (+50%)'
  },
  
  // Negative (challenge)
  fortified: {
    type: 'negative',
    effect: { portal_power: +0.3 }, // +30% power
    icon: '🛡️',
    description: 'Fortifié (+30% puissance)'
  },
  frenzied: {
    type: 'negative',
    effect: { attack_speed: +0.4 }, // +40% attack speed
    icon: '⚡',
    description: 'Enragé (+40% vitesse attaque)'
  },
  void_touched: {
    type: 'negative',
    effect: { healing: -1.0 }, // No healing
    icon: '💀',
    description: 'Touché par le Vide (pas de soins)'
  },
  
  // Environmental
  arctic: {
    type: 'environmental',
    effect: { ground_units: -0.15 }, // -15% ground unit efficiency
    icon: '❄️',
    description: 'Arctique (-15% unités terrestres)'
  },
  desert: {
    type: 'environmental',
    effect: { 
      infantry: -0.2,
      vehicle_heat: +0.1 
    },
    icon: '🏜️',
    description: 'Désert (-20% infanterie, +10% véhicules)'
  },
  storm: {
    type: 'environmental',
    effect: { air_units: -0.25 }, // -25% air unit efficiency
    icon: '⛈️',
    description: 'Tempête (-25% unités aériennes)'
  }
};
```

### 2.2 Modifier Application

**Au spawn:**
```javascript
async spawnPortalWithModifiers(tier, coordinates) {
  const portal = await this.spawnBasicPortal(tier, coordinates);
  
  // 40% chance d'avoir un modifier
  if (Math.random() < 0.4) {
    const modifierKeys = Object.keys(PORTAL_MODIFIERS);
    const randomModifier = modifierKeys[Math.floor(Math.random() * modifierKeys.length)];
    
    portal.modifiers = [randomModifier];
    portal.modified_power = this.applyModifier(portal.base_power, randomModifier);
    
    await this.portalRepo.update(portal.portal_id, {
      modifiers: portal.modifiers,
      recommended_power: portal.modified_power
    });
  }
  
  return portal;
}
```

**Au combat:**
```javascript
calculateModifiedDamage(baseDamage, modifiers, unitType) {
  let finalDamage = baseDamage;
  
  for (const modifierId of modifiers) {
    const modifier = PORTAL_MODIFIERS[modifierId];
    
    if (modifier.effect.ground_units && ['infantry', 'tank', 'artillery', 'apc'].includes(unitType)) {
      finalDamage *= (1 + modifier.effect.ground_units);
    }
    
    if (modifier.effect[unitType]) {
      finalDamage *= (1 + modifier.effect[unitType]);
    }
  }
  
  return Math.round(finalDamage);
}
```

### 2.3 Database Schema

**Ajout colonne à `portals`:**
```sql
ALTER TABLE portals 
ADD COLUMN modifiers JSONB DEFAULT '[]',
ADD COLUMN environment VARCHAR(50) DEFAULT 'standard';

CREATE INDEX idx_portals_modifiers ON portals USING gin(modifiers);
```

---

## 👥 3. CO-OP RAIDS (8h)

### 3.1 Alliance Raid System

**Table: `portal_alliance_raids`**
```sql
CREATE TABLE portal_alliance_raids (
  raid_id SERIAL PRIMARY KEY,
  portal_id INTEGER REFERENCES portals(portal_id) ON DELETE CASCADE,
  alliance_id INTEGER REFERENCES alliances(alliance_id) ON DELETE CASCADE,
  required_participants INTEGER DEFAULT 5,
  current_participants INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'recruiting', -- recruiting, active, completed, failed
  total_damage INTEGER DEFAULT 0,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE portal_raid_participants (
  participant_id SERIAL PRIMARY KEY,
  raid_id INTEGER REFERENCES portal_alliance_raids(raid_id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
  units_contributed JSONB NOT NULL,
  damage_dealt INTEGER DEFAULT 0,
  contribution_percent DECIMAL(5,2) DEFAULT 0,
  rewards_received JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(raid_id, user_id)
);
```

### 3.2 Raid Mechanics

**Seuils participants:**
- **Portail Bleu:** 3 joueurs minimum
- **Portail Violet:** 5 joueurs minimum
- **Portail Rouge:** 8 joueurs minimum
- **Portail Doré:** 10 joueurs minimum

**Contribution Tracking:**
```javascript
async calculateContributions(raidId) {
  const participants = await this.raidRepo.getParticipants(raidId);
  const totalDamage = participants.reduce((sum, p) => sum + p.damage_dealt, 0);
  
  for (const participant of participants) {
    const contribution = (participant.damage_dealt / totalDamage) * 100;
    
    // Reward scaling based on contribution
    let rewardMultiplier = 1.0;
    if (contribution >= 30) rewardMultiplier = 1.5; // Top contributor +50%
    else if (contribution >= 20) rewardMultiplier = 1.3;
    else if (contribution >= 10) rewardMultiplier = 1.1;
    else rewardMultiplier = 0.8; // Low contribution -20%
    
    await this.raidRepo.updateParticipant(participant.participant_id, {
      contribution_percent: contribution,
      reward_multiplier: rewardMultiplier
    });
  }
}
```

### 3.3 Loot Distribution

**Système équitable:**
1. **Base rewards** divisées par nombre participants
2. **Contribution bonus** appliqué (80%-150%)
3. **Rare drops** chance proportionnelle à contribution
4. **Guaranteed minimum** même si faible contribution

```javascript
async distributeLoot(raidId, baseRewards) {
  const participants = await this.raidRepo.getParticipants(raidId);
  const numParticipants = participants.length;
  
  for (const participant of participants) {
    // Base share
    const baseShare = this.divideRewards(baseRewards, numParticipants);
    
    // Apply contribution multiplier
    const finalRewards = this.multiplyRewards(
      baseShare, 
      participant.reward_multiplier
    );
    
    // Rare drops (luck-based)
    if (Math.random() < (participant.contribution_percent / 100)) {
      finalRewards.rare_items = this.rollRareItems(baseRewards.tier);
    }
    
    // Grant rewards
    await this.userRepo.grantRewards(participant.user_id, finalRewards);
    await this.raidRepo.updateParticipant(participant.participant_id, {
      rewards_received: finalRewards
    });
  }
}
```

---

## 🌟 4. SPECIAL EVENTS (0h - existing golden portal system extended)

### 4.1 World Boss Events

**Déjà implémenté via `global_event` flag.**

**Extensions possibles:**
- **Leaderboard temps réel** pendant événement
- **Server-wide progress bar** (HP boss partagé)
- **Milestone rewards** à 25%, 50%, 75% HP
- **Time-limited** (2h max, countdown visible)

### 4.2 Seasonal Events

```javascript
const SEASONAL_BOSSES = {
  winter_colossus: {
    season: 'winter',
    spawn_dates: ['2025-12-20', '2026-01-10'],
    tier: 'golden',
    special_rewards: ['winter_cosmetic', 'ice_blade_blueprint']
  },
  summer_phoenix: {
    season: 'summer',
    spawn_dates: ['2026-06-21', '2026-07-21'],
    tier: 'golden',
    special_rewards: ['phoenix_wings', 'flame_armor_blueprint']
  }
};
```

---

## 📊 API Extensions

### New Endpoints

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/v1/portals/bosses` | Liste boss actifs |
| GET | `/api/v1/portals/boss/:id` | Détail boss |
| POST | `/api/v1/portals/boss/:id/attack` | Attaquer boss |
| GET | `/api/v1/portals/boss/:id/log` | Battle log temps réel |
| POST | `/api/v1/portals/raids/create` | Créer raid alliance |
| POST | `/api/v1/portals/raids/:id/join` | Rejoindre raid |
| GET | `/api/v1/portals/raids/:id/status` | Status raid + participants |
| POST | `/api/v1/portals/raids/:id/start` | Lancer raid (leader) |

---

## 🎨 Frontend Components

### New Components (7 fichiers)

1. **BossBattleModal.jsx** (main modal)
2. **BossPhaseIndicator.jsx** (HP bar avec phases)
3. **BossBattleLog.jsx** (scrolling combat log)
4. **BossAbilityWarning.jsx** (animated warnings)
5. **PortalModifierBadge.jsx** (modifier display)
6. **RaidLobby.jsx** (co-op raid setup)
7. **RaidContributionPanel.jsx** (contribution tracking)

---

## ✅ Implementation Checklist

### Backend (15h)
- [ ] Create `portal_bosses` table + migrations (1h)
- [ ] Implement `PortalBossCombatService` (4h)
- [ ] Add boss spawn logic to spawner (2h)
- [ ] Implement phase system + abilities (3h)
- [ ] Create modifier application system (2h)
- [ ] Add API endpoints for bosses (2h)
- [ ] Write unit tests (1h)

### Frontend (8h)
- [ ] Create BossBattleModal component (3h)
- [ ] Implement phase indicator UI (1h)
- [ ] Add battle log scrolling (1h)
- [ ] Create modifier badge display (1h)
- [ ] Integrate with existing portal system (2h)

### Testing (2h)
- [ ] E2E test boss battle flow (1h)
- [ ] API integration tests (1h)

**Total: 25h**

---

## 🎯 Success Metrics

| Métrique | Objectif | Impact |
|----------|----------|--------|
| **Boss engagement rate** | >40% des portails | Depth |
| **Phase 3+ reach rate** | >25% des boss battles | Challenge |
| **Modifier variety** | 8+ modifiers actifs | Variety |
| **Raid participation** | >10% alliances | Social |
| **Boss battle duration** | 2-5 minutes | Engagement |

---

## 🔮 Future Extensions

### Phase 2 (Post-Release)
- **Named Bosses:** Uniques avec lore
- **Boss Collections:** Achievements par boss type
- **Speedrun Leaderboards:** Fastest kills
- **Nightmare Mode:** Boss versions ultra-hard
- **Boss Pets:** Rare drops cosmétiques

**Roadmap:** Q1 2026

---

**Document Status:** ✅ Specification Complete  
**Next Step:** Backend implementation (15h)  
**Dependencies:** Portal MVP system (✅ Complete)
