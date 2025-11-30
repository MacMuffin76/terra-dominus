/**
 * PortalQuest Model
 * Master quest definitions with objectives and rewards
 */

module.exports = (sequelize) => {
  const { DataTypes } = require('sequelize');

  const PortalQuest = sequelize.define(
    'PortalQuest',
    {
      quest_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      quest_type: {
        type: DataTypes.ENUM('story', 'daily', 'weekly', 'achievement'),
        allowNull: false,
      },
      quest_category: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      title: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      
      // Story progression
      chapter: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      order_in_chapter: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      prerequisite_quest_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      
      // Objectives and rewards (JSONB)
      objectives: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      rewards: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      
      // Availability
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      required_level: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
      required_mastery_tier: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
    },
    {
      tableName: 'portal_quests',
      timestamps: true,
      underscored: true,
    }
  );

  // Instance methods
  PortalQuest.prototype.isStoryQuest = function () {
    return this.quest_type === 'story';
  };

  PortalQuest.prototype.isRepeatable = function () {
    return ['daily', 'weekly'].includes(this.quest_type);
  };

  PortalQuest.prototype.hasPrerequisite = function () {
    return this.prerequisite_quest_id !== null;
  };

  PortalQuest.prototype.getObjectiveCount = function () {
    return Array.isArray(this.objectives) ? this.objectives.length : 0;
  };

  PortalQuest.prototype.getTotalRewardGold = function () {
    return this.rewards?.gold || 0;
  };

  PortalQuest.prototype.getSummary = function () {
    return {
      quest_id: this.quest_id,
      quest_type: this.quest_type,
      quest_category: this.quest_category,
      title: this.title,
      description: this.description,
      chapter: this.chapter,
      order_in_chapter: this.order_in_chapter,
      objectives: this.objectives,
      rewards: this.rewards,
      is_active: this.is_active,
      required_level: this.required_level,
      required_mastery_tier: this.required_mastery_tier,
      prerequisite_quest_id: this.prerequisite_quest_id,
      objective_count: this.getObjectiveCount(),
      total_gold: this.getTotalRewardGold(),
    };
  };

  // Associations
  PortalQuest.associate = (models) => {
    // Self-referential for prerequisite
    PortalQuest.belongsTo(models.PortalQuest, {
      foreignKey: 'prerequisite_quest_id',
      as: 'prerequisiteQuest',
    });

    // User progress
    PortalQuest.hasMany(models.UserQuest, {
      foreignKey: 'quest_id',
      as: 'userQuests',
    });

    // Unlocks granted
    PortalQuest.hasMany(models.UserQuestUnlock, {
      foreignKey: 'unlocked_by_quest_id',
      as: 'unlocks',
    });
  };

  return PortalQuest;
};
