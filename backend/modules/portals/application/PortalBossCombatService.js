/**
 * Portal Boss Combat Service
 * Handles multi-phase boss battles with special abilities
 */

const { getLogger, runWithContext } = require('../../../utils/logger');
const logger = getLogger({ module: 'portal-boss-combat' });

// Boss phase configuration
const BOSS_PHASES = {
  phase_1: {
    hp_range: [100, 75],
    behavior: 'standard',
    abilities: [],
    trigger_message: null,
    attack_modifier: 1.0,
    defense_modifier: 1.0,
  },
  phase_2: {
    hp_range: [75, 50],
    behavior: 'defensive',
    abilities: ['shield_regeneration', 'life_drain'],
    trigger_message: '⚠️ Le boss active ses boucliers!',
    attack_modifier: 0.9,
    defense_modifier: 1.2,
  },
  phase_3: {
    hp_range: [50, 25],
    behavior: 'aggressive',
    abilities: ['aoe_blast', 'summon_minions', 'rage_mode'],
    trigger_message: '🔥 Le boss entre en rage!',
    attack_modifier: 1.3,
    defense_modifier: 0.9,
  },
  phase_4: {
    hp_range: [25, 0],
    behavior: 'berserk',
    abilities: ['unit_disable', 'time_warp', 'aoe_blast', 'life_drain'],
    trigger_message: '💀 Phase finale! Le boss est désespéré!',
    attack_modifier: 1.5,
    defense_modifier: 0.8,
  },
};

// Boss ability definitions
const BOSS_ABILITIES = {
  shield_regeneration: {
    name: 'Shield Regeneration',
    icon: '🛡️',
    cooldown: 30000,
    effect: (boss) => {
      const healAmount = Math.floor(boss.base_hp * 0.15);
      boss.current_hp = Math.min(boss.base_hp, boss.current_hp + healAmount);
      return {
        type: 'heal',
        amount: healAmount,
        message: `🛡️ Le boss régénère ${healAmount} HP!`,
        animation: 'heal_pulse',
      };
    },
  },
  aoe_blast: {
    name: 'AoE Blast',
    icon: '💥',
    chance: 0.3,
    effect: (playerUnits) => {
      const aoeDamage = 0.1;
      const losses = {};
      let totalLosses = 0;

      for (const unitType of ['infantry', 'tanks', 'artillery']) {
        if (playerUnits[unitType]) {
          const lossCount = Math.ceil(playerUnits[unitType] * aoeDamage);
          playerUnits[unitType] = Math.max(0, playerUnits[unitType] - lossCount);
          losses[unitType] = lossCount;
          totalLosses += lossCount;
        }
      }

      return {
        type: 'aoe_damage',
        losses,
        totalLosses,
        message: `💥 AoE Blast! ${totalLosses} unités terrestres détruites!`,
        animation: 'explosion',
      };
    },
  },
  unit_disable: {
    name: 'Unit Disable',
    icon: '⚡',
    chance: 0.3,
    effect: (playerUnits) => {
      const unitTypes = Object.keys(playerUnits).filter((t) => playerUnits[t] > 0);
      if (unitTypes.length === 0) {
        return { type: 'no_target', message: 'Aucune cible disponible' };
      }

      const targetType = unitTypes[Math.floor(Math.random() * unitTypes.length)];
      const disableCount = Math.ceil(playerUnits[targetType] * 0.3);
      playerUnits[targetType] = Math.max(0, playerUnits[targetType] - disableCount);

      return {
        type: 'disable',
        target: targetType,
        count: disableCount,
        message: `⚡ ${disableCount} ${targetType} désactivées!`,
        animation: 'lightning',
      };
    },
  },
  summon_minions: {
    name: 'Summon Minions',
    icon: '👹',
    chance: 0.25,
    effect: (playerUnits, boss) => {
      // Minions deal flat damage over time
      const minionDamage = Math.floor(boss.base_hp * 0.05);
      const unitTypes = Object.keys(playerUnits).filter((t) => playerUnits[t] > 0);
      if (unitTypes.length > 0) {
        const targetType = unitTypes[Math.floor(Math.random() * unitTypes.length)];
        const casualties = Math.ceil(playerUnits[targetType] * 0.05);
        playerUnits[targetType] = Math.max(0, playerUnits[targetType] - casualties);
        return {
          type: 'summon',
          damage: minionDamage,
          casualties,
          target: targetType,
          message: `👹 Le boss invoque des serviteurs! ${casualties} ${targetType} perdues!`,
          animation: 'summon',
        };
      }
      return { type: 'summon_failed', message: '👹 Invocation échouée!' };
    },
  },
  rage_mode: {
    name: 'Rage Mode',
    icon: '😡',
    chance: 0.2,
    effect: (boss) => {
      // Temporary attack boost
      return {
        type: 'buff',
        boost: 1.5, // +50% attack for 3 rounds
        duration: 3,
        message: '😡 Le boss entre en RAGE! +50% attaque pendant 3 rounds!',
        animation: 'rage_aura',
      };
    },
  },
  time_warp: {
    name: 'Time Warp',
    icon: '⏰',
    chance: 0.15,
    effect: (playerUnits) => {
      // Resets cooldowns and delays player attacks
      const allUnitCount = Object.values(playerUnits).reduce((sum, count) => sum + count, 0);
      return {
        type: 'debuff',
        effect: 'slow',
        penalty: 0.3, // -30% damage next round
        message: `⏰ Distorsion temporelle! -30% dégâts au prochain round!`,
        animation: 'time_distortion',
      };
    },
  },
  life_drain: {
    name: 'Life Drain',
    icon: '🩸',
    chance: 0.25,
    effect: (playerUnits, boss) => {
      const totalUnits = Object.values(playerUnits).reduce((sum, count) => sum + count, 0);
      const drainAmount = Math.floor(totalUnits * 50); // 50 HP per unit
      const actualHeal = Math.min(drainAmount, boss.base_hp - boss.current_hp);
      boss.current_hp = Math.min(boss.base_hp, boss.current_hp + actualHeal);
      
      // Also damages units slightly
      const unitTypes = Object.keys(playerUnits).filter((t) => playerUnits[t] > 0);
      if (unitTypes.length > 0) {
        const targetType = unitTypes[Math.floor(Math.random() * unitTypes.length)];
        const drainLoss = Math.ceil(playerUnits[targetType] * 0.08);
        playerUnits[targetType] = Math.max(0, playerUnits[targetType] - drainLoss);
      }
      
      return {
        type: 'drain',
        amount: actualHeal,
        message: `🩸 Le boss draine la vie! +${actualHeal} HP récupérés!`,
        animation: 'life_drain',
      };
    },
  },
};

