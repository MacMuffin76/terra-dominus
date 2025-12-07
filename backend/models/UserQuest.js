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
      
      // Progress tracking (integer for legacy quest system)
      progress: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      
      started_at: {
        type: DataTypes.DATE,
        allowNull: true,
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
      timestamps: true,
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
    // Handle both legacy INTEGER and new JSONB array format
    if (Array.isArray(this.progress) && this.progress.length > 0) {
      // Calculate average progress for all objectives
      const totalProgress = this.progress.reduce((sum, obj) => {
        const percent = (obj.current / obj.target) * 100;
        return sum + Math.min(percent, 100);
      }, 0);
      return Math.round(totalProgress / this.progress.length);
    }
    
    // Legacy format fallback
    if (!this.quest || !this.quest.objective_target) {
      return 0;
    }
    return Math.round((this.progress / this.quest.objective_target) * 100);
  };

  UserQuest.prototype.getAllObjectivesComplete = function () {
    // Handle JSONB array format
    if (Array.isArray(this.progress) && this.progress.length > 0) {
      return this.progress.every(obj => obj.current >= obj.target);
    }
    
    // Legacy format fallback
    if (!this.quest || !this.quest.objective_target) {
      return false;
    }
    return this.progress >= this.quest.objective_target;
  };

  UserQuest.prototype.updateProgress = function (increment = 1) {
    // This method is deprecated for JSONB format
    // Use QuestService.updateQuestProgress instead
    
    // Legacy format fallback
    if (!this.quest || !this.quest.objective_target) {
      return false;
    }
    
    this.progress = Math.min(this.progress + increment, this.quest.objective_target);
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

    // Associate with legacy Quest model
    UserQuest.belongsTo(models.Quest, {
      foreignKey: 'quest_id',
      as: 'quest',
    });
  };

  return UserQuest;
};
