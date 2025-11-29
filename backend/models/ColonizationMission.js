const { DataTypes } = require('sequelize');
const sequelize = require('../db');

/**
 * ColonizationMission - Représente une mission de colonisation en cours
 * Le joueur envoie des colons depuis une ville vers un emplacement libre
 */
const ColonizationMission = sequelize.define(
  'ColonizationMission',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    departure_city_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'cities',
        key: 'id',
      },
    },
    target_slot_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'city_slots',
        key: 'id',
      },
    },
    colonist_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
      },
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'traveling',
      validate: {
        isIn: [['traveling', 'arrived', 'completed', 'failed', 'cancelled']],
      },
    },
    departure_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    arrival_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'colonization_missions',
    timestamps: false,
    indexes: [
      {
        fields: ['user_id', 'status'],
        name: 'colonization_missions_user_status_idx',
      },
      {
        fields: ['arrival_at', 'status'],
        name: 'colonization_missions_arrival_idx',
      },
    ],
  }
);

ColonizationMission.associate = function(models) {
  ColonizationMission.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user'
  });
  ColonizationMission.belongsTo(models.City, {
    foreignKey: 'departure_city_id',
    as: 'departureCity'
  });
  ColonizationMission.belongsTo(models.CitySlot, {
    foreignKey: 'target_slot_id',
    as: 'targetSlot'
  });
};

module.exports = ColonizationMission;
