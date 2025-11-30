const { DataTypes } = require('sequelize');

/**
 * PortalAllianceRaid - Co-op raids requiring alliance coordination
 * 
 * High-tier bosses that require multiple alliance members to defeat.
 * Rewards distributed based on contribution.
 */
module.exports = (sequelize) => {
  const PortalAllianceRaid = sequelize.define('PortalAllianceRaid', {
    raid_id: {
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
    alliance_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'alliances',
        key: 'alliance_id',
      },
    },
    min_participants: {
      type: DataTypes.INTEGER,
      defaultValue: 3,
      comment: 'Minimum members required to start raid',
    },
    max_participants: {
      type: DataTypes.INTEGER,
      defaultValue: 10,
      comment: 'Maximum members allowed in raid',
    },
    status: {
      type: DataTypes.ENUM('forming', 'in_progress', 'victory', 'defeat'),
      defaultValue: 'forming',
    },
    total_damage: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Total damage dealt by all participants',
    },
    rewards_pool: {
      type: DataTypes.JSONB,
      comment: 'Rewards to distribute based on contribution',
      get() {
        const rawValue = this.getDataValue('rewards_pool');
        return rawValue || {};
      },
    },
    started_at: {
      type: DataTypes.DATE,
      comment: 'When raid began',
    },
    completed_at: {
      type: DataTypes.DATE,
      comment: 'When raid finished',
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'portal_alliance_raids',
    timestamps: false,
    indexes: [
      { fields: ['boss_id'] },
      { fields: ['alliance_id'] },
      { fields: ['status'] },
    ],
  });

  PortalAllianceRaid.associate = (models) => {
    PortalAllianceRaid.belongsTo(models.PortalBoss, {
      foreignKey: 'boss_id',
      as: 'boss',
    });

    PortalAllianceRaid.belongsTo(models.Alliance, {
      foreignKey: 'alliance_id',
      as: 'alliance',
    });

    PortalAllianceRaid.hasMany(models.PortalRaidParticipant, {
      foreignKey: 'raid_id',
      as: 'participants',
    });
  };

  /**
   * Check if raid can start
   */
  PortalAllianceRaid.prototype.canStart = async function() {
    const participantCount = await this.countParticipants();
    return participantCount >= this.min_participants;
  };

  /**
   * Check if raid is full
   */
  PortalAllianceRaid.prototype.isFull = async function() {
    const participantCount = await this.countParticipants();
    return participantCount >= this.max_participants;
  };

  /**
   * Get current participant count
   */
  PortalAllianceRaid.prototype.countParticipants = async function() {
    const PortalRaidParticipant = sequelize.models.PortalRaidParticipant;
    return await PortalRaidParticipant.count({
      where: { raid_id: this.raid_id },
    });
  };

  /**
   * Get raid duration in seconds
   */
  PortalAllianceRaid.prototype.getDuration = function() {
    if (!this.started_at || !this.completed_at) return null;
    return Math.floor((new Date(this.completed_at) - new Date(this.started_at)) / 1000);
  };

  /**
   * Get raid summary
   */
  PortalAllianceRaid.prototype.getSummary = function() {
    return {
      raid_id: this.raid_id,
      status: this.status,
      participants: `${this.min_participants}-${this.max_participants}`,
      total_damage: this.total_damage,
      duration: this.getDuration(),
      rewards_pool: this.rewards_pool,
      started_at: this.started_at,
      completed_at: this.completed_at,
    };
  };

  return PortalAllianceRaid;
};
