const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class CraftingQueue extends Model {
    static associate(models) {
      // Belongs to user
      CraftingQueue.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });

      // Belongs to blueprint
      CraftingQueue.belongsTo(models.BlueprintCrafting, {
        foreignKey: 'blueprint_id',
        as: 'blueprint'
      });
    }

    // Calculate time remaining until completion
    getTimeRemaining() {
      if (this.status !== 'in_progress') {
        return 0;
      }
      const now = new Date();
      const completedAt = new Date(this.completed_at);
      const remaining = Math.max(0, Math.floor((completedAt - now) / 1000));
      return remaining;
    }

    // Check if craft is ready to complete
    isReady() {
      return this.status === 'in_progress' && new Date() >= new Date(this.completed_at);
    }

    // Calculate speedup cost
    getSpeedupCost() {
      const timeRemaining = this.getTimeRemaining();
      if (timeRemaining === 0) {
        return 0;
      }
      const costPerMinute = 1; // 1 CT per minute
      const minutes = Math.ceil(timeRemaining / 60);
      const cost = Math.max(20, minutes * costPerMinute);
      return Math.min(cost, 500); // Cap at 500 CT
    }

    // Calculate refund amount (50% of inputs)
    getRefundAmount() {
      const consumed = this.resources_consumed || {};
      const refund = {};

      if (consumed.resources_t1) {
        refund.resources_t1 = {};
        for (const [resource, amount] of Object.entries(consumed.resources_t1)) {
          refund.resources_t1[resource] = Math.floor(amount * 0.5);
        }
      }

      if (consumed.resources_t2) {
        refund.resources_t2 = {};
        for (const [resource, amount] of Object.entries(consumed.resources_t2)) {
          refund.resources_t2[resource] = Math.floor(amount * 0.5);
        }
      }

      // Premium currency is NOT refunded
      return refund;
    }

    // Get progress percentage
    getProgressPercentage() {
      if (this.status === 'completed' || this.status === 'collected') {
        return 100;
      }
      if (this.status === 'cancelled') {
        return 0;
      }

      const now = new Date();
      const startedAt = new Date(this.started_at);
      const completedAt = new Date(this.completed_at);
      
      const totalDuration = completedAt - startedAt;
      const elapsed = now - startedAt;
      
      return Math.min(100, Math.max(0, Math.floor((elapsed / totalDuration) * 100)));
    }
  }

  CraftingQueue.init(
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
      
      // Craft Details
      quantity_target: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        validate: {
          min: 1,
          max: 100
        }
      },
      resources_consumed: {
        type: DataTypes.JSONB,
        allowNull: false,
        get() {
          const value = this.getDataValue('resources_consumed');
          return value || {};
        }
      },
      
      // Timing
      started_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      completed_at: {
        type: DataTypes.DATE,
        allowNull: false
      },
      collected_at: {
        type: DataTypes.DATE
      },
      
      // Status
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'in_progress',
        validate: {
          isIn: [['in_progress', 'completed', 'cancelled', 'collected']]
        }
      },
      
      // Output
      output_items: {
        type: DataTypes.JSONB,
        get() {
          const value = this.getDataValue('output_items');
          return value || {};
        }
      }
    },
    {
      sequelize,
      modelName: 'CraftingQueue',
      tableName: 'crafting_queue',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { fields: ['user_id'] },
        { fields: ['status'] },
        { 
          fields: ['completed_at'],
          where: { status: 'in_progress' }
        }
      ]
    }
  );

  return CraftingQueue;
};
