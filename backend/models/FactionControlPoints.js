const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class FactionControlPoints extends Model {
    static associate(models) {
      // Control points belong to a zone
      FactionControlPoints.belongsTo(models.ControlZone, {
        foreignKey: 'zone_id',
        as: 'zone'
      });

      // Control points belong to a faction
      FactionControlPoints.belongsTo(models.Faction, {
        foreignKey: 'faction_id',
        as: 'faction'
      });
    }

    /**
     * Add control points from specific source
     */
    async addPoints(amount, source = 'other') {
      this.control_points += amount;
      
      // Update breakdown by source
      switch (source) {
        case 'building':
          this.points_buildings += amount;
          break;
        case 'military':
          this.points_military += amount;
          break;
        case 'attack':
          this.points_attacks += amount;
          break;
        case 'trade':
          this.points_trade += amount;
          break;
      }

      this.last_contribution_at = new Date();
      await this.save();

      return this.control_points;
    }

    /**
     * Get points breakdown by source
     */
    getBreakdown() {
      return {
        total: this.control_points,
        buildings: this.points_buildings,
        military: this.points_military,
        attacks: this.points_attacks,
        trade: this.points_trade
      };
    }

    /**
     * Calculate percentage of threshold
     */
    async getProgressPercentage() {
      const zone = await this.getZone();
      if (!zone) return 0;
      
      return Math.min(100, (this.control_points / zone.control_threshold) * 100);
    }

    /**
     * Check if faction can capture zone
     */
    async canCapture() {
      const zone = await this.getZone();
      if (!zone) return false;
      
      return this.control_points >= zone.control_threshold;
    }
  }

  FactionControlPoints.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    zone_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'control_zones',
        key: 'id'
      }
    },
    faction_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      references: {
        model: 'factions',
        key: 'id'
      }
    },
    control_points: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    points_buildings: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    points_military: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    points_attacks: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    points_trade: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    last_contribution_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at'
    }
  }, {
    sequelize,
    modelName: 'FactionControlPoints',
    tableName: 'faction_control_points',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['zone_id', 'faction_id'],
        name: 'unique_zone_faction'
      }
    ]
  });

  return FactionControlPoints;
};
