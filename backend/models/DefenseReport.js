const { Model, DataTypes } = require('sequelize');

class DefenseReport extends Model {
  static init(sequelize) {
    super.init({
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      attack_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true
      },
      combat_rounds: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      combat_log: {
        type: DataTypes.JSONB,
        allowNull: true
      },
      initial_attacker_strength: {
        type: DataTypes.FLOAT,
        allowNull: false
      },
      initial_defender_strength: {
        type: DataTypes.FLOAT,
        allowNull: false
      },
      final_attacker_strength: {
        type: DataTypes.FLOAT,
        allowNull: false
      },
      final_defender_strength: {
        type: DataTypes.FLOAT,
        allowNull: false
      },
      defender_walls_bonus: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
      },
      attacker_tech_bonus: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
      },
      defender_tech_bonus: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
      }
    }, {
      sequelize,
      modelName: 'DefenseReport',
      tableName: 'defense_reports',
      underscored: true,
      timestamps: true,
      indexes: [
        { fields: ['attack_id'], unique: true }
      ]
    });

    return DefenseReport;
  }

  static associate(models) {
    DefenseReport.belongsTo(models.Attack, {
      foreignKey: 'attack_id',
      as: 'attack'
    });
  }
}

module.exports = DefenseReport;
