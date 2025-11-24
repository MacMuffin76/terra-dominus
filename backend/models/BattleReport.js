const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const BattleReport = sequelize.define('BattleReport', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  attackerUserId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'attacker_user_id',
  },
  defenderUserId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'defender_user_id',
  },
  attackerCityId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'attacker_city_id',
  },
  defenderCityId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'defender_city_id',
  },
  payload: {
    type: DataTypes.JSON,
    allowNull: false,
  },
}, {
  tableName: 'battle_reports',
  underscored: true,
});

module.exports = BattleReport;