class PortalBossCombatService {
  constructor({
    portalRepository,
    portalAttemptRepository,
    userRepository,
    unitRepository,
    models,
    questService = null,
  }) {
    this.portalRepository = portalRepository;
    this.portalAttemptRepository = portalAttemptRepository;
    this.userRepository = userRepository;
    this.unitRepository = unitRepository;
    this.PortalBoss = models.PortalBoss;
    this.PortalBossAttempt = models.PortalBossAttempt;
    this.questService = questService;
  }

  /**
   * Calculate unit combat power
   */
  calculateUnitPower(units) {
    const unitStats = {
      infantry: { attack: 10, defense: 8, health: 100 },
      tanks: { attack: 40, defense: 30, health: 300 },
      artillery: { attack: 60, defense: 15, health: 150 },
      scouts: { attack: 5, defense: 5, health: 50 },
      mechs: { attack: 100, defense: 80, health: 500 },
      eliteSoldiers: { attack: 25, defense: 20, health: 200 },
    };

    let totalPower = 0;
    for (const [unitType, count] of Object.entries(units)) {
      const stats = unitStats[unitType] || { attack: 10, defense: 10, health: 100 };
      const unitPower = (stats.attack + stats.defense) * count;
      totalPower += unitPower;
    }

    return totalPower;
  }

  /**
   * Apply tactic modifiers
   */
  applyTacticModifiers(playerPower, tactic) {
    const modifiers = {
      balanced: { attack: 1.0, defense: 1.0 },
      aggressive: { attack: 1.3, defense: 0.7 },
      defensive: { attack: 0.7, defense: 1.3 },
    };

    const modifier = modifiers[tactic] || modifiers.balanced;
    return playerPower * ((modifier.attack + modifier.defense) / 2);
  }

