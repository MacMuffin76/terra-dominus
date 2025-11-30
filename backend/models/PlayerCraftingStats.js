const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class PlayerCraftingStats extends Model {
    static associate(models) {
      // Belongs to user (one-to-one)
      PlayerCraftingStats.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
    }

    // Calculate level from XP
    static calculateLevel(xp) {
      // XP curve: Level N requires (N * 1000) XP
      // Level 1: 0-1000 XP
      // Level 2: 1000-2000 XP (total 3000)
      // Level 3: 2000-3000 XP (total 6000)
      // etc.
      let level = 1;
      let xpRequired = 0;
      
      while (xp >= xpRequired + (level * 1000)) {
        xpRequired += level * 1000;
        level++;
      }
      
      return {
        level,
        currentXp: xp - xpRequired,
        nextLevelXp: level * 1000
      };
    }

    // Add XP and level up if threshold reached
    async addXP(amount, transaction) {
      this.crafting_xp += amount;
      
      const levelInfo = PlayerCraftingStats.calculateLevel(this.crafting_xp);
      const oldLevel = this.crafting_level;
      this.crafting_level = levelInfo.level;
      
      await this.save({ transaction });
      
      return {
        xpAdded: amount,
        totalXp: this.crafting_xp,
        level: this.crafting_level,
        leveledUp: this.crafting_level > oldLevel,
        levelsGained: this.crafting_level - oldLevel
      };
    }

    // Get level bonuses
    getLevelBonuses() {
      const bonuses = {
        durationReduction: 0,
        costReduction: 0,
        masscraft: false,
        extraSlot: false,
        doubleOutputChance: 0,
        instantCraftDaily: false
      };

      if (this.crafting_level >= 5) bonuses.durationReduction = 0.05; // -5%
      if (this.crafting_level >= 10) bonuses.costReduction = 0.10; // -10%
      if (this.crafting_level >= 15) bonuses.masscraft = true;
      if (this.crafting_level >= 20) bonuses.extraSlot = true; // +1 slot
      if (this.crafting_level >= 25) bonuses.doubleOutputChance = 0.05; // 5% chance
      if (this.crafting_level >= 30) bonuses.instantCraftDaily = true;

      return bonuses;
    }

    // Track resource consumption
    async addResourceConsumption(resourcesConsumed, transaction) {
      const t1Consumed = this.resources_t1_consumed || {};
      const t2Consumed = this.resources_t2_consumed || {};

      // Add T1 resources
      if (resourcesConsumed.resources_t1) {
        for (const [resource, amount] of Object.entries(resourcesConsumed.resources_t1)) {
          t1Consumed[resource] = (t1Consumed[resource] || 0) + amount;
        }
      }

      // Add T2 resources
      if (resourcesConsumed.resources_t2) {
        for (const [resource, amount] of Object.entries(resourcesConsumed.resources_t2)) {
          t2Consumed[resource] = (t2Consumed[resource] || 0) + amount;
        }
      }

      this.resources_t1_consumed = t1Consumed;
      this.resources_t2_consumed = t2Consumed;
      
      await this.save({ transaction });
    }

    // Mark achievement timestamps
    async markAchievement(achievementType, transaction) {
      const field = `first_${achievementType}_craft_at`;
      if (!this[field]) {
        this[field] = new Date();
        await this.save({ transaction });
        return true; // First time achievement
      }
      return false;
    }

    // Get next level info
    getNextLevelInfo() {
      const levelInfo = PlayerCraftingStats.calculateLevel(this.crafting_xp);
      return {
        currentLevel: levelInfo.level,
        currentXp: levelInfo.currentXp,
        xpToNextLevel: levelInfo.nextLevelXp,
        progressPercentage: Math.floor((levelInfo.currentXp / levelInfo.nextLevelXp) * 100)
      };
    }
  }

  PlayerCraftingStats.init(
    {
      user_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      
      // XP & Level
      crafting_xp: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
          min: 0
        }
      },
      crafting_level: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        validate: {
          min: 1,
          max: 30
        }
      },
      
      // Statistics
      total_crafts_completed: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
          min: 0
        }
      },
      total_crafts_cancelled: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
          min: 0
        }
      },
      
      // Resources consumed lifetime
      resources_t1_consumed: {
        type: DataTypes.JSONB,
        defaultValue: {},
        get() {
          const value = this.getDataValue('resources_t1_consumed');
          return value || {};
        }
      },
      resources_t2_consumed: {
        type: DataTypes.JSONB,
        defaultValue: {},
        get() {
          const value = this.getDataValue('resources_t2_consumed');
          return value || {};
        }
      },
      
      // Achievements timestamps
      first_craft_at: {
        type: DataTypes.DATE
      },
      first_rare_craft_at: {
        type: DataTypes.DATE
      },
      first_epic_craft_at: {
        type: DataTypes.DATE
      },
      first_legendary_craft_at: {
        type: DataTypes.DATE
      }
    },
    {
      sequelize,
      modelName: 'PlayerCraftingStats',
      tableName: 'player_crafting_stats',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  );

  return PlayerCraftingStats;
};
