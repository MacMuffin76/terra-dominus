const { DataTypes } = require('sequelize');
const sequelize = require('../db');

/**
 * WorldGrid - Représente une case de la grille du monde
 * Chaque case a des coordonnées uniques et un type de terrain
 */
const WorldGrid = sequelize.define(
  'WorldGrid',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    coord_x: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    coord_y: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    terrain_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'plains',
      validate: {
        isIn: [['plains', 'forest', 'mountain', 'desert', 'water', 'hills']],
      },
    },
    has_city_slot: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'world_grid',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['coord_x', 'coord_y'],
        name: 'world_grid_coords_unique',
      },
      {
        fields: ['has_city_slot'],
        name: 'world_grid_city_slot_idx',
      },
    ],
  }
);

/**
 * Associations
 */
WorldGrid.associate = function(models) {
  // WorldGrid peut avoir un CitySlot
  WorldGrid.hasOne(models.CitySlot, {
    foreignKey: 'grid_id',
    as: 'citySlot'
  });
};

module.exports = WorldGrid;
