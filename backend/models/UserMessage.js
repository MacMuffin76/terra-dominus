const { Model, DataTypes } = require('sequelize');

class UserMessage extends Model {
  static init(sequelize) {
    super.init({
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      type: {
        type: DataTypes.ENUM(
          'attack_incoming',
          'attack_launched', 
          'attack_result',
          'defense_report',
          'spy_report',
          'spy_detected',
          'trade_arrival',
          'trade_cancelled',
          'colonization_complete',
          'alliance_invite',
          'alliance_message',
          'admin_message',
          'system_message',
          'resource_full',
          'construction_complete',
          'research_complete'
        ),
        allowNull: false
      },
      title: {
        type: DataTypes.STRING(200),
        allowNull: false
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      data: {
        type: DataTypes.JSONB,
        allowNull: true
      },
      is_read: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      priority: {
        type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
        allowNull: false,
        defaultValue: 'normal'
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      read_at: {
        type: DataTypes.DATE,
        allowNull: true
      }
    }, {
      sequelize,
      modelName: 'UserMessage',
      tableName: 'user_messages',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false
    });

    return UserMessage;
  }

  static associate(models) {
    UserMessage.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  }
}

module.exports = UserMessage;
