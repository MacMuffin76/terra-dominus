/**
 * FactionService
 * Business logic layer for Factions & Territorial Control system
 * Handles faction membership, zone control, point accumulation, and bonus calculations
 */

const logger = require('../utils/logger');

class FactionService {
  /**
   * @param {FactionRepository} factionRepository
   */
  constructor({ factionRepository }) {
    this.factionRepository = factionRepository;
  }

  // ========================================
  // FACTION QUERIES
  // ========================================

  /**
   * Get all available factions
   * @returns {Promise<Array>} List of factions with display info
   */
  async getAllFactions() {
    const factions = await this.factionRepository.getAllFactions();
    return factions.map(f => f.getDisplayInfo());
  }

  /**
   * Get faction details by ID
   * @param {string} factionId - Faction identifier
   * @returns {Promise<Object>} Faction details with stats
   * @throws {Error} If faction not found
   */
  async getFactionDetails(factionId) {
    const faction = await this.factionRepository.getFactionById(factionId);
    if (!faction) {
      throw new Error(`Faction ${factionId} not found`);
    }

    const stats = await this.factionRepository.getFactionStats(factionId);
    const leaderboard = await this.factionRepository.getFactionLeaderboard(factionId, 10);

    return {
      ...faction.getDisplayInfo(),
      stats,
      top_contributors: leaderboard.map(m => ({
        user_id: m.user.id,
        username: m.user.username,
        contribution_points: m.contribution_points,
        joined_at: m.joined_at
      }))
    };
  }

  /**
   * Get faction statistics
   * @param {string} factionId - Faction identifier
   * @returns {Promise<Object>} Faction stats
   */
  async getFactionStats(factionId) {
    return await this.factionRepository.getFactionStats(factionId);
  }

  /**
   * Get global faction leaderboard
   * @param {string} sortBy - Sort criterion (members/zones/contribution)
   * @returns {Promise<Array>} Faction rankings
   */
  async getGlobalLeaderboard(sortBy = 'members') {
    return await this.factionRepository.getGlobalFactionLeaderboard(sortBy);
  }

  // ========================================
  // USER FACTION MEMBERSHIP
  // ========================================

  /**
   * Get user's current faction membership and stats
   * @param {number} userId - User identifier
   * @returns {Promise<Object|null>} Faction stats or null if no faction
   */
  async getUserFaction(userId) {
    return await this.factionRepository.getUserFactionStats(userId);
  }

  /**
   * Join a faction
   * @param {number} userId - User identifier
   * @param {string} factionId - Faction to join
   * @returns {Promise<Object>} New membership details
   * @throws {Error} If validation fails
   */
  async joinFaction(userId, factionId) {
    logger.info(`User ${userId} attempting to join faction ${factionId}`);

    // Check if faction exists
    const faction = await this.factionRepository.getFactionById(factionId);
    if (!faction) {
      throw new Error(`Faction ${factionId} does not exist`);
    }

    // Check if user already has an active faction
    const currentFaction = await this.factionRepository.getUserActiveFaction(userId);
    if (currentFaction) {
      throw new Error(`You are already a member of ${currentFaction.faction.name}. Leave your current faction first.`);
    }

    // Check cooldown from previous faction
    const canChange = await this.factionRepository.canUserChangeFaction(userId);
    if (!canChange) {
      const cooldownRemaining = await this.factionRepository.getUserCooldownRemaining(userId);
      const daysRemaining = Math.ceil(cooldownRemaining / (24 * 60 * 60));
      throw new Error(`Faction change cooldown active. You can join a new faction in ${daysRemaining} days.`);
    }

    // Create membership
    const membership = await this.factionRepository.joinFaction(userId, factionId);
    
    logger.info(`User ${userId} successfully joined faction ${factionId}`);

    return {
      faction_id: factionId,
      faction_name: faction.name,
      faction_color: faction.color,
      joined_at: membership.joined_at,
      can_change_at: membership.can_change_at,
      bonuses: faction.calculateTotalBonuses()
    };
  }

  /**
   * Leave current faction
   * @param {number} userId - User identifier
   * @returns {Promise<Object>} Confirmation with cooldown info
   * @throws {Error} If no active faction
   */
  async leaveFaction(userId) {
    logger.info(`User ${userId} attempting to leave faction`);

    const currentFaction = await this.factionRepository.getUserActiveFaction(userId);
    if (!currentFaction) {
      throw new Error('You are not currently in a faction');
    }

    const factionName = currentFaction.faction.name;
    const success = await this.factionRepository.leaveFaction(userId);

    if (!success) {
      throw new Error('Failed to leave faction');
    }

    logger.info(`User ${userId} left faction ${currentFaction.faction_id}`);

    return {
      message: `You have left ${factionName}`,
      left_faction: factionName,
      left_at: new Date(),
      cooldown_days: 30,
      can_join_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };
  }

  /**
   * Get user's faction history
   * @param {number} userId - User identifier
   * @returns {Promise<Array>} Membership history
   */
  async getUserFactionHistory(userId) {
    const history = await this.factionRepository.getUserFactionHistory(userId);
    
    return history.map(m => ({
      faction_id: m.faction_id,
      faction_name: m.faction.name,
      faction_color: m.faction.color,
      joined_at: m.joined_at,
      left_at: m.left_at,
      contribution_points: m.contribution_points,
      is_active: m.is_active
    }));
  }

