const { Model, DataTypes } = require('sequelize');
const sequelize = require('../db');

class ResourceProduction extends Model {}

ResourceProduction.init({
  production_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  building_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  level: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  production_rate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Production par heure pour ce niveau de bâtiment'
  },
  last_updated: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'ResourceProduction',
  tableName: 'resource_production',
  timestamps: false
});

ResourceProduction.associate = (models) => {
  ResourceProduction.belongsTo(models.Entity, {
    foreignKey: 'building_id',
    as: 'building'
  });
};

module.exports = ResourceProduction;
