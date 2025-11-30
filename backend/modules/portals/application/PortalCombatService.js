/**
 * Portal Combat Service
 * Handles battle resolution when players challenge portals
 */

const { getLogger, runWithContext } = require('../../../utils/logger');
const logger = getLogger({ module: 'portal-combat' });

class PortalCombatService {
  constructor({ portalRepository, portalAttemptRepository, userRepository, unitRepository, questService = null }) {
    this.portalRepository = portalRepository;
    this.portalAttemptRepository = portalAttemptRepository;
    this.userRepository = userRepository;
    this.unitRepository = unitRepository;
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
    return {
      attack: playerPower * modifier.attack,
      defense: playerPower * modifier.defense,
    };
  }

  /**
   * Simulate battle and calculate outcome
   */
  simulateBattle(playerUnits, enemyComposition, tactic = 'balanced') {
    const playerPower = this.calculateUnitPower(playerUnits);
    const enemyPower = this.calculateUnitPower(enemyComposition);

    const { attack, defense } = this.applyTacticModifiers(playerPower, tactic);
    const adjustedPlayerPower = (attack + defense) / 2;

    // Add randomness (±15%)
    const randomFactor = 0.85 + Math.random() * 0.3;
    const effectivePlayerPower = adjustedPlayerPower * randomFactor;

    // Determine outcome
    const powerRatio = effectivePlayerPower / enemyPower;

    let result = 'defeat';
    let survivalRate = 0;
    let battleDuration = 0;

    if (powerRatio >= 1.5) {
      // Overwhelming victory
      result = 'victory';
      survivalRate = 0.95;
      battleDuration = 60;
    } else if (powerRatio >= 1.2) {
      // Clear victory
      result = 'victory';
      survivalRate = 0.85;
      battleDuration = 90;
    } else if (powerRatio >= 1.0) {
      // Narrow victory
      result = 'victory';
      survivalRate = 0.70;
      battleDuration = 120;
    } else if (powerRatio >= 0.8) {
      // Close defeat
      result = 'defeat';
      survivalRate = 0.50;
      battleDuration = 100;
    } else if (powerRatio >= 0.5) {
      // Defeat
      result = 'defeat';
      survivalRate = 0.30;
      battleDuration = 80;
    } else {
      // Crushing defeat
      result = 'defeat';
      survivalRate = 0.10;
      battleDuration = 40;
    }

    // Calculate casualties
    const unitsLost = {};
    const unitsSurvived = {};

    for (const [unitType, count] of Object.entries(playerUnits)) {
      const survived = Math.floor(count * survivalRate);
      const lost = count - survived;

      unitsLost[unitType] = lost;
      unitsSurvived[unitType] = survived;
    }

    return {
      result,
      powerRatio: powerRatio.toFixed(2),
      survivalRate: (survivalRate * 100).toFixed(1) + '%',
      battleDuration,
      unitsLost,
      unitsSurvived,
      enemiesDefeated: result === 'victory' ? Object.values(enemyComposition).reduce((a, b) => a + b, 0) : 0,
    };
  }

