const { DataTypes } = require('sequelize');
const sequelize = require('../db');

/**
 * UnitUpkeep - Coûts d'entretien horaires par unité
 */
const UnitUpkeep = sequelize.define('UnitUpkeep', {
  unit_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: 'entities',
      key: 'entity_id'
    }
  },
  gold_per_hour: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Gold cost per unit per hour'
  },
  metal_per_hour: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Metal cost per unit per hour'
  },
  fuel_per_hour: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Fuel cost per unit per hour'
  }
}, {
  tableName: 'unit_upkeep',
  timestamps: true,
  underscored: true
});

// Associations
UnitUpkeep.associate = (models) => {
  UnitUpkeep.belongsTo(models.Entity, {
    foreignKey: 'unit_id',
    as: 'entity'
  });
};

module.exports = UnitUpkeep;
