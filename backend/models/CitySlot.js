const { DataTypes } = require('sequelize');
const sequelize = require('../db');

/**
 * CitySlot - Représente un emplacement où une ville peut être construite
 * Lie une case de la grille (WorldGrid) à une ville éventuellement construite
 */
const CitySlot = sequelize.define(
  'CitySlot',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    grid_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'world_grid',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'free',
      validate: {
        isIn: [['free', 'occupied', 'ruins', 'reserved']],
      },
    },
    city_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'cities',
        key: 'id',
      },
    },
    quality: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
        max: 5,
      },
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
    tableName: 'city_slots',
    timestamps: false,
    indexes: [
      {
        fields: ['status'],
        name: 'city_slots_status_idx',
      },
      {
        unique: true,
        fields: ['city_id'],
        name: 'city_slots_city_id_unique',
      },
    ],
  }
);

/**
 * Associations
 */
CitySlot.associate = function(models) {
  // CitySlot appartient à WorldGrid
  CitySlot.belongsTo(models.WorldGrid, {
    foreignKey: 'grid_id',
    as: 'grid'
  });

  // CitySlot peut avoir une City
  CitySlot.belongsTo(models.City, {
    foreignKey: 'city_id',
    as: 'city'
  });
};

module.exports = CitySlot;
