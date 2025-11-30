/**
 * Battle Pass Service
 * Handles all battle pass related operations
 */

const { 
  BattlePassSeason, 
  BattlePassReward, 
  UserBattlePass, 
  UserBattlePassReward,
  User 
} = require('../../../models');
const { Op } = require('sequelize');
const { logger } = require('../../../utils/logger');

class BattlePassService {
  /**
   * Get active season with rewards
   */
  async getActiveSeason() {
    try {
      const season = await BattlePassSeason.findOne({
        where: { 
          is_active: true,
          start_date: { [Op.lte]: new Date() },
          end_date: { [Op.gte]: new Date() }
        },
        include: [{
          model: BattlePassReward,
          as: 'rewards',
          order: [['tier', 'ASC'], ['track', 'ASC']]
        }]
      });

      if (!season) {
        throw new Error('No active season found');
      }

      return season;
    } catch (error) {
      logger.error('Error getting active season:', error);
      throw error;
    }
  }

  /**
   * Get user's battle pass progress for active season
   */
  async getUserProgress(userId) {
    try {
      const season = await this.getActiveSeason();

      let userProgress = await UserBattlePass.findOne({
        where: {
          user_id: userId,
          season_id: season.id
        },
        include: [{
          model: UserBattlePassReward,
          as: 'claimedRewards',
          include: [{
            model: BattlePassReward,
            as: 'reward'
          }]
        }]
      });

      // Create progress record if it doesn't exist
      if (!userProgress) {
        userProgress = await UserBattlePass.create({
          user_id: userId,
          season_id: season.id,
          current_tier: 1,
          current_xp: 0,
          total_xp: 0,
          has_premium: false
        });
      }

      // Get all rewards for the season
      const allRewards = await BattlePassReward.findAll({
        where: { season_id: season.id },
        order: [['tier', 'ASC'], ['track', 'ASC']]
      });

      // Calculate which rewards are available to claim
      const claimedRewardIds = new Set(
        userProgress.claimedRewards?.map(cr => cr.reward_id) || []
      );

      const availableRewards = allRewards.filter(reward => {
        // Check if reward is at or below current tier
        const tierReached = reward.tier <= userProgress.current_tier;
        // Check if it's a premium reward and user has premium
        const canClaimPremium = reward.track === 'free' || userProgress.has_premium;
        // Check if not already claimed
        const notClaimed = !claimedRewardIds.has(reward.id);

        return tierReached && canClaimPremium && notClaimed;
      });

      return {
        season: {
          id: season.id,
          season_number: season.season_number,
          name: season.name,
          description: season.description,
          start_date: season.start_date,
          end_date: season.end_date,
          max_tier: season.max_tier,
          xp_per_tier: season.xp_per_tier,
          premium_price: season.premium_price,
          days_remaining: Math.ceil((season.end_date - new Date()) / (1000 * 60 * 60 * 24))
        },
        progress: {
          current_tier: userProgress.current_tier,
          current_xp: userProgress.current_xp,
          total_xp: userProgress.total_xp,
          has_premium: userProgress.has_premium,
          premium_purchased_at: userProgress.premium_purchased_at,
          xp_to_next_tier: season.xp_per_tier - userProgress.current_xp,
          completion_percentage: (userProgress.current_tier / season.max_tier) * 100
        },
        rewards: allRewards,
        claimedRewards: userProgress.claimedRewards || [],
        availableRewards
      };
    } catch (error) {
      logger.error('Error getting user progress:', error);
      throw error;
    }
  }

  /**
   * Add XP to user's battle pass
   */
  async addXP(userId, xpAmount, source = 'unknown') {
    try {
      const season = await this.getActiveSeason();

      let userProgress = await UserBattlePass.findOne({
        where: {
          user_id: userId,
          season_id: season.id
        }
      });

      if (!userProgress) {
        userProgress = await UserBattlePass.create({
          user_id: userId,
          season_id: season.id,
          current_tier: 1,
          current_xp: 0,
          total_xp: 0
        });
      }

      // Add XP
      let newTotalXP = userProgress.total_xp + xpAmount;
      let newCurrentXP = userProgress.current_xp + xpAmount;
      let newTier = userProgress.current_tier;
      let tiersGained = 0;

      // Check for tier ups
      while (newCurrentXP >= season.xp_per_tier && newTier < season.max_tier) {
        newCurrentXP -= season.xp_per_tier;
        newTier++;
        tiersGained++;
      }

      // Update user progress
      await userProgress.update({
        current_tier: newTier,
        current_xp: newCurrentXP,
        total_xp: newTotalXP
      });

      logger.info(`Battle Pass XP added: userId=${userId}, amount=${xpAmount}, source=${source}, tiersGained=${tiersGained}`);

      // Send notification if tier increased
      if (tiersGained > 0) {
        NotificationService.notifyBattlePassTierUp(userId, newTier, newCurrentXP);
      }

      // Mettre à jour le leaderboard Battle Pass
      const leaderboardIntegration = require('../../../utils/leaderboardIntegration');
      leaderboardIntegration.updateBattlePassScore(userId).catch(err => {
        logger.error('Error updating battle pass leaderboard:', err);
      });

      return {
        xpAdded: xpAmount,
        newTier: newTier,
        tiersGained,
        newCurrentXP,
        newTotalXP,
        xpToNextTier: season.xp_per_tier - newCurrentXP
      };
    } catch (error) {
      logger.error('Error adding XP:', error);
      throw error;
    }
  }

