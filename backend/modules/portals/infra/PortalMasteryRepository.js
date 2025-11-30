/**
 * Portal Mastery Repository
 */

class PortalMasteryRepository {
  constructor({ PortalMastery }) {
    this.PortalMastery = PortalMastery;
  }

  /**
   * Find or create mastery record
   */
  async findOrCreate(userId, tier) {
    const [mastery, created] = await this.PortalMastery.findOrCreate({
      where: { user_id: userId, tier },
      defaults: {
        user_id: userId,
        tier,
        clears: 0,
        mastery_level: 0,
        total_rewards: {},
      },
    });

    return mastery;
  }

  /**
   * Get user's mastery for specific tier
   */
  async findByUserAndTier(userId, tier) {
    return await this.PortalMastery.findOne({
      where: { user_id: userId, tier },
    });
  }

  /**
   * Get all mastery records for user
   */
  async findByUser(userId) {
    return await this.PortalMastery.findAll({
      where: { user_id: userId },
      order: [['tier', 'ASC']],
    });
  }

  /**
   * Increment clear count and update mastery
   */
  async incrementClears(userId, tier, battleDuration, rewards) {
    const mastery = await this.findOrCreate(userId, tier);

    mastery.clears += 1;
    mastery.last_clear = new Date();

    // Update fastest time
    if (!mastery.fastest_time || battleDuration < mastery.fastest_time) {
      mastery.fastest_time = battleDuration;
    }

    // Aggregate rewards
    const totalRewards = mastery.total_rewards || {};
    for (const [resource, amount] of Object.entries(rewards)) {
      if (typeof amount === 'number') {
        totalRewards[resource] = (totalRewards[resource] || 0) + amount;
      }
    }
    mastery.total_rewards = totalRewards;

    // Calculate mastery level based on clears
    if (mastery.clears >= 100) {
      mastery.mastery_level = 4;
    } else if (mastery.clears >= 50) {
      mastery.mastery_level = 3;
    } else if (mastery.clears >= 25) {
      mastery.mastery_level = 2;
    } else if (mastery.clears >= 10) {
      mastery.mastery_level = 1;
    }

    mastery.updated_at = new Date();
    await mastery.save();

    return mastery;
  }

  /**
   * Get mastery bonuses for tier
   */
  getMasteryBonuses(masteryLevel) {
    const bonuses = {
      0: { rewardBonus: 0, costReduction: 0 },
      1: { rewardBonus: 5, costReduction: 0 },
      2: { rewardBonus: 10, costReduction: 10 },
      3: { rewardBonus: 15, costReduction: 20 },
      4: { rewardBonus: 25, costReduction: 20 },
    };

    return bonuses[masteryLevel] || bonuses[0];
  }

  /**
   * Get top players by clears for tier
   */
  async getTopPlayersByTier(tier, limit = 10) {
    return await this.PortalMastery.findAll({
      where: { tier },
      order: [['clears', 'DESC']],
      limit,
      include: ['user'],
    });
  }
}

module.exports = PortalMasteryRepository;