  /**
   * Determine current phase based on HP
   */
  determinePhase(currentHP, maxHP) {
    const hpPercent = (currentHP / maxHP) * 100;
    if (hpPercent > 75) return 1;
    if (hpPercent > 50) return 2;
    if (hpPercent > 25) return 3;
    return 4;
  }

  /**
   * Count total units remaining
   */
  countTotalUnits(units) {
    return Object.values(units).reduce((sum, count) => sum + count, 0);
  }

  /**
   * Calculate damage based on power differential
   */
  calculateDamage(attackPower, defense) {
    const baseDamage = attackPower * 0.1; // 10% of attack power per round
    const damageReduction = defense * 0.05; // 5% reduction per defense point
    return Math.max(1, Math.floor(baseDamage - damageReduction));
  }

  /**
   * Calculate boss attack damage
   */
  calculateBossAttack(boss, phase) {
    const baseAttack = boss.defense * (1 + phase * 0.2); // +20% per phase
    return Math.floor(baseAttack * 0.05); // Converted to unit losses
  }

  /**
   * Apply damage to player units
   */
  applyDamageToUnits(units, damage) {
    const unitArray = Object.keys(units).filter((type) => units[type] > 0);
    if (unitArray.length === 0) return units;

    // Distribute damage across unit types
    const damagePerType = Math.ceil(damage / unitArray.length);

    for (const unitType of unitArray) {
      const losses = Math.min(units[unitType], damagePerType);
      units[unitType] -= losses;
    }

    return units;
  }

