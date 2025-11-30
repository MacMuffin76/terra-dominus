const { DataTypes } = require("sequelize");
/** * Portal - PvE Portals System *  * Portals spawn randomly on the world map with different difficulty tiers. * Players send units to battle enemies and earn rewards. */ module.exports =
  (sequelize) => {
    const Portal = sequelize.define(
      "Portal",
      {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        tier: {
          type: DataTypes.ENUM(
            "grey",
            "green",
            "blue",
            "purple",
            "red",
            "golden",
          ),
          allowNull: false,
        },
        x_coordinate: { type: DataTypes.INTEGER, allowNull: false },
        y_coordinate: { type: DataTypes.INTEGER, allowNull: false },
        spawn_time: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        expiry_time: { type: DataTypes.DATE, allowNull: false },
        status: {
          type: DataTypes.ENUM("active", "expired", "completed"),
          defaultValue: "active",
        },
        difficulty: {
          type: DataTypes.INTEGER,
          allowNull: false,
          validate: { min: 1, max: 10 },
        },
        recommended_power: { type: DataTypes.INTEGER, allowNull: false },
        global_event: { type: DataTypes.BOOLEAN, defaultValue: false },
        enemy_composition: {
          type: DataTypes.JSONB,
          defaultValue: {},
          get() {
            const rawValue = this.getDataValue("enemy_composition");
            return rawValue || {};
          },
        },
        created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      },
      {
        tableName: "portals",
        timestamps: false,
        indexes: [
          { fields: ["status"] },
          { fields: ["tier"] },
          { fields: ["x_coordinate", "y_coordinate"] },
          { fields: ["expiry_time"] },
        ],
      },
    );
    Portal.associate = (models) => {
      Portal.hasMany(models.PortalAttempt, {
        foreignKey: "portal_id",
        as: "attempts",
      });

      Portal.hasOne(models.PortalBoss, {
        foreignKey: "portal_id",
        as: "boss",
      });
    };
    /**   * Check if portal is still active   */ Portal.prototype.isActive =
      function () {
        return (
          this.status === "active" && new Date() < new Date(this.expiry_time)
        );
      };
    /**   * Check if portal has expired   */ Portal.prototype.hasExpired =
      function () {
        return new Date() >= new Date(this.expiry_time);
      };
    /**   * Get distance from coordinates   */ Portal.prototype.getDistanceFrom =
      function (x, y) {
        const dx = this.x_coordinate - x;
        const dy = this.y_coordinate - y;
        return Math.sqrt(dx * dx + dy * dy);
      };
    return Portal;
  };
