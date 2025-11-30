const { DataTypes, Model } = require('sequelize');

/**
 * Portal - Portails PvE style Solo Leveling
 * 
 * Portails apparaissent aléatoirement sur la carte avec différents tiers de difficulté.
 * Joueurs envoient des unités pour combattre les ennemis et obtenir du loot.
 */
class Portal extends Model {
  static init(sequelize) {
    super.init({
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      tier: {
        type: DataTypes.ENUM('GREY', 'GREEN', 'BLUE', 'PURPLE', 'RED', 'GOLD'),
        allowNull: false,
      },
      coord_x: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      coord_y: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      power: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      enemies: {
        type: DataTypes.TEXT,
        allowNull: false,
        get() {
          const rawValue = this.getDataValue('enemies');
          return rawValue ? JSON.parse(rawValue) : [];
        },
        set(value) {
          this.setDataValue('enemies', JSON.stringify(value));
        }
      },
      loot_table: {
        type: DataTypes.TEXT,
        allowNull: false,
        get() {
          const rawValue = this.getDataValue('loot_table');
          return rawValue ? JSON.parse(rawValue) : { guaranteed: {}, random: [] };
        },
        set(value) {
          this.setDataValue('loot_table', JSON.stringify(value));
        }
      },
      status: {
        type: DataTypes.ENUM('active', 'expired', 'cleared'),
        allowNull: false,
        defaultValue: 'active',
      },
      spawned_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      times_challenged: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      times_cleared: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      }
    }, {
      sequelize,
      modelName: 'Portal',
      tableName: 'portals',
      timestamps: true,
      underscored: true
    });
  }

  static associate(models) {
    Portal.hasMany(models.PortalExpedition, {
      foreignKey: 'portal_id',
      as: 'expeditions'
    });
  }
}

module.exports = Portal;
