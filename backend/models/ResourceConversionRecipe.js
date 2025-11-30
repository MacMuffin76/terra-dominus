const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ResourceConversionRecipe = sequelize.define(
    'ResourceConversionRecipe',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      resourceType: {
        type: DataTypes.ENUM('titanium', 'plasma', 'nanotubes'),
        allowNull: false,
        unique: true,
        field: 'resource_type',
      },
      inputResources: {
        type: DataTypes.JSONB,
        allowNull: false,
        field: 'input_resources',
      },
      outputQuantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'output_quantity',
      },
      durationSeconds: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'duration_seconds',
      },
      buildingRequired: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'building_required',
      },
      buildingLevelMin: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'building_level_min',
      },
      researchRequired: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'research_required',
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_active',
      },
    },
    {
      tableName: 'resource_conversion_recipes',
      underscored: true,
      timestamps: true,
    }
  );

  return ResourceConversionRecipe;
};