  // ========================================
  // CONTROL ZONES
  // ========================================

  /**
   * Get all control zones with status
   * @returns {Promise<Array>} Zones with control progress
   */
  async getAllZones() {
    const zones = await this.factionRepository.getAllZones();
    
    return zones.map(zone => zone.getDisplayInfo());
  }

  /**
   * Get zone details by ID
   * @param {number} zoneId - Zone identifier
   * @returns {Promise<Object>} Zone details with control progress
   * @throws {Error} If zone not found
   */
  async getZoneDetails(zoneId) {
    const zone = await this.factionRepository.getZoneById(zoneId);
    if (!zone) {
      throw new Error(`Zone ${zoneId} not found`);
    }

    const controlProgress = await this.factionRepository.getZoneControlProgress(zoneId);

    return {
      ...zone.getDisplayInfo(),
      control_progress: controlProgress.map(cp => ({
        faction_id: cp.faction_id,
        faction_name: cp.faction.name,
        faction_color: cp.faction.color,
        control_points: cp.control_points,
        progress_percentage: cp.getProgressPercentage(),
        breakdown: cp.getBreakdown()
      }))
    };
  }

  /**
   * Get zone by coordinates
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {Promise<Object|null>} Zone at coordinates or null
   */
  async getZoneByCoordinates(x, y) {
    const zone = await this.factionRepository.getZoneByCoordinates(x, y);
    return zone ? zone.getDisplayInfo() : null;
  }

  // ========================================
  // CONTROL POINT CONTRIBUTIONS
  // ========================================

  /**
   * Add control points from building construction
   * Called by building service when construction completes
   * @param {number} userId - User identifier
   * @param {number} x - Building X coordinate
   * @param {number} y - Building Y coordinate
   * @param {number} points - Base points from building
   * @returns {Promise<Object|null>} Control points update or null
   */
  async contributeFromBuilding(userId, x, y, points) {
    const userFaction = await this.factionRepository.getUserActiveFaction(userId);
    if (!userFaction) return null; // No faction, no contribution

    const zone = await this.factionRepository.getZoneByCoordinates(x, y);
    if (!zone) return null; // Building outside control zones

    await this.factionRepository.addControlPoints(zone.id, userFaction.faction_id, points, 'building');
    await this.factionRepository.addUserContribution(userId, points);

    logger.info(`User ${userId} contributed ${points} building points to zone ${zone.id} for faction ${userFaction.faction_id}`);

    // Check if zone status changed
    await this.evaluateZoneControl(zone.id);

    return {
      zone_id: zone.id,
      zone_name: zone.name,
      faction_id: userFaction.faction_id,
      points_added: points,
      source: 'building'
    };
  }

  /**
   * Add control points from military training
   * @param {number} userId - User identifier
   * @param {number} cityX - City X coordinate
   * @param {number} cityY - City Y coordinate
   * @param {number} points - Base points from training
   * @returns {Promise<Object|null>} Control points update or null
   */
  async contributeFromMilitary(userId, cityX, cityY, points) {
    const userFaction = await this.factionRepository.getUserActiveFaction(userId);
    if (!userFaction) return null;

    const zone = await this.factionRepository.getZoneByCoordinates(cityX, cityY);
    if (!zone) return null;

    await this.factionRepository.addControlPoints(zone.id, userFaction.faction_id, points, 'military');
    await this.factionRepository.addUserContribution(userId, points);

    logger.info(`User ${userId} contributed ${points} military points to zone ${zone.id} for faction ${userFaction.faction_id}`);

    await this.evaluateZoneControl(zone.id);

    return {
      zone_id: zone.id,
      zone_name: zone.name,
      faction_id: userFaction.faction_id,
      points_added: points,
      source: 'military'
    };
  }

  /**
   * Add control points from successful attacks
   * @param {number} attackerId - Attacker user ID
   * @param {number} targetX - Target X coordinate
   * @param {number} targetY - Target Y coordinate
   * @param {number} points - Base points from attack
   * @returns {Promise<Object|null>} Control points update or null
   */
  async contributeFromAttack(attackerId, targetX, targetY, points) {
    const userFaction = await this.factionRepository.getUserActiveFaction(attackerId);
    if (!userFaction) return null;

    const zone = await this.factionRepository.getZoneByCoordinates(targetX, targetY);
    if (!zone) return null;

    await this.factionRepository.addControlPoints(zone.id, userFaction.faction_id, points, 'attack');
    await this.factionRepository.addUserContribution(attackerId, points);

    logger.info(`User ${attackerId} contributed ${points} attack points to zone ${zone.id} for faction ${userFaction.faction_id}`);

    await this.evaluateZoneControl(zone.id);

    return {
      zone_id: zone.id,
      zone_name: zone.name,
      faction_id: userFaction.faction_id,
      points_added: points,
      source: 'attack'
    };
  }

