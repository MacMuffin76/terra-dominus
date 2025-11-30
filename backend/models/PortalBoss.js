const { DataTypes } = require('sequelize');

/**
 * PortalBoss - Boss battles for advanced portal encounters
 * 
 * Bosses spawn on higher tier portals (Blue+) with multi-phase mechanics.
 * Players must coordinate and adapt tactics as bosses change behavior.
 */
module.exports = (sequelize) => {
  const PortalBoss = sequelize.define('PortalBoss', {
    boss_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    portal_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'portals',
        key: 'id',
      },
    },
    boss_type: {
      type: DataTypes.ENUM('elite_guardian', 'ancient_titan', 'void_reaver', 'cosmic_emperor'),
      allowNull: false,
      comment: 'Type of boss with unique mechanics',
    },
    base_hp: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Maximum HP of the boss',
    },
    current_hp: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Current HP (for persistent boss battles)',
    },
    current_phase: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: 'Current phase 1-4 based on HP thresholds',
    },
    defense: {
      type: DataTypes.INTEGER,
      defaultValue: 100,
      comment: 'Boss defense rating',
    },
    abilities: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Array of boss abilities: shield_regen, aoe_blast, unit_disable',
      get() {
        const rawValue = this.getDataValue('abilities');
        return rawValue || [];
      },
    },
    abilities_used: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Log of abilities triggered with timestamps',
      get() {
        const rawValue = this.getDataValue('abilities_used');
        return rawValue || [];
      },
    },
    rewards: {
      type: DataTypes.JSONB,
      comment: 'Special boss rewards on defeat',
      get() {
        const rawValue = this.getDataValue('rewards');
        return rawValue || {};
      },
    },
    defeated: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    defeated_by: {
      type: DataTypes.INTEGER,
      references: {
        model: 'users',
        key: 'id',
      },
      comment: 'User who landed killing blow',
    },
    defeated_at: {
      type: DataTypes.DATE,
      comment: 'Timestamp when boss was defeated',
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'portal_bosses',
    timestamps: false,
    indexes: [
      { fields: ['portal_id'] },
      { fields: ['boss_type'] },
      { fields: ['defeated'] },
    ],
  });

  PortalBoss.associate = (models) => {
    PortalBoss.belongsTo(models.Portal, {
      foreignKey: 'portal_id',
      as: 'portal',
    });

    PortalBoss.belongsTo(models.User, {
      foreignKey: 'defeated_by',
      as: 'defeatedByUser',
    });

    PortalBoss.hasMany(models.PortalBossAttempt, {
      foreignKey: 'boss_id',
      as: 'attempts',
    });
  };

  /**
   * Check if boss is still alive
   */
  PortalBoss.prototype.isAlive = function() {
    return !this.defeated && this.current_hp > 0;
  };

  /**
   * Get current phase based on HP
   */
  PortalBoss.prototype.getCurrentPhase = function() {
    const hpPercent = (this.current_hp / this.base_hp) * 100;
    if (hpPercent > 75) return 1;
    if (hpPercent > 50) return 2;
    if (hpPercent > 25) return 3;
    return 4;
  };

  /**
   * Apply damage and update phase
   */
  PortalBoss.prototype.takeDamage = function(damage) {
    const oldPhase = this.getCurrentPhase();
    this.current_hp = Math.max(0, this.current_hp - damage);
    const newPhase = this.getCurrentPhase();
    
    if (this.current_hp === 0) {
      this.defeated = true;
    }
    
    return {
      damage,
      newHP: this.current_hp,
      phaseTransition: oldPhase !== newPhase,
      newPhase,
      defeated: this.defeated,
    };
  };

  /**
   * Get abilities for current phase
   */
  PortalBoss.prototype.getPhaseAbilities = function() {
    const phase = this.getCurrentPhase();
    const PHASE_ABILITIES = {
      1: [],
      2: ['shield_regeneration'],
      3: ['shield_regeneration', 'aoe_blast'],
      4: ['shield_regeneration', 'aoe_blast', 'unit_disable'],
    };
    return PHASE_ABILITIES[phase] || [];
  };

  /**
   * Get boss info summary
   */
  PortalBoss.prototype.getSummary = function() {
    return {
      boss_id: this.boss_id,
      boss_type: this.boss_type,
      hp: {
        current: this.current_hp,
        max: this.base_hp,
        percent: Math.round((this.current_hp / this.base_hp) * 100),
      },
      phase: this.getCurrentPhase(),
      abilities: this.getPhaseAbilities(),
      defeated: this.defeated,
      rewards: this.rewards,
    };
  };

  return PortalBoss;
};
