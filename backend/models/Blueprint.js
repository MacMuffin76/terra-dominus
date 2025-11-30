const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Blueprint extends Model {
    static associate(models) {
      // A blueprint can be discovered by many users
      Blueprint.hasMany(models.PlayerBlueprint, {
        foreignKey: 'blueprint_id',
        as: 'playerDiscoveries'
      });

      // A blueprint can be used in many crafting queue items
      Blueprint.hasMany(models.CraftingQueue, {
        foreignKey: 'blueprint_id',
        as: 'craftingJobs'
      });
    }

    // Helper method to check if blueprint is craftable by user
    canCraftWith(userResources, userBuildings, userResearch) {
      // Check crafting station level
      const craftingStation = userBuildings.find(b => b.type === 'crafting_station');
      if (!craftingStation || craftingStation.level < this.crafting_station_level_min) {
        return { valid: false, reason: 'Crafting Station level too low' };
      }

      // Check unlock requirements (research, buildings)
      const requirements = this.unlock_requirements || {};
      
      if (requirements.research) {
        const hasResearch = userResearch.some(r => r.tech_id === requirements.research && r.completed);
        if (!hasResearch) {
          return { valid: false, reason: `Research ${requirements.research} required` };
        }
      }

      if (requirements.building) {
        const requiredBuilding = userBuildings.find(
          b => b.type === requirements.building.type && b.level >= requirements.building.level
        );
        if (!requiredBuilding) {
          return { 
            valid: false, 
            reason: `Building ${requirements.building.type} level ${requirements.building.level} required` 
          };
        }
      }

      // Check resources availability
      const inputs = this.inputs || {};
      
      if (inputs.resources_t1) {
        for (const [resource, amount] of Object.entries(inputs.resources_t1)) {
          if (!userResources[resource] || userResources[resource] < amount) {
            return { valid: false, reason: `Insufficient ${resource}` };
          }
        }
      }

      if (inputs.resources_t2) {
        for (const [resource, amount] of Object.entries(inputs.resources_t2)) {
          if (!userResources[resource] || userResources[resource] < amount) {
            return { valid: false, reason: `Insufficient T2 ${resource}` };
          }
        }
      }

      return { valid: true };
    }

    // Calculate speedup cost in premium currency
    calculateSpeedupCost(timeRemainingSeconds) {
      const costPerMinute = 1; // 1 CT per minute
      const minutes = Math.ceil(timeRemainingSeconds / 60);
      const cost = Math.max(20, minutes * costPerMinute); // Min 20 CT
      return Math.min(cost, 500); // Max 500 CT (cap for whales)
    }

    // Get display name with rarity color
    getDisplayName() {
      const rarityColors = {
        common: '#9E9E9E',
        rare: '#2196F3',
        epic: '#9C27B0',
        legendary: '#FF9800',
        mythic: '#E91E63'
      };
      return {
        name: this.name,
        rarity: this.rarity,
        color: rarityColors[this.rarity] || '#FFFFFF'
      };
    }
  }

  Blueprint.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      
      // Identity
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
          len: [3, 100]
        }
      },
      category: {
        type: DataTypes.STRING(30),
        allowNull: false,
        validate: {
          isIn: [['unit', 'building', 'consumable', 'cosmetic', 'alliance_building', 'equipment']]
        }
      },
      rarity: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
          isIn: [['common', 'rare', 'epic', 'legendary', 'mythic']]
        }
      },
      
      // Requirements
      crafting_station_level_min: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        validate: {
          min: 1,
          max: 20
        }
      },
      unlock_requirements: {
        type: DataTypes.JSONB,
        defaultValue: {},
        get() {
          const value = this.getDataValue('unlock_requirements');
          return value || {};
        }
      },
      
      // Recipe
      inputs: {
        type: DataTypes.JSONB,
        allowNull: false,
        validate: {
          notEmpty: true
        },
        get() {
          const value = this.getDataValue('inputs');
          return value || {};
        }
      },
      outputs: {
        type: DataTypes.JSONB,
        allowNull: false,
        validate: {
          notEmpty: true
        },
        get() {
          const value = this.getDataValue('outputs');
          return value || {};
        }
      },
      duration_seconds: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 60, // Min 1 minute
          max: 2592000 // Max 30 days
        }
      },
      
      // Rewards
      experience_reward: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
          min: 0
        }
      },
      
      // Metadata
      description: {
        type: DataTypes.TEXT
      },
      icon_url: {
        type: DataTypes.STRING(255),
        validate: {
          isUrl: true
        }
      },
      
      // Flags
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      is_tradeable: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      is_alliance_craft: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    },
    {
      sequelize,
      modelName: 'Blueprint',
      tableName: 'blueprints',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { fields: ['category'] },
        { fields: ['rarity'] },
        { fields: ['is_active'] }
      ]
    }
  );

  return Blueprint;
};
