/**
 * UserQuest Model
 * Tracks individual player quest progress and completion
 */

module.exports = (sequelize) => {
  const { DataTypes } = require('sequelize');

  const UserQuest = sequelize.define(
    'UserQuest',
    {
      user_quest_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      quest_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      
      status: {
        type: DataTypes.ENUM('active', 'completed', 'failed', 'abandoned'),
        allowNull: false,
        defaultValue: 'active',
      },
      
      // Progress tracking (JSONB array)
      progress: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      
      started_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      completed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      
      rewards_claimed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      tableName: 'user_quests',
      timestamps: false,
      indexes: [
        { fields: ['user_id'] },
        { fields: ['quest_id'] },
        { fields: ['status'] },
        { fields: ['expires_at'] },
        { fields: ['user_id', 'quest_id'], unique: true },
      ],
    }
  );

  // Instance methods
  UserQuest.prototype.isActive = function () {
    return this.status === 'active';
  };

  UserQuest.prototype.isCompleted = function () {
    return this.status === 'completed';
  };

  UserQuest.prototype.isExpired = function () {
    if (!this.expires_at) return false;
    return new Date() > new Date(this.expires_at);
  };

  UserQuest.prototype.canClaimRewards = function () {
    return this.status === 'completed' && !this.rewards_claimed;
  };

  UserQuest.prototype.getProgressPercent = function () {
    if (!Array.isArray(this.progress) || this.progress.length === 0) {
      return 0;
    }

    const totalObjectives = this.progress.length;
    const completedObjectives = this.progress.filter(
      (p) => p.current >= p.target
    ).length;

    return Math.round((completedObjectives / totalObjectives) * 100);
  };

  UserQuest.prototype.getAllObjectivesComplete = function () {
    if (!Array.isArray(this.progress) || this.progress.length === 0) {
      return false;
    }

    return this.progress.every((p) => p.current >= p.target);
  };

  UserQuest.prototype.updateProgress = function (objectiveIndex, increment = 1) {
    if (!Array.isArray(this.progress) || objectiveIndex >= this.progress.length) {
      return false;
    }

    const objective = this.progress[objectiveIndex];
    objective.current = Math.min(objective.current + increment, objective.target);
    
    // Mark as modified for Sequelize
    this.changed('progress', true);
    
    return true;
  };

  UserQuest.prototype.markCompleted = function () {
    this.status = 'completed';
    this.completed_at = new Date();
  };

  UserQuest.prototype.claimRewards = function () {
    if (!this.canClaimRewards()) {
      throw new Error('Cannot claim rewards - quest not completed or already claimed');
    }
    this.rewards_claimed = true;
  };

  UserQuest.prototype.getSummary = function () {
    return {
      user_quest_id: this.user_quest_id,
      user_id: this.user_id,
      quest_id: this.quest_id,
      status: this.status,
      progress: this.progress,
      progress_percent: this.getProgressPercent(),
      all_complete: this.getAllObjectivesComplete(),
      started_at: this.started_at,
      completed_at: this.completed_at,
      expires_at: this.expires_at,
      is_expired: this.isExpired(),
      rewards_claimed: this.rewards_claimed,
      can_claim: this.canClaimRewards(),
    };
  };

  // Associations
  UserQuest.associate = (models) => {
    UserQuest.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
    });

    UserQuest.belongsTo(models.PortalQuest, {
      foreignKey: 'quest_id',
      as: 'quest',
    });
  };

  return UserQuest;
};
