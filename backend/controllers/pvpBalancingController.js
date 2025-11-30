/**
 * PvP Balancing Controller
 * Exposes matchmaking, power calculation, and fairness check endpoints
 */

const { runWithContext, getLogger } = require('../utils/logger');
const logger = getLogger({ module: 'pvp-balancing-controller' });

const pvpBalancingController = ({ playerPowerService, pvpBalancingRules }) => {
  /**
   * GET /api/v1/pvp/power/:userId
   * Get player power score
   */
  const getPlayerPower = async (req, res) => {
    return runWithContext(async () => {
      try {
        const { userId } = req.params;
        const forceRefresh = req.query.refresh === 'true';

        const power = await playerPowerService.getPlayerPower(parseInt(userId), forceRefresh);

        res.status(200).json({
          success: true,
          data: {
            userId: parseInt(userId),
            power,
          },
        });
      } catch (error) {
        logger.error('Error fetching player power', { error: error.message });
        res.status(500).json({
          success: false,
          message: 'Failed to calculate player power',
        });
      }
    });
  };

  /**
   * GET /api/v1/pvp/power/me
   * Get current user's power score
   */
  const getMyPower = async (req, res) => {
    return runWithContext(async () => {
      try {
        const userId = req.user.id;
        const power = await playerPowerService.getPlayerPower(userId);

        res.status(200).json({
          success: true,
          data: {
            userId,
            power,
          },
        });
      } catch (error) {
        logger.error('Error fetching own power', { error: error.message });
        res.status(500).json({
          success: false,
          message: 'Failed to calculate your power',
        });
      }
    });
  };

  /**
   * GET /api/v1/pvp/power/me/breakdown
   * Get detailed power breakdown for current user
   */
  const getMyPowerBreakdown = async (req, res) => {
    return runWithContext(async () => {
      try {
        const userId = req.user.id;
        const breakdown = await playerPowerService.getPowerBreakdown(userId);

        res.status(200).json({
          success: true,
          data: breakdown,
        });
      } catch (error) {
        logger.error('Error fetching power breakdown', { error: error.message });
        res.status(500).json({
          success: false,
          message: 'Failed to get power breakdown',
        });
      }
    });
  };

  /**
   * GET /api/v1/pvp/matchmaking/fairness/:targetUserId
   * Check fairness of attacking a specific target
   */
  const checkMatchFairness = async (req, res) => {
    return runWithContext(async () => {
      try {
        const attackerId = req.user.id;
        const targetId = parseInt(req.params.targetUserId);

        const attackerPower = await playerPowerService.getPlayerPower(attackerId);
        const targetPower = await playerPowerService.getPlayerPower(targetId);

        const fairness = pvpBalancingRules.getMatchFairness(attackerPower, targetPower);
        const costModifier = pvpBalancingRules.calculateAttackCostModifier(attackerPower, targetPower);
        const rewardModifier = pvpBalancingRules.calculateRewardModifier(attackerPower, targetPower);

        res.status(200).json({
          success: true,
          data: {
            attackerId,
            targetId,
            attackerPower,
            targetPower,
            powerRatio: (targetPower / attackerPower).toFixed(2),
            fairness: {
              rating: fairness.fairness,
              message: fairness.message,
              powerDifference: fairness.powerDifference,
              color: fairness.color,
            },
            cost: {
              multiplier: costModifier.costMultiplier,
              goldPenalty: costModifier.goldPenalty,
              isWeakTarget: costModifier.isWeakTarget,
              message: costModifier.message,
            },
            rewards: {
              multiplier: rewardModifier.rewardMultiplier,
              message: rewardModifier.message,
            },
          },
        });
      } catch (error) {
        logger.error('Error checking match fairness', { error: error.message });
        res.status(500).json({
          success: false,
          message: 'Failed to check match fairness',
        });
      }
    });
  };

  /**
   * POST /api/v1/pvp/matchmaking/suggest
   * Get suggested targets based on current user's power
   * Body: { excludeUserIds: [1, 2, 3], limit: 10 }
   */
  const suggestTargets = async (req, res) => {
    return runWithContext(async () => {
      try {
        const attackerId = req.user.id;
        const { excludeUserIds = [], limit = 10 } = req.body;

        // Get attacker power
        const attackerPower = await playerPowerService.getPlayerPower(attackerId);

        // Get all potential targets (simplified - in production, query nearby players)
        // For now, we'll return a mock response structure
        // In production, this would query the database for nearby players

        const suggestions = {
          attackerId,
          attackerPower,
          optimalTargets: [],
          fairTargets: [],
          unfairTargets: [],
          message: 'Matchmaking suggestions based on power level',
        };

        res.status(200).json({
          success: true,
          data: suggestions,
        });
      } catch (error) {
        logger.error('Error suggesting targets', { error: error.message });
        res.status(500).json({
          success: false,
          message: 'Failed to suggest targets',
        });
      }
    });
  };

  /**
   * POST /api/v1/pvp/attack/estimate-cost
   * Estimate attack cost with PvP balancing
   * Body: { targetUserId, units: { infantry: 50 }, distance: 10 }
   */
  const estimateAttackCost = async (req, res) => {
    return runWithContext(async () => {
      try {
        const attackerId = req.user.id;
        const { targetUserId, units, distance = 10 } = req.body;

        const attackerPower = await playerPowerService.getPlayerPower(attackerId);
        const targetPower = await playerPowerService.getPlayerPower(targetUserId);

        const costModifier = pvpBalancingRules.calculateAttackCostModifier(attackerPower, targetPower);

        // Base costs (simplified calculation)
        const baseFuel = distance * 10;
        const baseFood = Object.values(units).reduce((sum, qty) => sum + qty, 0) * 2;

        const attackResources = {
          fuel: baseFuel,
          food: baseFood,
          gold: 0,
        };

        const scaledCosts = pvpBalancingRules.applyAttackCostScaling(attackResources, costModifier);

        res.status(200).json({
          success: true,
          data: {
            attackerId,
            targetUserId,
            attackerPower,
            targetPower,
            costs: scaledCosts,
          },
        });
      } catch (error) {
        logger.error('Error estimating attack cost', { error: error.message });
        res.status(500).json({
          success: false,
          message: 'Failed to estimate attack cost',
        });
      }
    });
  };

  return {
    getPlayerPower,
    getMyPower,
    getMyPowerBreakdown,
    checkMatchFairness,
    suggestTargets,
    estimateAttackCost,
  };
};

module.exports = pvpBalancingController;
