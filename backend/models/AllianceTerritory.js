const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AllianceTerritory = sequelize.define(
    'AllianceTerritory',
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
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      territoryType: {
        type: DataTypes.ENUM('strategic_point', 'resource_node', 'defensive_outpost', 'trade_hub'),
        allowNull: false,
        defaultValue: 'strategic_point',
        field: 'territory_type',
      },
      coordX: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'coord_x',
      },
      coordY: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'coord_y',
      },
      radius: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 10,
        field: 'radius',
      },
      controlPoints: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'control_points',
      },
      bonuses: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
      },
      capturedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'captured_at',
      },
      lastAttack: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'last_attack',
      },
      defenseLevel: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        field: 'defense_level',
      },
      garrisonStrength: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'garrison_strength',
      },
    },
    {
      tableName: 'alliance_territories',
      underscored: true,
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['coord_x', 'coord_y'],
          name: 'idx_territories_coords_unique',
        },
        {
          fields: ['alliance_id'],
          name: 'idx_territories_alliance',
        },
        {
          fields: ['coord_x', 'coord_y'],
          name: 'idx_territories_spatial',
        },
      ],
    }
  );

  AllianceTerritory.associate = (models) => {
    AllianceTerritory.belongsTo(models.Alliance, {
      foreignKey: 'allianceId',
      as: 'alliance',
    });
  };

  return AllianceTerritory;
};
