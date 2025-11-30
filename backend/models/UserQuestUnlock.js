/**
 * UserQuestUnlock Model
 * Tracks content unlocked via quest completion (portal tiers, features, blueprints, titles)
 */

module.exports = (sequelize) => {
  const { DataTypes } = require('sequelize');

  const UserQuestUnlock = sequelize.define(
    'UserQuestUnlock',
    {
      unlock_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      
      unlock_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: 'portal_tier, feature, blueprint, title, cosmetic',
      },
      unlock_key: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'Specific key (e.g., "portal_tier_green", "title_s_rank")',
      },
      
      unlocked_by_quest_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      unlocked_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'user_quest_unlocks',
      timestamps: false,
      indexes: [
        { fields: ['user_id'] },
        { fields: ['unlock_type'] },
        { fields: ['user_id', 'unlock_type', 'unlock_key'], unique: true },
      ],
    }
  );

  // Instance methods
  UserQuestUnlock.prototype.isPortalTierUnlock = function () {
    return this.unlock_type === 'portal_tier';
  };

  UserQuestUnlock.prototype.isFeatureUnlock = function () {
    return this.unlock_type === 'feature';
  };

  UserQuestUnlock.prototype.isBlueprintUnlock = function () {
    return this.unlock_type === 'blueprint';
  };

  UserQuestUnlock.prototype.isTitleUnlock = function () {
    return this.unlock_type === 'title';
  };

  UserQuestUnlock.prototype.getUnlockDetails = function () {
    return {
      unlock_id: this.unlock_id,
      user_id: this.user_id,
      unlock_type: this.unlock_type,
      unlock_key: this.unlock_key,
      unlocked_by_quest_id: this.unlocked_by_quest_id,
      unlocked_at: this.unlocked_at,
    };
  };

  // Associations
  UserQuestUnlock.associate = (models) => {
    UserQuestUnlock.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
    });

    UserQuestUnlock.belongsTo(models.PortalQuest, {
      foreignKey: 'unlocked_by_quest_id',
      as: 'quest',
    });
  };

  return UserQuestUnlock;
};
