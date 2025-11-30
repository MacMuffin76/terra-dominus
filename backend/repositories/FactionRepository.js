/**
 * FactionRepository
 * Data access layer for Factions, Control Zones, and territorial control system
 * Handles all database operations for faction membership, zone control, and bonuses
 */

const { Op } = require('sequelize');
const db = require('../models');
const { Faction, ControlZone, FactionControlPoints, UserFaction, User } = db;

class FactionRepository {
  // ========================================
  // FACTIONS
  // ========================================

  /**
   * Get all available factions with basic info
   * @returns {Promise<Array>} List of factions
   */
  async getAllFactions() {
    return await Faction.findAll({
      attributes: ['id', 'name', 'description', 'color', 'capital_x', 'capital_y', 'bonuses', 'lore'],
      order: [['id', 'ASC']]
    });
  }

  /**
   * Get faction by ID with full details
   * @param {string} factionId - Faction identifier
   * @returns {Promise<Object|null>} Faction or null
   */
  async getFactionById(factionId) {
    return await Faction.findByPk(factionId, {
      include: [
        {
          model: ControlZone,
          as: 'controlledZones',
          where: { current_controller: factionId },
          required: false
        }
      ]
    });
  }

  /**
   * Get faction member count
   * @param {string} factionId - Faction identifier
   * @returns {Promise<number>} Active member count
   */
  async getFactionMemberCount(factionId) {
    return await UserFaction.count({
      where: {
        faction_id: factionId,
        is_active: true
      }
    });
  }