  /**
   * Claim a reward
   */
  async claimReward(userId, rewardId) {
    try {
      const season = await this.getActiveSeason();

      const userProgress = await UserBattlePass.findOne({
        where: {
          user_id: userId,
          season_id: season.id
        }
      });

      if (!userProgress) {
        throw new Error('User battle pass progress not found');
      }

      const reward = await BattlePassReward.findOne({
        where: {
          id: rewardId,
          season_id: season.id
        }
      });

      if (!reward) {
        throw new Error('Reward not found');
      }

      // Check if reward tier is reached
      if (reward.tier > userProgress.current_tier) {
        throw new Error('Tier not reached');
      }

      // Check if premium reward and user has premium
      if (reward.track === 'premium' && !userProgress.has_premium) {
        throw new Error('Premium battle pass required');
      }

      // Check if already claimed
      const alreadyClaimed = await UserBattlePassReward.findOne({
        where: {
          user_id: userId,
          reward_id: rewardId
        }
      });

      if (alreadyClaimed) {
        throw new Error('Reward already claimed');
      }

      // Grant the reward
      const grantResult = await this._grantReward(userId, reward);

      // Record the claim
      await UserBattlePassReward.create({
        user_id: userId,
        season_id: season.id,
        reward_id: rewardId
      });

      logger.info(`Battle Pass reward claimed: userId=${userId}, rewardId=${rewardId}, type=${reward.reward_type}`);

      return {
        reward,
        granted: grantResult
      };
    } catch (error) {
      logger.error('Error claiming reward:', error);
      throw error;
    }
  }

  /**
   * Claim all available rewards at once
   */
  async claimAllRewards(userId) {
    try {
      const progress = await this.getUserProgress(userId);
      const results = [];

      for (const reward of progress.availableRewards) {
        try {
          const result = await this.claimReward(userId, reward.id);
          results.push({ success: true, reward: result });
        } catch (error) {
          results.push({ success: false, reward, error: error.message });
        }
      }

      return {
        total: progress.availableRewards.length,
        claimed: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
      };
    } catch (error) {
      logger.error('Error claiming all rewards:', error);
      throw error;
    }
  }

  /**
   * Purchase premium battle pass
   */
  async purchasePremium(userId) {
    try {
      const season = await this.getActiveSeason();

      const userProgress = await UserBattlePass.findOne({
        where: {
          user_id: userId,
          season_id: season.id
        }
      });

      if (!userProgress) {
        throw new Error('User battle pass progress not found');
      }

      if (userProgress.has_premium) {
        throw new Error('Premium already owned');
      }

      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Check if user has enough gems (assuming gems field exists)
      // For now, we'll just activate premium
      // TODO: Implement gem currency system

      await userProgress.update({
        has_premium: true,
        premium_purchased_at: new Date()
      });

      logger.info(`Premium battle pass purchased: userId=${userId}, seasonId=${season.id}`);

      return {
        success: true,
        season_id: season.id,
        purchased_at: userProgress.premium_purchased_at
      };
    } catch (error) {
      logger.error('Error purchasing premium:', error);
      throw error;
    }
  }

  /**
   * Get battle pass leaderboard (by total XP)
   */
  async getLeaderboard(limit = 10) {
    try {
      const season = await this.getActiveSeason();

      const leaderboard = await UserBattlePass.findAll({
        where: { season_id: season.id },
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'pseudo']
        }],
        order: [
          ['current_tier', 'DESC'],
          ['current_xp', 'DESC']
        ],
        limit
      });

      return leaderboard.map((entry, index) => ({
        rank: index + 1,
        user_id: entry.user_id,
        username: entry.user?.username,
        pseudo: entry.user?.pseudo,
        current_tier: entry.current_tier,
        total_xp: entry.total_xp,
        has_premium: entry.has_premium
      }));
    } catch (error) {
      logger.error('Error getting leaderboard:', error);
      throw error;
    }
  }

  /**
   * Internal: Grant reward to user
   */
  async _grantReward(userId, reward) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const rewardData = reward.reward_data;
    const granted = {};

    switch (reward.reward_type) {
      case 'resources':
        if (rewardData.or) {
          await user.increment('or', { by: rewardData.or });
          granted.or = rewardData.or;
        }
        if (rewardData.metal) {
          await user.increment('metal', { by: rewardData.metal });
          granted.metal = rewardData.metal;
        }
        if (rewardData.carburant) {
          await user.increment('carburant', { by: rewardData.carburant });
          granted.carburant = rewardData.carburant;
        }
        break;

      case 'xp':
        if (rewardData.amount) {
          await user.increment('points_experience', { by: rewardData.amount });
          granted.xp = rewardData.amount;
          // Check for level up
          // TODO: Implement level up logic if needed
        }
        break;

      case 'gems':
        // TODO: Implement gem currency
        granted.gems = rewardData.amount;
        break;

      case 'cosmetic':
        // TODO: Store cosmetic items (avatars, badges, titles) in user profile
        granted.cosmetic = rewardData;
        break;

      case 'boost':
      case 'units':
      case 'buildings':
      case 'blueprint':
      case 'item':
        // TODO: Implement these reward types
        granted[reward.reward_type] = rewardData;
        break;

      default:
        logger.warn(`Unknown reward type: ${reward.reward_type}`);
    }

    return granted;
  }
}

module.exports = BattlePassService;
