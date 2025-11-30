const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ResourceConversion = sequelize.define(
    'ResourceConversion',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'user_id',
      },
      resourceType: {
        type: DataTypes.ENUM('titanium', 'plasma', 'nanotubes'),
        allowNull: false,
        field: 'resource_type',
      },
      quantityTarget: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'quantity_target',
      },
      inputCost: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
        field: 'input_cost',
      },
      buildingId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'building_id',
      },
      startedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'started_at',
      },
      completedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'completed_at',
      },
      status: {
        type: DataTypes.ENUM('queued', 'in_progress', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'in_progress',
      },
    },
    {
      tableName: 'resource_conversions',
      underscored: true,
      timestamps: true,
    }
  );

  ResourceConversion.associate = (models) => {
    ResourceConversion.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
  };

  return ResourceConversion;
};
