const { DataTypes } = require('sequelize');

/**
 * PortalBossAttempt - Record of boss battle attempts
 * 
 * Tracks individual player attempts against bosses with detailed battle logs.
 */
module.exports = (sequelize) => {
  const PortalBossAttempt = sequelize.define('PortalBossAttempt', {
    attempt_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    boss_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'portal_bosses',
        key: 'boss_id',
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
    units_sent: {
      type: DataTypes.JSONB,
      allowNull: false,
      comment: 'Unit composition sent to battle',
      get() {
        const rawValue = this.getDataValue('units_sent');
        return rawValue || {};
      },
    },
    damage_dealt: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Total damage dealt to boss',
    },
    phases_reached: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: 'Highest phase reached in this attempt',
    },
    abilities_triggered: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Boss abilities that triggered during battle',
      get() {
        const rawValue = this.getDataValue('abilities_triggered');
        return rawValue || [];
      },
    },
    result: {
      type: DataTypes.ENUM('victory', 'defeat', 'phase_cleared'),
      allowNull: false,
    },
    units_lost: {
      type: DataTypes.JSONB,
      comment: 'Units lost in battle',
      get() {
        const rawValue = this.getDataValue('units_lost');
        return rawValue || {};
      },
    },
    units_survived: {
      type: DataTypes.JSONB,
      comment: 'Units that survived',
      get() {
        const rawValue = this.getDataValue('units_survived');
        return rawValue || {};
      },
    },
    rewards: {
      type: DataTypes.JSONB,
      comment: 'Rewards earned (if victory)',
      get() {
        const rawValue = this.getDataValue('rewards');
        return rawValue || {};
      },
    },
    battle_log: {
      type: DataTypes.JSONB,
      comment: 'Detailed battle log with rounds and events',
      get() {
        const rawValue = this.getDataValue('battle_log');
        return rawValue || [];
      },
    },
    tactic_used: {
      type: DataTypes.ENUM('balanced', 'aggressive', 'defensive'),
      defaultValue: 'balanced',
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'portal_boss_attempts',
    timestamps: false,
    indexes: [
      { fields: ['boss_id'] },
      { fields: ['user_id'] },
      { fields: ['result'] },
      { fields: ['created_at'] },
    ],
  });

  PortalBossAttempt.associate = (models) => {
    PortalBossAttempt.belongsTo(models.PortalBoss, {
      foreignKey: 'boss_id',
      as: 'boss',
    });

    PortalBossAttempt.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
    });
  };

  /**
   * Check if attempt was successful
   */
  PortalBossAttempt.prototype.isVictory = function() {
    return this.result === 'victory';
  };

  /**
   * Get survival rate
   */
  PortalBossAttempt.prototype.getSurvivalRate = function() {
    const totalSent = Object.values(this.units_sent).reduce((sum, count) => sum + count, 0);
    const totalLost = Object.values(this.units_lost).reduce((sum, count) => sum + count, 0);
    if (totalSent === 0) return 0;
    return Math.round(((totalSent - totalLost) / totalSent) * 100);
  };

  /**
   * Get attempt summary
   */
  PortalBossAttempt.prototype.getSummary = function() {
    return {
      attempt_id: this.attempt_id,
      result: this.result,
      damage_dealt: this.damage_dealt,
      phases_reached: this.phases_reached,
      survival_rate: this.getSurvivalRate(),
      abilities_triggered: this.abilities_triggered.length,
      rewards: this.rewards,
      created_at: this.created_at,
    };
  };

  return PortalBossAttempt;
};
