const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AllianceWar = sequelize.define(
    'AllianceWar',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      attackerAllianceId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'attacker_alliance_id',
      },
      defenderAllianceId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'defender_alliance_id',
      },
      declaredBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'declared_by',
      },
      status: {
        type: DataTypes.ENUM('active', 'ceasefire', 'ended'),
        allowNull: false,
        defaultValue: 'active',
      },
      warGoal: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'war_goal',
      },
      attackerScore: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'attacker_score',
      },
      defenderScore: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'defender_score',
      },
      attackerCasualties: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
        field: 'attacker_casualties',
      },
      defenderCasualties: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
        field: 'defender_casualties',
      },
      territoriesContested: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: [],
        field: 'territories_contested',
      },
      warTerms: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
        field: 'war_terms',
      },
      startedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'started_at',
      },
      endedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'ended_at',
      },
      winnerAllianceId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'winner_alliance_id',
      },
    },
    {
      tableName: 'alliance_wars',
      underscored: true,
      timestamps: true,
      indexes: [
        {
          fields: ['attacker_alliance_id', 'status'],
          name: 'idx_wars_attacker_status',
        },
        {
          fields: ['defender_alliance_id', 'status'],
          name: 'idx_wars_defender_status',
        },
        {
          fields: ['status', 'ended_at'],
          name: 'idx_wars_ended',
        },
      ],
    }
  );

  AllianceWar.associate = (models) => {
    AllianceWar.belongsTo(models.Alliance, {
      foreignKey: 'attackerAllianceId',
      as: 'attackerAlliance',
    });

    AllianceWar.belongsTo(models.Alliance, {
      foreignKey: 'defenderAllianceId',
      as: 'defenderAlliance',
    });

    AllianceWar.belongsTo(models.User, {
      foreignKey: 'declaredBy',
      as: 'declarer',
    });

    AllianceWar.hasMany(models.AllianceWarBattle, {
      foreignKey: 'warId',
      as: 'battles',
    });
  };

  return AllianceWar;
};
