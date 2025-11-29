const { DataTypes } = require('sequelize');
const sequelize = require('../db');

/**
 * ExploredTile - Représente une case explorée par un joueur (Fog of War)
 * Chaque joueur a sa propre liste de cases explorées
 */
const ExploredTile = sequelize.define(
  'ExploredTile',
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
    grid_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'world_grid',
        key: 'id',
      },
    },
    explored_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'explored_tiles',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'grid_id'],
        name: 'explored_tiles_user_grid_unique',
      },
    ],
  }
);

module.exports = ExploredTile;
