const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Entity = sequelize.define('Entity', {
  entity_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  entity_type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  entity_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: 'entities',
  timestamps: false,
});

// Associations
Entity.associate = (models) => {
  // Unit system associations
  Entity.hasOne(models.UnitStats, {
    foreignKey: 'unit_id',
    as: 'unitStats'
  });
  Entity.hasOne(models.UnitUpkeep, {
    foreignKey: 'unit_id',
    as: 'unitUpkeep'
  });
};

module.exports = Entity;
