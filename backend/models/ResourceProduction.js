const { Model, DataTypes } = require('sequelize');
const sequelize = require('../db');

class ResourceProduction extends Model {}

ResourceProduction.init({
  production_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  building_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  resource_type_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  amount: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  production_rate: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  last_updated: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  level: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  building_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  sequelize,
  modelName: 'ResourceProduction',
});

module.exports = ResourceProduction;
