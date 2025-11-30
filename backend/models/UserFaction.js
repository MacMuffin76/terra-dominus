const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class UserFaction extends Model {
    static associate(models) {
      // User faction membership belongs to a user
      UserFaction.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });

      // User faction membership belongs to a faction
      UserFaction.belongsTo(models.Faction, {
        foreignKey: 'faction_id',
        as: 'faction'
      });
    }

    /**
     * Add contribution points to user
     */
    async addContribution(amount) {
      this.contribution_points += amount;
      await this.save();
      return this.contribution_points;
    }

    /**
     * Check if user can change faction (cooldown expired)
     */
    canChangeFaction() {
      if (!this.can_change_at) return true;
      return new Date() >= new Date(this.can_change_at);
    }

    /**
     * Get remaining cooldown time in seconds
     */
    getCooldownRemaining() {
      if (!this.can_change_at) return 0;
      
      const now = new Date();
      const cooldownEnd = new Date(this.can_change_at);
      
      if (now >= cooldownEnd) return 0;
      
      return Math.floor((cooldownEnd - now) / 1000);
    }

    /**
     * Set cooldown for faction change (default 30 days)
     */
    async setCooldown(days = 30) {
      const cooldownEnd = new Date();
      cooldownEnd.setDate(cooldownEnd.getDate() + days);
      
      this.can_change_at = cooldownEnd;
      await this.save();
      
      return this.can_change_at;
    }

    /**
     * Leave faction (mark as inactive)
     */
    async leaveFaction() {
      this.is_active = false;
      this.left_at = new Date();
      await this.save();
    }

    /**
     * Get user rank in faction by contribution
     */
    async getRankInFaction() {
      const higherRanked = await UserFaction.count({
        where: {
          faction_id: this.faction_id,
          is_active: true,
          contribution_points: {
            [sequelize.Sequelize.Op.gt]: this.contribution_points
          }
        }
      });

      return higherRanked + 1; // Rank is 1-indexed
    }

    /**
     * Get total faction members
     */
    async getTotalFactionMembers() {
      return await UserFaction.count({
        where: {
          faction_id: this.faction_id,
          is_active: true
        }
      });
    }

    /**
     * Calculate membership duration in days
     */
    getMembershipDuration() {
      const endDate = this.left_at || new Date();
      const startDate = new Date(this.joined_at);
      
      const durationMs = endDate - startDate;
      return Math.floor(durationMs / (1000 * 60 * 60 * 24));
    }

    /**
     * Get display info
     */
    async getDisplayInfo() {
      const rank = await this.getRankInFaction();
      const totalMembers = await this.getTotalFactionMembers();
      
      return {
        faction_id: this.faction_id,
        joined_at: this.joined_at,
        contribution_points: this.contribution_points,
        rank,
        total_members: totalMembers,
        can_change: this.canChangeFaction(),
        cooldown_remaining: this.getCooldownRemaining(),
        membership_days: this.getMembershipDuration()
      };
    }
  }

  UserFaction.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
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
    joined_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    left_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    contribution_points: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    can_change_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Cooldown expiry for faction change'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'UserFaction',
    tableName: 'user_factions',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['faction_id', 'is_active'],
        where: { is_active: true }
      }
    ]
  });

  return UserFaction;
};
