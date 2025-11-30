const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserResourceT2 = sequelize.define(
    'UserResourceT2',
    {
      userId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        field: 'user_id',
      },
      titanium: {
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: 0,
      },
      plasma: {
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: 0,
      },
      nanotubes: {
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: 0,
      },
      titaniumStorageMax: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'titanium_storage_max',
      },
      plasmaStorageMax: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'plasma_storage_max',
      },
      nanotubesStorageMax: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'nanotubes_storage_max',
      },
      lastProductionAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'last_production_at',
      },
    },
    {
      tableName: 'user_resources_t2',
      underscored: true,
      timestamps: true,
    }
  );

  UserResourceT2.associate = (models) => {
    UserResourceT2.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
  };

  return UserResourceT2;
};