  /**
   * Trigger phase transition abilities
   */
  triggerPhaseAbilities(boss, phase, battleLog) {
    const phaseData = BOSS_PHASES[`phase_${phase}`];
    const results = [];

    for (const abilityId of phaseData.abilities) {
      if (abilityId === 'shield_regeneration') {
        const ability = BOSS_ABILITIES.shield_regeneration;
        const result = ability.effect(boss);
        battleLog.push({
          event: 'boss_ability',
          ability: abilityId,
          ...result,
        });
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Process boss abilities during combat
   */
  processBossAbilities(boss, phase, playerUnits, battleLog) {
    const phaseData = BOSS_PHASES[`phase_${phase}`];
    const results = [];

    for (const abilityId of phaseData.abilities) {
      if (abilityId === 'shield_regeneration' || abilityId === 'life_drain') continue; // Only on phase transition

      const ability = BOSS_ABILITIES[abilityId];
      if (Math.random() < (ability.chance || 0.3)) {
        const result = ability.effect(playerUnits, boss);
        battleLog.push({
          event: 'boss_ability',
          ability: abilityId,
          phase,
          ...result,
        });
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Calculate battle losses
   */
  calculateLosses(originalUnits, remainingUnits) {
    const losses = {};
    for (const [unitType, originalCount] of Object.entries(originalUnits)) {
      const remaining = remainingUnits[unitType] || 0;
      losses[unitType] = originalCount - remaining;
    }
    return losses;
  }

  /**
   * Multiply rewards by a bonus factor
   */
  multiplyRewards(rewards, multiplier) {
    const multipliedRewards = {};
    for (const [key, value] of Object.entries(rewards)) {
      if (typeof value === 'number') {
        multipliedRewards[key] = Math.floor(value * multiplier);
      } else {
        multipliedRewards[key] = value;
      }
    }
    return multipliedRewards;
  }

  /**
   * Generate consolation rewards for defeat
   */
  consolationRewards(baseRewards) {
    return this.multiplyRewards(baseRewards, 0.25); // 25% of base rewards
  }

  /**
   * Generate tier-specific loot tables
   */
  generateTierLoot(tier, phasesReached, bossType) {
    const TIER_LOOT = {
      grey: {
        gold: { min: 800, max: 1200 },
        experience: { min: 80, max: 120 },
        items: [
          { type: 'resource_pack', rarity: 'common', chance: 0.5 },
          { type: 'unit_blueprint', rarity: 'common', chance: 0.3 },
        ],
      },
      green: {
        gold: { min: 2000, max: 3000 },
        experience: { min: 200, max: 300 },
        items: [
          { type: 'resource_pack', rarity: 'uncommon', chance: 0.6 },
          { type: 'unit_blueprint', rarity: 'uncommon', chance: 0.4 },
          { type: 'building_upgrade', rarity: 'common', chance: 0.35 },
        ],
      },
      blue: {
        gold: { min: 4500, max: 5500 },
        experience: { min: 450, max: 550 },
        items: [
          { type: 'resource_pack', rarity: 'rare', chance: 0.7 },
          { type: 'unit_blueprint', rarity: 'rare', chance: 0.5 },
          { type: 'building_upgrade', rarity: 'uncommon', chance: 0.45 },
          { type: 'artifact_fragment', rarity: 'rare', chance: 0.25 },
        ],
      },
      purple: {
        gold: { min: 9000, max: 11000 },
        experience: { min: 900, max: 1100 },
        items: [
          { type: 'resource_pack', rarity: 'epic', chance: 0.8 },
          { type: 'unit_blueprint', rarity: 'epic', chance: 0.6 },
          { type: 'building_upgrade', rarity: 'rare', chance: 0.55 },
          { type: 'artifact_fragment', rarity: 'epic', chance: 0.4 },
          { type: 'boss_token', rarity: 'epic', chance: 0.3 },
        ],
      },
      red: {
        gold: { min: 22000, max: 28000 },
        experience: { min: 2200, max: 2800 },
        items: [
          { type: 'resource_pack', rarity: 'legendary', chance: 0.85 },
          { type: 'unit_blueprint', rarity: 'legendary', chance: 0.7 },
          { type: 'building_upgrade', rarity: 'epic', chance: 0.65 },
          { type: 'artifact_fragment', rarity: 'legendary', chance: 0.5 },
          { type: 'boss_token', rarity: 'legendary', chance: 0.45 },
          { type: 'exclusive_skin', rarity: 'legendary', chance: 0.15 },
        ],
      },
      golden: {
        gold: { min: 90000, max: 110000 },
        experience: { min: 9000, max: 11000 },
        items: [
          { type: 'resource_pack', rarity: 'mythic', chance: 1.0 },
          { type: 'unit_blueprint', rarity: 'mythic', chance: 0.85 },
          { type: 'building_upgrade', rarity: 'legendary', chance: 0.75 },
          { type: 'artifact', rarity: 'mythic', chance: 0.6 },
          { type: 'boss_token', rarity: 'mythic', chance: 0.55 },
          { type: 'exclusive_skin', rarity: 'mythic', chance: 0.3 },
          { type: 'title', rarity: 'mythic', chance: 0.2 },
        ],
      },
    };

    const tierData = TIER_LOOT[tier] || TIER_LOOT.grey;
    const phaseBonus = 1 + (phasesReached - 1) * 0.25;

    // Generate loot
    const loot = {
      gold: Math.floor(
        (tierData.gold.min + Math.random() * (tierData.gold.max - tierData.gold.min)) * phaseBonus
      ),
      experience: Math.floor(
        (tierData.experience.min +
          Math.random() * (tierData.experience.max - tierData.experience.min)) *
          phaseBonus
      ),
      items: [],
    };

    // Roll for items
    for (const itemDef of tierData.items) {
      if (Math.random() < itemDef.chance) {
        loot.items.push({
          type: itemDef.type,
          rarity: itemDef.rarity,
          quantity: itemDef.type === 'resource_pack' ? Math.ceil(phasesReached * 2) : 1,
        });
      }
    }

    // Boss-type specific bonus
    const bossTypeBonus = this.getBossTypeBonus(bossType);
    if (bossTypeBonus) {
      loot.items.push(bossTypeBonus);
    }

    return loot;
  }

  /**
   * Get boss-type specific bonus items
   */
  getBossTypeBonus(bossType) {
    const BOSS_TYPE_BONUSES = {
      elite_guardian: { type: 'defense_rune', rarity: 'rare', stat: 'defense +10%' },
      ancient_titan: { type: 'strength_rune', rarity: 'rare', stat: 'attack +10%' },
      void_reaver: { type: 'speed_rune', rarity: 'rare', stat: 'movement +15%' },
      cosmic_emperor: { type: 'cosmic_essence', rarity: 'epic', stat: 'all stats +5%' },
    };

    return BOSS_TYPE_BONUSES[bossType] || null;
  }

  /**
   * Simulate boss battle with multi-phase mechanics
   */
  async simulateBossBattle(userId, bossId, units, tactic = 'balanced') {
    return runWithContext(async () => {
      try {
        // Load boss
        const boss = await this.PortalBoss.findByPk(bossId, {
          include: [{ association: 'portal' }],
        });

        if (!boss) {
          throw new Error('Boss not found');
        }

        if (!boss.isAlive()) {
          throw new Error('Boss already defeated');
        }

        // Initialize battle state
        const battleLog = [];
        let bossHP = boss.current_hp;
        const playerUnits = { ...units };
        let playerPower = this.calculateUnitPower(playerUnits);
        playerPower = this.applyTacticModifiers(playerPower, tactic);

        let round = 1;
        let currentPhase = this.determinePhase(bossHP, boss.base_hp);
        const maxRounds = 50;

        logger.info(
          `Boss battle started: User ${userId} vs Boss ${bossId} (${boss.boss_type}), Player power: ${playerPower}, Boss HP: ${bossHP}`
        );

        // Battle simulation loop
        while (bossHP > 0 && this.hasUnitsRemaining(playerUnits) && round <= maxRounds) {
          // Check phase transition
          const newPhase = this.determinePhase(bossHP, boss.base_hp);
          if (newPhase !== currentPhase) {
            currentPhase = newPhase;
            const phaseData = BOSS_PHASES[`phase_${currentPhase}`];
            battleLog.push({
              round,
              event: 'phase_transition',
              phase: currentPhase,
              message: phaseData.trigger_message,
            });

            // Trigger phase abilities
            this.triggerPhaseAbilities(boss, currentPhase, battleLog);
            bossHP = boss.current_hp; // Update after heal
          }

          // Player attack
          const playerDamage = this.calculateDamage(playerPower, boss.defense);
          bossHP -= playerDamage;
          battleLog.push({
            round,
            event: 'player_attack',
            damage: playerDamage,
            boss_hp: Math.max(0, bossHP),
          });

          if (bossHP <= 0) break; // Boss defeated

          // Boss abilities (if phase > 1)
          if (currentPhase > 1) {
            this.processBossAbilities(boss, currentPhase, playerUnits, battleLog);
          }

          // Boss counterattack
          const bossAttack = this.calculateBossAttack(boss, currentPhase);
          this.applyDamageToUnits(playerUnits, bossAttack);
          battleLog.push({
            round,
            event: 'boss_attack',
            damage: bossAttack,
            units_remaining: this.countTotalUnits(playerUnits),
          });

          round++;
        }

        // Determine result
        const victory = bossHP <= 0;
        const phasesReached = currentPhase;
        const damageDealt = boss.base_hp - Math.max(0, bossHP);

        // Get portal tier for loot calculation
        const portalTier = boss.portal?.tier || 'grey';

        // Generate tier-specific loot
        const loot = victory
          ? this.generateTierLoot(portalTier, phasesReached, boss.boss_type)
          : {
              gold: Math.floor(this.generateTierLoot(portalTier, phasesReached, boss.boss_type).gold * 0.25),
              experience: Math.floor(this.generateTierLoot(portalTier, phasesReached, boss.boss_type).experience * 0.25),
              items: [],
            };

        // Legacy rewards for backward compatibility
        const baseRewards = boss.rewards || { gold: loot.gold, experience: loot.experience };
        const phaseBonus = 1 + (phasesReached - 1) * 0.25;
        const finalRewards = victory
          ? { ...this.multiplyRewards(baseRewards, phaseBonus), ...loot }
          : this.consolationRewards(baseRewards);

        // Calculate losses
        const unitsLost = this.calculateLosses(units, playerUnits);

        // Update boss if defeated
        if (victory) {
          boss.current_hp = 0;
          boss.defeated = true;
          boss.defeated_by = userId;
          boss.defeated_at = new Date();
          await boss.save();
        } else {
          // Update boss HP for persistent battle
          boss.current_hp = Math.max(0, bossHP);
          boss.current_phase = currentPhase;
          await boss.save();
        }

        // Record attempt
        const attempt = await this.PortalBossAttempt.create({
          boss_id: bossId,
          user_id: userId,
          units_sent: units,
          damage_dealt: damageDealt,
          phases_reached: phasesReached,
          abilities_triggered: battleLog.filter((log) => log.event === 'boss_ability'),
          result: victory ? 'victory' : 'defeat',
          units_lost: unitsLost,
          units_survived: playerUnits,
          rewards: finalRewards,
          battle_log: battleLog,
          tactic_used: tactic,
        });

        logger.info(
          `Boss battle completed: Result ${victory ? 'VICTORY' : 'DEFEAT'}, Phases: ${phasesReached}, Damage: ${damageDealt}`
        );

        // Update quest progress
        if (this.questService) {
          try {
            // Boss defeat
            if (victory) {
              await this.questService.updateQuestProgress(userId, 'boss_defeats', 1, {
                boss_type: boss.boss_type,
              });
            }

            // Boss phase reached
            if (phasesReached > 1) {
              await this.questService.updateQuestProgress(userId, 'boss_phase_reached', 1, {
                phase: phasesReached,
              });
            }

            // Damage dealt
            if (damageDealt > 0) {
              await this.questService.updateQuestProgress(userId, 'damage_dealt', damageDealt);
            }

            // Gold collected from rewards
            if (finalRewards.gold) {
              await this.questService.updateQuestProgress(userId, 'gold_collected', finalRewards.gold);
            }

            // Units sent
            const totalUnitsSent = Object.values(units).reduce((sum, count) => sum + count, 0);
            if (totalUnitsSent > 0) {
              await this.questService.updateQuestProgress(userId, 'units_sent', totalUnitsSent);
            }
          } catch (error) {
            logger.error('Failed to update quest progress:', error);
            // Don't fail the battle if quest update fails
          }
        }

        return {
          success: true,
          result: victory ? 'victory' : 'defeat',
          phases_reached: phasesReached,
          damage_dealt: damageDealt,
          boss_hp_remaining: Math.max(0, bossHP),
          units_lost: unitsLost,
          units_survived: playerUnits,
          rewards: finalRewards,
          battle_log: battleLog,
          attempt_id: attempt.attempt_id,
        };
      } catch (error) {
        logger.error(`Boss battle failed for user ${userId}:`, error);
        throw error;
      }
    });
  }

  /**
   * Check if player has units remaining
   */
  hasUnitsRemaining(units) {
    return this.countTotalUnits(units) > 0;
  }

  /**
   * Get boss battle estimates
   */
  async estimateBossBattle(bossId, units) {
    const boss = await this.PortalBoss.findByPk(bossId);
    if (!boss) {
      throw new Error('Boss not found');
    }

    const playerPower = this.calculateUnitPower(units);
    const bossPower = boss.base_hp * (boss.defense / 10);
    const powerRatio = playerPower / bossPower;

    let estimate = 'Extremely Difficult';
    let recommendedPhases = 1;

    if (powerRatio >= 2.0) {
      estimate = 'Manageable';
      recommendedPhases = 4;
    } else if (powerRatio >= 1.5) {
      estimate = 'Challenging';
      recommendedPhases = 3;
    } else if (powerRatio >= 1.0) {
      estimate = 'Difficult';
      recommendedPhases = 2;
    } else if (powerRatio >= 0.7) {
      estimate = 'Very Difficult';
      recommendedPhases = 1;
    }

    return {
      playerPower,
      bossPower: Math.floor(bossPower),
      powerRatio: powerRatio.toFixed(2),
      estimate,
      recommendedPhases,
      currentPhase: boss.getCurrentPhase(),
      bossInfo: boss.getSummary(),
    };
  }

  /**
   * Get boss attempt history for user
   */
  async getUserBossAttempts(userId, limit = 10) {
    const attempts = await this.PortalBossAttempt.findAll({
      where: { user_id: userId },
      include: [
        {
          association: 'boss',
          include: ['portal'],
        },
      ],
      order: [['created_at', 'DESC']],
      limit,
    });

    return attempts.map((attempt) => attempt.getSummary());
  }
}

module.exports = PortalBossCombatService;
