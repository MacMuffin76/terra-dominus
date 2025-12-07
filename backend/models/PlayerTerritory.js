const { DataTypes } = require('sequelize');
const sequelize = require('../db');

/**
 * PlayerTerritory - Territoires revendiqués par les joueurs sur la carte Leaflet
 */
const PlayerTerritory = sequelize.define(
  'PlayerTerritory',
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
    radius: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5,
    },
    terrain_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    resource_bonus: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    defense_level: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    claimed_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'player_territories',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['user_id'],
        name: 'player_territories_user_id_idx',
      },
      {
        fields: ['latitude', 'longitude'],
        name: 'player_territories_coords_idx',
      },
    ],
  }
);

/**
 * Associations
 */
PlayerTerritory.associate = function(models) {
  PlayerTerritory.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user',
  });
};

module.exports = PlayerTerritory;
