const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AllianceWarBattle = sequelize.define(
    'AllianceWarBattle',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      warId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'war_id',
      },
      battleReportId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'battle_report_id',
      },
      attackerUserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'attacker_user_id',
      },
      defenderUserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'defender_user_id',
      },
      outcome: {
        type: DataTypes.ENUM('attacker_victory', 'defender_victory', 'draw'),
        allowNull: false,
      },
      pointsAwarded: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'points_awarded',
      },
      resourcesPillaged: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
        field: 'resources_pillaged',
      },
      territoryCaptured: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'territory_captured',
      },
      occurredAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'occurred_at',
      },
    },
    {
      tableName: 'alliance_war_battles',
      underscored: true,
      timestamps: false,
      indexes: [
        {
          fields: ['war_id', 'occurred_at'],
          name: 'idx_war_battles_war_date',
        },
      ],
    }
  );

  AllianceWarBattle.associate = (models) => {
    AllianceWarBattle.belongsTo(models.AllianceWar, {
      foreignKey: 'warId',
      as: 'war',
    });
  };

  return AllianceWarBattle;
};
