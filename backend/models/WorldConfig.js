const { DataTypes } = require('sequelize');
const sequelize = require('../db');

/**
 * WorldConfig - Configuration de la carte du monde
 * Stocke la seed et les paramètres de génération procédurale
 */
const WorldConfig = sequelize.define(
  'WorldConfig',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    seed: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Seed utilisée pour la génération procédurale de la carte',
    },
    map_width: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 2400,
    },
    map_height: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 800,
    },
    generated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    version: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: 'Version de l\'algorithme de génération',
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
      comment: 'Métadonnées additionnelles',
    },
  },
  {
    tableName: 'world_config',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['seed'],
        name: 'world_config_seed_idx',
      },
    ],
  }
);

module.exports = WorldConfig;
