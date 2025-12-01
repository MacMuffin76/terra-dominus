/**
 * UserQuest Model
 * Tracks individual player quest progress and completion
 */

module.exports = (sequelize) => {
  const { DataTypes } = require('sequelize');

  const UserQuest = sequelize.define(
    'UserQuest',
    {
      id: {
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
        type: DataTypes.ENUM('available', 'in_progress', 'completed', 'claimed'),
        allowNull: false,
        defaultValue: 'available',
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
      
      claimed_at: {
        type: DataTypes.DATE,
        allowNull: true,
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
    return this.status === 'completed' && !this.claimed_at;
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
    this.status = 'claimed';
    this.claimed_at = new Date();
  };

  UserQuest.prototype.getSummary = function () {
    return {
      id: this.id,
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
      claimed_at: this.claimed_at,
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