  /**
   * Challenge a portal
   */
  async challengePortal(userId, portalId, units, tactic = 'balanced') {
    return runWithContext(async () => {
      try {
        // Validate portal
        const portal = await this.portalRepository.findById(portalId);
        if (!portal) {
          throw new Error('Portal not found');
        }

        if (portal.status !== 'active') {
          throw new Error('Portal is not active');
        }

        if (portal.hasExpired()) {
          await this.portalRepository.updateStatus(portalId, 'expired');
          throw new Error('Portal has expired');
        }

        // Validate user has units
        const user = await this.userRepository.findById(userId);
        if (!user) {
          throw new Error('User not found');
        }

        // TODO: Check user actually owns these units
        // For now, simplified validation

        // Simulate battle
        const battleResult = this.simulateBattle(units, portal.enemy_composition, tactic);

        logger.info(`Portal battle: User ${userId} vs Portal ${portalId}, Result: ${battleResult.result}, Ratio: ${battleResult.powerRatio}`);

        // Generate rewards if victory
        let rewards = {};
        if (battleResult.result === 'victory') {
          rewards = await this.generateRewards(portal.tier, portal.difficulty);
          
          // Award rewards to user
          await this.awardRewards(userId, rewards);

          // Mark portal as completed
          await this.portalRepository.updateStatus(portalId, 'completed');
        }

        // Record attempt
        const attempt = await this.portalAttemptRepository.create({
          portal_id: portalId,
          user_id: userId,
          units_sent: units,
          result: battleResult.result,
          units_lost: battleResult.unitsLost,
          units_survived: battleResult.unitsSurvived,
          rewards: rewards,
          battle_duration: battleResult.battleDuration,
          tactic_used: tactic,
        });

        // Update user units (remove lost units)
        // TODO: Implement unit deduction logic

        // Update mastery if victory
        if (battleResult.result === 'victory') {
          await this.updateMastery(userId, portal.tier, battleResult.battleDuration, rewards);
        }

        // Update quest progress
        if (this.questService) {
          try {
            // Portal attempt (always)
            await this.questService.updateQuestProgress(userId, 'portal_attempts', 1);

            // Portal victory
            if (battleResult.result === 'victory') {
              await this.questService.updateQuestProgress(userId, 'portal_victories', 1, {
                portal_tier: portal.tier,
              });

              // Perfect victory (no units lost)
              if (battleResult.unitsLost.total === 0) {
                await this.questService.updateQuestProgress(userId, 'perfect_victories', 1);
              }

              // Tactic victory
              if (tactic && tactic !== 'balanced') {
                await this.questService.updateQuestProgress(userId, 'tactic_victories', 1, {
                  tactic,
                });
              }
            }

            // Damage dealt
            const totalDamage = battleResult.enemiesDefeated?.total || 0;
            if (totalDamage > 0) {
              await this.questService.updateQuestProgress(userId, 'damage_dealt', totalDamage);
            }

            // Gold collected
            if (rewards.gold) {
              await this.questService.updateQuestProgress(userId, 'gold_collected', rewards.gold);
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
          result: battleResult.result,
          battleReport: {
            duration: battleResult.battleDuration,
            unitsLost: battleResult.unitsLost,
            unitsSurvived: battleResult.unitsSurvived,
            enemiesDefeated: battleResult.enemiesDefeated,
            powerRatio: battleResult.powerRatio,
            survivalRate: battleResult.survivalRate,
          },
          rewards,
          attemptId: attempt.id,
        };
      } catch (error) {
        logger.error(`Failed to challenge portal ${portalId} for user ${userId}:`, error);
        throw error;
      }
    });
  }

  /**
   * Generate rewards based on tier and difficulty
   */
  async generateRewards(tier, difficulty) {
    const rewardsConfig = {
      grey: {
        resources: { min: 100, max: 500 },
        gold: { min: 50, max: 150 },
        xp: { min: 100, max: 250 },
        blueprintChance: 0.05,
        blueprintRarity: 'common',
      },
      green: {
        resources: { min: 500, max: 1500 },
        gold: { min: 150, max: 400 },
        xp: { min: 300, max: 600 },
        blueprintChance: 0.10,
        blueprintRarity: 'uncommon',
      },
      blue: {
        resources: { min: 1000, max: 3000 },
        gold: { min: 400, max: 800 },
        xp: { min: 700, max: 1200 },
        blueprintChance: 0.15,
        blueprintRarity: 'rare',
      },
      purple: {
        resources: { min: 2000, max: 5000 },
        gold: { min: 1000, max: 2000 },
        xp: { min: 1500, max: 2500 },
        blueprintChance: 0.20,
        blueprintRarity: 'epic',
      },
      red: {
        resources: { min: 5000, max: 10000 },
        gold: { min: 2500, max: 5000 },
        xp: { min: 3000, max: 5000 },
        blueprintChance: 0.25,
        blueprintRarity: 'legendary',
      },
      golden: {
        resources: { min: 10000, max: 20000 },
        gold: { min: 5000, max: 10000 },
        xp: { min: 6000, max: 10000 },
        blueprintChance: 0.30,
        blueprintRarity: 'mythic',
      },
    };

    const config = rewardsConfig[tier] || rewardsConfig.grey;

    // Apply difficulty multiplier
    const difficultyMultiplier = 1 + (difficulty - 1) * 0.1;

    const rewards = {
      wood: Math.floor((config.resources.min + Math.random() * (config.resources.max - config.resources.min)) * difficultyMultiplier),
      stone: Math.floor((config.resources.min + Math.random() * (config.resources.max - config.resources.min)) * difficultyMultiplier),
      iron: Math.floor((config.resources.min + Math.random() * (config.resources.max - config.resources.min)) * difficultyMultiplier),
      food: Math.floor((config.resources.min + Math.random() * (config.resources.max - config.resources.min)) * difficultyMultiplier),
      gold: Math.floor((config.gold.min + Math.random() * (config.gold.max - config.gold.min)) * difficultyMultiplier),
      xp: Math.floor((config.xp.min + Math.random() * (config.xp.max - config.xp.min)) * difficultyMultiplier),
    };

    // Blueprint drop
    if (Math.random() < config.blueprintChance) {
      rewards.blueprints = [
        {
          id: Math.floor(Math.random() * 100) + 1,
          name: `${config.blueprintRarity} Blueprint`,
          rarity: config.blueprintRarity,
        },
      ];
    }

    return rewards;
  }

  /**
   * Award rewards to user
   */
  async awardRewards(userId, rewards) {
    // TODO: Implement reward distribution
    // - Add resources to user's storage
    // - Add gold to user's balance
    // - Award XP
    // - Unlock blueprints
    logger.info(`Awarding rewards to user ${userId}:`, rewards);
  }

  /**
   * Update portal mastery for user
   */
  async updateMastery(userId, tier, battleDuration, rewards) {
    // TODO: Implement mastery update logic
    logger.info(`Updating mastery for user ${userId}, tier ${tier}`);
  }

  /**
   * Get battle estimates before attack
   */
  async estimateBattle(portalId, units) {
    const portal = await this.portalRepository.findById(portalId);
    if (!portal) {
      throw new Error('Portal not found');
    }

    const playerPower = this.calculateUnitPower(units);
    const enemyPower = this.calculateUnitPower(portal.enemy_composition);
    const powerRatio = playerPower / enemyPower;

    let estimate = 'Very Difficult';
    if (powerRatio >= 1.5) estimate = 'Easy';
    else if (powerRatio >= 1.2) estimate = 'Moderate';
    else if (powerRatio >= 1.0) estimate = 'Challenging';
    else if (powerRatio >= 0.8) estimate = 'Difficult';

    return {
      playerPower,
      enemyPower,
      powerRatio: powerRatio.toFixed(2),
      estimate,
      recommendedPower: portal.recommended_power,
    };
  }
}

module.exports = PortalCombatService;