  /**
   * Get faction leaderboard by contribution
   * @param {string} factionId - Faction identifier
   * @param {number} limit - Number of top contributors (default: 10)
   * @returns {Promise<Array>} Top contributors with user info
   */
  async getFactionLeaderboard(factionId, limit = 10) {
    return await UserFaction.findAll({
      where: {
        faction_id: factionId,
        is_active: true
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username']
        }
      ],
      order: [['contribution_points', 'DESC']],
      limit
    });
  }

  // ========================================
  // CONTROL ZONES
  // ========================================

  /**
   * Get all control zones with current status
   * @returns {Promise<Array>} List of zones
   */
  async getAllZones() {
    return await ControlZone.findAll({
      include: [
        {
          model: Faction,
          as: 'controller',
          attributes: ['id', 'name', 'color'],
          required: false
        },
        {
          model: FactionControlPoints,
          as: 'controlProgress',
          include: [
            {
              model: Faction,
              as: 'faction',
              attributes: ['id', 'name', 'color']
            }
          ]
        }
      ],
      order: [['strategic_value', 'DESC']]
    });
  }

  /**
   * Get zone by ID with control progress
   * @param {number} zoneId - Zone identifier
   * @returns {Promise<Object|null>} Zone with control data
   */
  async getZoneById(zoneId) {
    return await ControlZone.findByPk(zoneId, {
      include: [
        {
          model: Faction,
          as: 'controller',
          required: false
        },
        {
          model: FactionControlPoints,
          as: 'controlProgress',
          include: [
            {
              model: Faction,
              as: 'faction'
            }
          ]
        }
      ]
    });
  }

  /**
   * Get zone by coordinates
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {Promise<Object|null>} Zone containing coordinates
   */
  async getZoneByCoordinates(x, y) {
    const zones = await ControlZone.findAll();
    
    for (const zone of zones) {
      if (zone.containsCoordinates(x, y)) {
        return zone;
      }
    }
    
    return null;
  }

  /**
   * Get zones controlled by faction
   * @param {string} factionId - Faction identifier
   * @returns {Promise<Array>} Controlled zones
   */
  async getZonesByController(factionId) {
    return await ControlZone.findAll({
      where: { current_controller: factionId },
      include: [
        {
          model: FactionControlPoints,
          as: 'controlProgress',
          where: { faction_id: factionId }
        }
      ]
    });
  }

  /**
   * Update zone controller
   * @param {number} zoneId - Zone identifier
   * @param {string|null} factionId - New controller faction ID (null for neutral)
   * @param {string} status - New zone status
   * @returns {Promise<Object>} Updated zone
   */
  async updateZoneController(zoneId, factionId, status) {
    const zone = await ControlZone.findByPk(zoneId);
    if (!zone) throw new Error('Zone not found');

    zone.current_controller = factionId;
    zone.status = status;
    await zone.save();

    return zone;
  }

  // ========================================
  // CONTROL POINTS
  // ========================================

  /**
   * Get or create faction control points record for a zone
   * @param {number} zoneId - Zone identifier
   * @param {string} factionId - Faction identifier
   * @returns {Promise<Object>} FactionControlPoints instance
   */
  async getOrCreateControlPoints(zoneId, factionId) {
    const [controlPoints] = await FactionControlPoints.findOrCreate({
      where: {
        zone_id: zoneId,
        faction_id: factionId
      },
      defaults: {
        control_points: 0,
        points_buildings: 0,
        points_military: 0,
        points_attacks: 0,
        points_trade: 0
      }
    });

    return controlPoints;
  }

  /**
   * Add control points to faction in a zone
   * @param {number} zoneId - Zone identifier
   * @param {string} factionId - Faction identifier
   * @param {number} amount - Points to add
   * @param {string} source - Source type (building/military/attack/trade)
   * @returns {Promise<Object>} Updated control points
   */
  async addControlPoints(zoneId, factionId, amount, source) {
    const controlPoints = await this.getOrCreateControlPoints(zoneId, factionId);
    await controlPoints.addPoints(amount, source);
    return controlPoints;
  }

  /**
   * Get control progress for all factions in a zone
   * @param {number} zoneId - Zone identifier
   * @returns {Promise<Array>} Control points for all factions
   */
  async getZoneControlProgress(zoneId) {
    return await FactionControlPoints.findAll({
      where: { zone_id: zoneId },
      include: [
        {
          model: Faction,
          as: 'faction',
          attributes: ['id', 'name', 'color']
        }
      ],
      order: [['control_points', 'DESC']]
    });
  }

  /**
   * Reset control points in a zone (for capture/reset mechanics)
   * @param {number} zoneId - Zone identifier
   * @param {string} winnerFactionId - Faction that won (keep their points)
   * @returns {Promise<void>}
   */
  async resetZoneControlPoints(zoneId, winnerFactionId) {
    await FactionControlPoints.update(
      {
        control_points: 0,
        points_buildings: 0,
        points_military: 0,
        points_attacks: 0,
        points_trade: 0
      },
      {
        where: {
          zone_id: zoneId,
          faction_id: { [Op.ne]: winnerFactionId }
        }
      }
    );
  }

  // ========================================
  // USER FACTION MEMBERSHIP
  // ========================================

  /**
   * Get user's active faction membership
   * @param {number} userId - User identifier
   * @returns {Promise<Object|null>} Active membership or null
   */
  async getUserActiveFaction(userId) {
    return await UserFaction.findOne({
      where: {
        user_id: userId,
        is_active: true
      },
      include: [
        {
          model: Faction,
          as: 'faction'
        }
      ]
    });
  }

  /**
   * Get user's faction membership history
   * @param {number} userId - User identifier
   * @returns {Promise<Array>} All memberships (active and past)
   */
  async getUserFactionHistory(userId) {
    return await UserFaction.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Faction,
          as: 'faction',
          attributes: ['id', 'name', 'color']
        }
      ],
      order: [['joined_at', 'DESC']]
    });
  }

  /**
   * Join a faction (creates new membership)
   * @param {number} userId - User identifier
   * @param {string} factionId - Faction to join
   * @returns {Promise<Object>} New membership
   */
  async joinFaction(userId, factionId) {
    const now = new Date();
    const canChangeAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days cooldown

    return await UserFaction.create({
      user_id: userId,
      faction_id: factionId,
      joined_at: now,
      contribution_points: 0,
      can_change_at: canChangeAt,
      is_active: true
    });
  }

  /**
   * Leave current faction (sets left_at and is_active)
   * @param {number} userId - User identifier
   * @returns {Promise<boolean>} True if left successfully
   */
  async leaveFaction(userId) {
    const membership = await this.getUserActiveFaction(userId);
    if (!membership) return false;

    await membership.leaveFaction();
    return true;
  }

  /**
   * Add contribution points to user's faction membership
   * @param {number} userId - User identifier
   * @param {number} amount - Points to add
   * @returns {Promise<Object|null>} Updated membership or null
   */
  async addUserContribution(userId, amount) {
    const membership = await this.getUserActiveFaction(userId);
    if (!membership) return null;

    await membership.addContribution(amount);
    return membership;
  }

  /**
   * Check if user can change faction (cooldown expired)
   * @param {number} userId - User identifier
   * @returns {Promise<boolean>} True if cooldown expired
   */
  async canUserChangeFaction(userId) {
    const membership = await this.getUserActiveFaction(userId);
    if (!membership) return true; // No faction = can join

    return membership.canChangeFaction();
  }

  /**
   * Get user's cooldown remaining in seconds
   * @param {number} userId - User identifier
   * @returns {Promise<number>} Seconds remaining (0 if can change)
   */
  async getUserCooldownRemaining(userId) {
    const membership = await this.getUserActiveFaction(userId);
    if (!membership) return 0;

    return membership.getCooldownRemaining();
  }

  // ========================================
  // STATISTICS & AGGREGATIONS
  // ========================================

  /**
   * Get faction statistics (members, zones, total bonuses)
   * @param {string} factionId - Faction identifier
   * @returns {Promise<Object>} Faction stats
   */
  async getFactionStats(factionId) {
    const faction = await this.getFactionById(factionId);
    if (!faction) return null;

    const memberCount = await this.getFactionMemberCount(factionId);
    const controlledZones = await this.getZonesByController(factionId);
    const totalBonuses = faction.calculateTotalBonuses();

    return {
      faction_id: factionId,
      name: faction.name,
      member_count: memberCount,
      controlled_zones: controlledZones.length,
      base_bonuses: faction.bonuses,
      total_bonuses: totalBonuses,
      capital: { x: faction.capital_x, y: faction.capital_y }
    };
  }

  /**
   * Get user's faction statistics (rank, contribution, faction bonuses)
   * @param {number} userId - User identifier
   * @returns {Promise<Object|null>} User faction stats or null
   */
  async getUserFactionStats(userId) {
    const membership = await this.getUserActiveFaction(userId);
    if (!membership) return null;

    const faction = await this.getFactionById(membership.faction_id);
    const rank = await membership.getRankInFaction();
    const totalMembers = await membership.getTotalFactionMembers();
    const membershipDuration = membership.getMembershipDuration();
    const cooldownRemaining = membership.getCooldownRemaining();

    return {
      faction_id: membership.faction_id,
      faction_name: faction.name,
      faction_color: faction.color,
      joined_at: membership.joined_at,
      contribution_points: membership.contribution_points,
      rank,
      total_members: totalMembers,
      membership_duration_days: Math.floor(membershipDuration / (24 * 60 * 60)),
      can_change_faction: cooldownRemaining === 0,
      cooldown_remaining_seconds: cooldownRemaining,
      active_bonuses: faction.calculateTotalBonuses()
    };
  }

  /**
   * Get global faction leaderboard (by total control points or members)
   * @param {string} sortBy - Sort criterion (members/zones/contribution)
   * @returns {Promise<Array>} Faction rankings
   */
  async getGlobalFactionLeaderboard(sortBy = 'members') {
    const factions = await this.getAllFactions();
    const rankings = [];

    for (const faction of factions) {
      const memberCount = await this.getFactionMemberCount(faction.id);
      const controlledZones = await this.getZonesByController(faction.id);
      
      // Calculate total contribution across all members
      const totalContribution = await UserFaction.sum('contribution_points', {
        where: {
          faction_id: faction.id,
          is_active: true
        }
      }) || 0;

      rankings.push({
        faction_id: faction.id,
        name: faction.name,
        color: faction.color,
        member_count: memberCount,
        controlled_zones: controlledZones.length,
        total_contribution: totalContribution
      });
    }

    // Sort by criterion
    rankings.sort((a, b) => {
      if (sortBy === 'members') return b.member_count - a.member_count;
      if (sortBy === 'zones') return b.controlled_zones - a.controlled_zones;
      if (sortBy === 'contribution') return b.total_contribution - a.total_contribution;
      return 0;
    });

    return rankings;
  }

  /**
   * Get zone control history (last N captures)
   * @param {number} zoneId - Zone identifier
   * @param {number} limit - Number of history entries
   * @returns {Promise<Array>} Control history
   */
  async getZoneControlHistory(zoneId, limit = 10) {
    // This would query a separate control_history table if implemented
    // For now, return current control progress as proxy
    return await this.getZoneControlProgress(zoneId);
  }
}

module.exports = FactionRepository;
