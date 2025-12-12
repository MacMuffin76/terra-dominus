const { Model, DataTypes } = require('sequelize');

class AttackWave extends Model {
  static init(sequelize) {
    super.init({
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      attack_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      unit_entity_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1
        }
      },
      survivors: {
        type: DataTypes.INTEGER,
        allowNull: true
      }
    }, {
      sequelize,
      modelName: 'AttackWave',
      tableName: 'attack_waves',
      underscored: true,
      timestamps: true,
      indexes: [
        { fields: ['attack_id'] },
        { fields: ['unit_entity_id'] }
      ]
    });

    return AttackWave;
  }

  static associate(models) {
    AttackWave.belongsTo(models.Attack, {
      foreignKey: 'attack_id',
      as: 'attack'
    });
    // unit_entity_id référence la table units, pas entities
    AttackWave.belongsTo(models.Unit, {
      foreignKey: 'unit_entity_id',
      as: 'unit'
    });
  }
}

module.exports = AttackWave;
