const { DataTypes } = require('sequelize');
const sequelize = require('../db');

/**
 * MapExploration - Zones explorées par les joueurs (fog of war)
 */
const MapExploration = sequelize.define(
  'MapExploration',
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
    latitude: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    longitude: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    explored_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'map_exploration',
    timestamps: false,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'latitude', 'longitude'],
        name: 'map_exploration_user_coords_unique',
      },
      {
        fields: ['user_id'],
        name: 'map_exploration_user_id_idx',
      },
    ],
  }
);

/**
 * Associations
 */
MapExploration.associate = function(models) {
  MapExploration.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user',
  });
};

module.exports = MapExploration;
