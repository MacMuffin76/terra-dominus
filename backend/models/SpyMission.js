const { Model, DataTypes } = require('sequelize');

class SpyMission extends Model {
  static init(sequelize) {
    super.init({
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      spy_user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      spy_city_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      target_user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      target_city_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      spy_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1
        }
      },
      mission_type: {
        type: DataTypes.ENUM('reconnaissance', 'military_intel', 'sabotage'),
        allowNull: false,
        defaultValue: 'reconnaissance'
      },
      status: {
        type: DataTypes.ENUM('traveling', 'completed', 'failed', 'detected', 'cancelled'),
        allowNull: false,
        defaultValue: 'traveling'
      },
      departure_time: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      arrival_time: {
        type: DataTypes.DATE,
        allowNull: false
      },
      distance: {
        type: DataTypes.FLOAT,
        allowNull: false
      },
      success_rate: {
        type: DataTypes.FLOAT,
        allowNull: true
      },
      intel_data: {
        type: DataTypes.JSONB,
        allowNull: true
      },
      spies_lost: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      detected: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }
    }, {
      sequelize,
      modelName: 'SpyMission',
      tableName: 'spy_missions',
      underscored: true,
      timestamps: true,
      indexes: [
        { fields: ['spy_user_id', 'status'] },
        { fields: ['target_user_id', 'detected'] },
        { fields: ['arrival_time'] },
        { fields: ['status'] }
      ]
    });

    return SpyMission;
  }

  static associate(models) {
    SpyMission.belongsTo(models.User, {
      foreignKey: 'spy_user_id',
      as: 'spy'
    });
    SpyMission.belongsTo(models.User, {
      foreignKey: 'target_user_id',
      as: 'target'
    });
    SpyMission.belongsTo(models.City, {
      foreignKey: 'spy_city_id',
      as: 'spyCity'
    });
    SpyMission.belongsTo(models.City, {
      foreignKey: 'target_city_id',
      as: 'targetCity'
    });
  }
}

module.exports = SpyMission;
