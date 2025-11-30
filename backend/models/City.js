// backend/models/City.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const City = sequelize.define('City', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  is_capital: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  coord_x: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  coord_y: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  vision_range: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 5,
  },
  founded_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  specialization: {
    type: DataTypes.ENUM('none', 'military', 'economic', 'industrial', 'research'),
    allowNull: false,
    defaultValue: 'none',
  },
  specialized_at: {
    type: DataTypes.DATE,
    allowNull: true,
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
}, {
  tableName: 'cities',
  timestamps: false,
});

// Define associations
City.associate = function(models) {
  // City belongs to User
  City.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'owner',
  });

  // City has many Units
  City.hasMany(models.Unit, {
    foreignKey: 'city_id',
    as: 'units',
  });

  // City has many Buildings
  City.hasMany(models.Building, {
    foreignKey: 'city_id',
    as: 'buildings',
  });

  // City has many Resources
  City.hasMany(models.Resource, {
    foreignKey: 'city_id',
    as: 'resources',
  });
};

module.exports = City;
