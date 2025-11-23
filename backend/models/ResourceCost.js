const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const Entity = require('./Entity');

const ResourceCost = sequelize.define('ResourceCost', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  entity_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Entity,
      key: 'entity_id',
    },
  },
  resource_type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  amount: {
    // IMPORTANT : NUMBER n'existe pas, on utilise DECIMAL pour être proche du NUMERIC Postgres
    type: DataTypes.DECIMAL,
    allowNull: false,
  },
  level: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'resource_costs',
  timestamps: false,
});

ResourceCost.belongsTo(Entity, { foreignKey: 'entity_id' });

module.exports = ResourceCost;
