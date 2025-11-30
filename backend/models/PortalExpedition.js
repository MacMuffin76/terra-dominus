const { DataTypes, Model } = require('sequelize');

/**
 * PortalExpedition - Expéditions de joueurs vers les portails
 */
class PortalExpedition extends Model {
  static init(sequelize) {
    super.init({
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      portal_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      city_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      units: {
        type: DataTypes.TEXT,
        allowNull: false,
        get() {
          const rawValue = this.getDataValue('units');
          return rawValue ? JSON.parse(rawValue) : {};
        },
        set(value) {
          this.setDataValue('units', JSON.stringify(value));
        }
      },
      status: {
        type: DataTypes.ENUM('traveling', 'victory', 'defeat'),
        allowNull: false,
        defaultValue: 'traveling',
      },
      departure_time: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      arrival_time: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      resolved_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      distance: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      loot_gained: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
          const rawValue = this.getDataValue('loot_gained');
          return rawValue ? JSON.parse(rawValue) : null;
        },
        set(value) {
          this.setDataValue('loot_gained', value ? JSON.stringify(value) : null);
        }
      },
      survivors: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
          const rawValue = this.getDataValue('survivors');
          return rawValue ? JSON.parse(rawValue) : null;
        },
        set(value) {
          this.setDataValue('survivors', value ? JSON.stringify(value) : null);
        }
      }
    }, {
      sequelize,
      modelName: 'PortalExpedition',
      tableName: 'portal_expeditions',
      timestamps: true,
      underscored: true
    });
  }

  static associate(models) {
    // Temporarily commented - Portal model changed to factory function
    // PortalExpedition.belongsTo(models.Portal, {
    //   foreignKey: 'portal_id',
    //   as: 'portal'
    // });
    PortalExpedition.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
    PortalExpedition.belongsTo(models.City, {
      foreignKey: 'city_id',
      as: 'city'
    });
  }
}

module.exports = PortalExpedition;
