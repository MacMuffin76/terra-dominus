const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class PlayerBlueprint extends Model {
    static associate(models) {
      // Belongs to user
      PlayerBlueprint.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });

      // Belongs to blueprint
      PlayerBlueprint.belongsTo(models.BlueprintCrafting, {
        foreignKey: 'blueprint_id',
        as: 'blueprint'
      });
    }

    // Helper method to increment craft count
    async incrementCraftCount(transaction) {
      this.times_crafted += 1;
      await this.save({ transaction });
      return this.times_crafted;
    }

    // Check if this is first craft of this rarity
    isFirstCraftOfRarity(rarity) {
      return this.times_crafted === 0 && this.blueprint?.rarity === rarity;
    }
  }

  PlayerBlueprint.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      
      // Relations
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      blueprint_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'blueprints',
          key: 'id'
        }
      },
      
      // Discovery
      discovered_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      discovery_source: {
        type: DataTypes.STRING(50),
        validate: {
          isIn: [[
            'portal_grey', 'portal_green', 'portal_blue', 'portal_purple', 'portal_red', 'portal_gold',
            'research', 'quest_reward', 'market_purchase', 'event', 'achievement', 'admin_grant', 'battle_pass'
          ]]
        }
      },
      
      // Stats
      times_crafted: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
          min: 0
        }
      }
    },
    {
      sequelize,
      modelName: 'PlayerBlueprint',
      tableName: 'player_blueprints',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { 
          unique: true,
          fields: ['user_id', 'blueprint_id'],
          name: 'unique_user_blueprint'
        },
        { fields: ['user_id'] },
        { fields: ['blueprint_id'] }
      ]
    }
  );

  return PlayerBlueprint;
};
