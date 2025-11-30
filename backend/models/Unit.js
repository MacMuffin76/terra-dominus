// backend/models/Unit.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Unit = sequelize.define('Unit', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  city_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [1, 255],
    },
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  force: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  capacite_speciale: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      len: [0, 255],
    },
  },
}, {
  tableName: 'units',
  timestamps: false,
});

// Define associations
Unit.associate = function(models) {
  // Unit belongs to City
  Unit.belongsTo(models.City, {
    foreignKey: 'city_id',
    as: 'city',
  });

  // Unit belongs to Entity (for extended stats)
  Unit.belongsTo(models.Entity, {
    foreignKey: 'name',
    targetKey: 'entity_name',
    as: 'entity',
  });
};

module.exports = Unit;
