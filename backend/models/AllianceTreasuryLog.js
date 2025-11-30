const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AllianceTreasuryLog = sequelize.define(
    'AllianceTreasuryLog',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      allianceId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'alliance_id',
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'user_id',
      },
      transactionType: {
        type: DataTypes.ENUM('deposit', 'withdraw', 'tax', 'war_loot', 'territory_income', 'upgrade_cost'),
        allowNull: false,
        field: 'transaction_type',
      },
      resourceType: {
        type: DataTypes.ENUM('gold', 'metal', 'fuel', 'energy'),
        allowNull: false,
        field: 'resource_type',
      },
      amount: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      balanceBefore: {
        type: DataTypes.BIGINT,
        allowNull: false,
        field: 'balance_before',
      },
      balanceAfter: {
        type: DataTypes.BIGINT,
        allowNull: false,
        field: 'balance_after',
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
      },
    },
    {
      tableName: 'alliance_treasury_logs',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
      indexes: [
        {
          fields: ['alliance_id', 'created_at'],
          name: 'idx_treasury_logs_alliance_date',
        },
        {
          fields: ['user_id'],
          name: 'idx_treasury_logs_user',
        },
      ],
    }
  );

  AllianceTreasuryLog.associate = (models) => {
    AllianceTreasuryLog.belongsTo(models.Alliance, {
      foreignKey: 'allianceId',
      as: 'alliance',
    });

    AllianceTreasuryLog.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
  };

  return AllianceTreasuryLog;
};