  /**
   * Add control points from trade activities
   * @param {number} userId - User identifier
   * @param {number} x - Trade location X
   * @param {number} y - Trade location Y
   * @param {number} points - Base points from trade
   * @returns {Promise<Object|null>} Control points update or null
   */
  async contributeFromTrade(userId, x, y, points) {
    const userFaction = await this.factionRepository.getUserActiveFaction(userId);
    if (!userFaction) return null;

    const zone = await this.factionRepository.getZoneByCoordinates(x, y);
    if (!zone) return null;

    await this.factionRepository.addControlPoints(zone.id, userFaction.faction_id, points, 'trade');
    await this.factionRepository.addUserContribution(userId, points);

    logger.info(`User ${userId} contributed ${points} trade points to zone ${zone.id} for faction ${userFaction.faction_id}`);

    await this.evaluateZoneControl(zone.id);

    return {
      zone_id: zone.id,
      zone_name: zone.name,
      faction_id: userFaction.faction_id,
      points_added: points,
      source: 'trade'
    };
  }

  // ========================================
  // ZONE CONTROL EVALUATION
  // ========================================

  /**
   * Evaluate zone control status and handle captures
   * Called after control points are added
   * @param {number} zoneId - Zone identifier
   * @returns {Promise<Object>} Zone status update
   */
  async evaluateZoneControl(zoneId) {
    const zone = await this.factionRepository.getZoneById(zoneId);
    if (!zone) {
      throw new Error(`Zone ${zoneId} not found`);
    }

    const controlProgress = await this.factionRepository.getZoneControlProgress(zoneId);
    const previousStatus = zone.status;
    const previousController = zone.current_controller;

    // Evaluate new status using zone helper
    const newStatus = zone.evaluateStatus();
    
    // Check for capture
    let captured = false;
    let newController = null;

    for (const cp of controlProgress) {
      if (cp.canCapture()) {
        // Faction has exceeded threshold
        newController = cp.faction_id;
        captured = true;
        break;
      }
    }

    if (captured && newController !== previousController) {
      await this.captureZone(zoneId, newController);
      
      logger.info(`Zone ${zoneId} (${zone.name}) captured by faction ${newController}`);

      return {
        zone_id: zoneId,
        zone_name: zone.name,
        status: 'controlled',
        controller: newController,
        event: 'capture',
        previous_controller: previousController
      };
    }

    // Status changed but no capture
    if (newStatus !== previousStatus) {
      await this.factionRepository.updateZoneController(zoneId, zone.current_controller, newStatus);
      
      logger.info(`Zone ${zoneId} (${zone.name}) status changed from ${previousStatus} to ${newStatus}`);

      return {
        zone_id: zoneId,
        zone_name: zone.name,
        status: newStatus,
        controller: zone.current_controller,
        event: 'status_change'
      };
    }

    return {
      zone_id: zoneId,
      zone_name: zone.name,
      status: zone.status,
      controller: zone.current_controller,
      event: 'no_change'
    };
  }

  /**
   * Capture a zone for a faction
   * @param {number} zoneId - Zone identifier
   * @param {string} factionId - Capturing faction
   * @returns {Promise<Object>} Capture details
   */
  async captureZone(zoneId, factionId) {
    // Update zone controller
    await this.factionRepository.updateZoneController(zoneId, factionId, 'controlled');

    // Reset other factions' control points
    await this.factionRepository.resetZoneControlPoints(zoneId, factionId);

    const zone = await this.factionRepository.getZoneById(zoneId);
    const faction = await this.factionRepository.getFactionById(factionId);

    logger.info(`Zone ${zoneId} (${zone.name}) captured by ${faction.name}`);

    // TODO: Broadcast capture event to all online users
    // TODO: Grant capture rewards to contributing faction members

    return {
      zone_id: zoneId,
      zone_name: zone.name,
      faction_id: factionId,
      faction_name: faction.name,
      bonuses: zone.bonuses,
      captured_at: new Date()
    };
  }

  // ========================================
  // BONUS APPLICATION (for integration with other services)
  // ========================================

  /**
   * Get active bonuses for a user (from faction + controlled zones)
   * @param {number} userId - User identifier
   * @returns {Promise<Object>} Active bonuses object
   */
  async getUserActiveBonuses(userId) {
    const userFaction = await this.factionRepository.getUserActiveFaction(userId);
    if (!userFaction) {
      return {}; // No faction = no bonuses
    }

    const faction = await this.factionRepository.getFactionById(userFaction.faction_id);
    const totalBonuses = faction.calculateTotalBonuses();

    return totalBonuses;
  }

  /**
   * Calculate effective bonus multiplier for a specific stat
   * @param {number} userId - User identifier
   * @param {string} statName - Stat name (e.g., 'defense_bonus', 'production_speed_bonus')
   * @returns {Promise<number>} Multiplier (1.0 = no bonus, 1.15 = +15%)
   */
  async getBonusMultiplier(userId, statName) {
    const bonuses = await this.getUserActiveBonuses(userId);
    const bonusValue = bonuses[statName] || 0;

    // Convert percentage to multiplier
    return 1 + bonusValue / 100;
  }
}

module.exports = FactionService;
