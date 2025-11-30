const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Faction extends Model {
    static associate(models) {
      // A faction has many control zones
      Faction.hasMany(models.ControlZone, {
        foreignKey: 'current_controller',
        as: 'controlledZones'
      });

      // A faction has many control points in different zones
      Faction.hasMany(models.FactionControlPoints, {
        foreignKey: 'faction_id',
        as: 'controlPoints'
      });

      // A faction has many members
      Faction.hasMany(models.UserFaction, {
        foreignKey: 'faction_id',
        as: 'members'
      });
    }

    /**
     * Get total number of active members
     */
    async getMemberCount() {
      const UserFaction = sequelize.models.UserFaction;
      const count = await UserFaction.count({
        where: {
          faction_id: this.id,
          is_active: true
        }
      });
      return count;
    }

    /**
     * Get top contributors in faction
     */
    async getLeaderboard(limit = 10) {
      const UserFaction = sequelize.models.UserFaction;
      const User = sequelize.models.User;
      
      const topContributors = await UserFaction.findAll({
        where: {
          faction_id: this.id,
          is_active: true
        },
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'username']
        }],
        order: [['contribution_points', 'DESC']],
        limit
      });

      return topContributors.map((uf, index) => ({
        rank: index + 1,
        user_id: uf.user.id,
        username: uf.user.username,
        contribution_points: uf.contribution_points,
        joined_at: uf.joined_at
      }));
    }

    /**
     * Calculate aggregated bonuses from controlled zones
     */
    async calculateTotalBonuses() {
      const ControlZone = sequelize.models.ControlZone;
      
      const controlledZones = await ControlZone.findAll({
        where: {
          current_controller: this.id,
          status: 'controlled'
        }
      });

      // Start with base faction bonuses
      const aggregatedBonuses = { ...(this.bonuses || {}) };

      // Add zone bonuses with diminishing returns
      controlledZones.forEach((zone, index) => {
        const effectiveness = Math.pow(0.9, index); // 90% per zone
        const zoneBonuses = zone.bonuses || {};

        Object.entries(zoneBonuses).forEach(([key, value]) => {
          const bonusMultiplier = (value - 1) * effectiveness + 1;
          aggregatedBonuses[key] = (aggregatedBonuses[key] || 1.0) * bonusMultiplier;
        });
      });

      // Cap max bonus at +50%
      Object.keys(aggregatedBonuses).forEach(key => {
        aggregatedBonuses[key] = Math.min(aggregatedBonuses[key], 1.5);
      });

      return aggregatedBonuses;
    }

    /**
     * Get faction display info
     */
    getDisplayInfo() {
      return {
        id: this.id,
        name: this.name,
        description: this.description,
        color: this.color,
        lore: this.lore,
        bonuses: this.bonuses,
        unique_unit: {
          type: this.unique_unit_type,
          stats: this.unique_unit_stats
        }
      };
    }
  }

  Faction.init({
    id: {
      type: DataTypes.STRING(50),
      primaryKey: true,
      comment: 'Faction identifier (TERRAN_FEDERATION, NOMAD_RAIDERS, INDUSTRIAL_SYNDICATE)'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    color: {
      type: DataTypes.STRING(7),
      allowNull: true,
      comment: 'Hex color for UI'
    },
    capital_x: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    capital_y: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    bonuses: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
      comment: 'Faction passive bonuses { defense: 1.15, production: 1.25 }'
    },
    unique_unit_type: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    unique_unit_stats: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    lore: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    }
  }, {
    sequelize,
    modelName: 'Faction',
    tableName: 'factions',
    timestamps: false,
    underscored: true
  });

  return Faction;
};
