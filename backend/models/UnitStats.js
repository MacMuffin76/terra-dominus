const { DataTypes } = require('sequelize');
const sequelize = require('../db');

/**
 * UnitStats - Statistiques étendues et système de counters
 */
const UnitStats = sequelize.define('UnitStats', {
  unit_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: 'entities',
      key: 'entity_id'
    }
  },
  unit_key: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: 'Unique key for unit type (e.g., "cavalry", "tanks")'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  tier: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Unit tier (1-4)'
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Unit category (infantry, cavalry, ranged, etc.)'
  },
  attack: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  defense: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  health: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 10
  },
  initiative: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 10,
    comment: 'Turn order in combat'
  },
  speed: {
    type: DataTypes.DECIMAL(3, 1),
    allowNull: false,
    defaultValue: 1.0,
    comment: 'Movement speed multiplier'
  },
  carry_capacity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Loot capacity per unit'
  },
  train_time_seconds: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 60
  },
  counters: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    comment: 'Array of unit keys this unit is strong against'
  },
  weak_to: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    comment: 'Array of unit keys this unit is weak against'
  }
}, {
  tableName: 'unit_stats',
  timestamps: true,
  underscored: true
});

// Associations
UnitStats.associate = (models) => {
  UnitStats.belongsTo(models.Entity, {
    foreignKey: 'unit_id',
    as: 'entity'
  });
};

module.exports = UnitStats;
