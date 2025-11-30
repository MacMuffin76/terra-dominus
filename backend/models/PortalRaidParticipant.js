const { DataTypes } = require('sequelize');

/**
 * PortalRaidParticipant - Individual participants in alliance raids
 * 
 * Tracks contribution and rewards for each member participating in raid.
 */
module.exports = (sequelize) => {
  const PortalRaidParticipant = sequelize.define('PortalRaidParticipant', {
    participant_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    raid_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'portal_alliance_raids',
        key: 'raid_id',
      },
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    damage_contributed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    contribution_percent: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      comment: 'Percentage of total raid damage',
    },
    units_sent: {
      type: DataTypes.JSONB,
      comment: 'Units contributed to raid',
      get() {
        const rawValue = this.getDataValue('units_sent');
        return rawValue || {};
      },
    },
    units_lost: {
      type: DataTypes.JSONB,
      comment: 'Units lost during raid',
      get() {
        const rawValue = this.getDataValue('units_lost');
        return rawValue || {};
      },
    },
    rewards_earned: {
      type: DataTypes.JSONB,
      comment: 'Individual rewards based on contribution',
      get() {
        const rawValue = this.getDataValue('rewards_earned');
        return rawValue || {};
      },
    },
    joined_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'portal_raid_participants',
    timestamps: false,
    indexes: [
      { fields: ['raid_id'] },
      { fields: ['user_id'] },
      { fields: ['raid_id', 'user_id'], unique: true },
    ],
  });

  PortalRaidParticipant.associate = (models) => {
    PortalRaidParticipant.belongsTo(models.PortalAllianceRaid, {
      foreignKey: 'raid_id',
      as: 'raid',
    });

    PortalRaidParticipant.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
    });
  };

  /**
   * Calculate contribution percentage
   */
  PortalRaidParticipant.prototype.calculateContribution = async function() {
    const raid = await this.getRaid();
    if (!raid || raid.total_damage === 0) {
      this.contribution_percent = 0;
    } else {
      this.contribution_percent = (this.damage_contributed / raid.total_damage) * 100;
    }
    return this.contribution_percent;
  };

  /**
   * Get reward multiplier based on contribution
   */
  PortalRaidParticipant.prototype.getRewardMultiplier = function() {
    // Contribution-based multiplier
    // 0-10% contribution: 0.5x
    // 10-20%: 1.0x
    // 20-30%: 1.25x
    // 30%+: 1.5x
    const contrib = this.contribution_percent;
    if (contrib < 10) return 0.5;
    if (contrib < 20) return 1.0;
    if (contrib < 30) return 1.25;
    return 1.5;
  };

  /**
   * Get participant summary
   */
  PortalRaidParticipant.prototype.getSummary = function() {
    return {
      participant_id: this.participant_id,
      user_id: this.user_id,
      damage_contributed: this.damage_contributed,
      contribution_percent: Math.round(this.contribution_percent * 100) / 100,
      reward_multiplier: this.getRewardMultiplier(),
      rewards_earned: this.rewards_earned,
      joined_at: this.joined_at,
    };
  };

  return PortalRaidParticipant;
};
