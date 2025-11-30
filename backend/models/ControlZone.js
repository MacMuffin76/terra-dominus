const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class ControlZone extends Model {
    static associate(models) {
      // A zone is controlled by one faction (or null)
      ControlZone.belongsTo(models.Faction, {
        foreignKey: 'current_controller',
        as: 'controller'
      });

      // A zone has control points from multiple factions
      ControlZone.hasMany(models.FactionControlPoints, {
        foreignKey: 'zone_id',
        as: 'factionPoints'
      });
    }

    /**
     * Check if coordinates are within zone radius
     */
    containsCoordinates(x, y) {
      const distance = Math.sqrt(
        Math.pow(x - this.center_x, 2) + Math.pow(y - this.center_y, 2)
      );
      return distance <= this.radius;
    }

    /**
     * Get control progress for all factions
     */
    async getControlProgress() {
      const FactionControlPoints = sequelize.models.FactionControlPoints;
      
      const factionPoints = await FactionControlPoints.findAll({
        where: { zone_id: this.id },
        include: [{
          model: sequelize.models.Faction,
          as: 'faction',
          attributes: ['id', 'name', 'color']
        }],
        order: [['control_points', 'DESC']]
      });

      const progress = {};
      factionPoints.forEach(fp => {
        progress[fp.faction_id] = {
          points: fp.control_points,
          percentage: Math.min(100, (fp.control_points / this.control_threshold) * 100),
          faction_name: fp.faction?.name,
          faction_color: fp.faction?.color
        };
      });

      return progress;
    }

    /**
     * Check if zone should change status (neutral/contested/controlled)
     */
    async evaluateStatus() {
      const FactionControlPoints = sequelize.models.FactionControlPoints;
      
      const topFactions = await FactionControlPoints.findAll({
        where: { zone_id: this.id },
        order: [['control_points', 'DESC']],
        limit: 2
      });

      if (topFactions.length === 0) {
        return { newStatus: 'neutral', newController: null };
      }

      const topFaction = topFactions[0];
      const secondFaction = topFactions[1];

      // Clear capture: top faction exceeds threshold
      if (topFaction.control_points >= this.control_threshold) {
        return {
          newStatus: 'controlled',
          newController: topFaction.faction_id,
          capturedBy: topFaction.faction_id
        };
      }

      // Contested: 2+ factions above 50% threshold
      if (
        topFaction.control_points >= this.control_threshold * 0.5 &&
        secondFaction &&
        secondFaction.control_points >= this.control_threshold * 0.5
      ) {
        return {
          newStatus: 'contested',
          newController: this.current_controller, // Keep current
          contestedBy: [topFaction.faction_id, secondFaction.faction_id]
        };
      }

      // Neutral: no dominant faction
      return { newStatus: 'neutral', newController: null };
    }

    /**
     * Get zone display info with bonuses
     */
    getDisplayInfo() {
      return {
        id: this.id,
        name: this.name,
        description: this.description,
        center: { x: this.center_x, y: this.center_y },
        radius: this.radius,
        status: this.status,
        controller: this.current_controller,
        captured_at: this.captured_at,
        bonuses: this.bonuses,
        strategic_value: this.strategic_value,
        control_threshold: this.control_threshold
      };
    }

    /**
     * Get control history (who controlled and when)
     */
    async getControlHistory(limit = 10) {
      const FactionWarHistory = sequelize.models.FactionWarHistory;
      
      if (!FactionWarHistory) {
        return [];
      }

      const history = await FactionWarHistory.findAll({
        where: { zone_id: this.id },
        order: [['war_ended_at', 'DESC']],
        limit
      });

      return history;
    }
  }

  ControlZone.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    center_x: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    center_y: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    radius: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 30
    },
    current_controller: {
      type: DataTypes.STRING(50),
      allowNull: true,
      references: {
        model: 'factions',
        key: 'id'
      }
    },
    control_threshold: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1000
    },
    captured_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    bonuses: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
      comment: 'Zone bonuses { metal: 1.15, defense: 1.10 }'
    },
    strategic_value: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3,
      validate: {
        min: 1,
        max: 5
      }
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'neutral',
      validate: {
        isIn: [['neutral', 'contested', 'controlled']]
      }
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at'
    }
  }, {
    sequelize,
    modelName: 'ControlZone',
    tableName: 'control_zones',
    timestamps: true,
    underscored: true
  });

  return ControlZone;
};
