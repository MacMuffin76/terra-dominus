const { Model, DataTypes } = require('sequelize');
const sequelize = require('../db');

class ResourceProduction extends Model {}

ResourceProduction.init({
  production_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  entity_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  production_rate: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  last_updated: {
    type: DataTypes.DATE,
    allowNull: false
  },
  level: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'ResourceProduction',
  tableName: 'resource_production',
  timestamps: false
});

module.exports = ResourceProduction;
