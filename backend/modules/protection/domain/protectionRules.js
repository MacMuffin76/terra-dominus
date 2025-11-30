/**
 * Protection Shield Rules - Beginner Protection System
 * Inspired by OGame, Travian, and modern MMO protection mechanics
 */

const PROTECTION_CONFIG = {
  // Shield duration for new players
  SHIELD_DURATION_MS: 259200000, // 72 hours (3 days) in milliseconds
  
  // Conditions that remove shield
  MAX_ATTACKS_BEFORE_SHIELD_LOSS: 5, // Lose shield after 5 attacks sent
  MAX_CITIES_WITH_SHIELD: 2, // Lose shield if player has more than 2 cities
  
  // Cooldown between attacks on same target (prevent griefing)
  RAID_COOLDOWN_MS: 3600000, // 1 hour between raids on same target
  
  // Daily attack limits (prevent zerging)
  MAX_ATTACKS_PER_DAY: 20, // Max 20 attacks per day per player
};

/**
 * Check if a user has an active protection shield
 * @param {Object} user - User model instance
 * @returns {boolean} - True if shield is active
 */
function hasActiveShield(user) {
  if (!user.protection_shield_until) {
    return false;
  }
  
  const now = new Date();
  return now < new Date(user.protection_shield_until);
}

/**
 * Calculate shield expiration date for new player
 * @param {Date} registrationDate - User registration date
 * @returns {Date} - Shield expiration date
 */
function calculateShieldExpiration(registrationDate = new Date()) {
  const expiration = new Date(registrationDate);
  expiration.setTime(expiration.getTime() + PROTECTION_CONFIG.SHIELD_DURATION_MS);
  return expiration;
}

/**
 * Check if user should lose shield (aggressive behavior)
 * @param {Object} user - User model instance
 * @param {number} userCityCount - Number of cities owned by user
 * @returns {Object} - { shouldLoseShield: boolean, reason: string }
 */
function shouldLoseShield(user, userCityCount) {
  // Shield expired naturally
  if (!hasActiveShield(user)) {
    return { shouldLoseShield: true, reason: 'expired' };
  }
  
  // Too many attacks sent (aggressive player)
  if (user.attacks_sent_count >= PROTECTION_CONFIG.MAX_ATTACKS_BEFORE_SHIELD_LOSS) {
    return { 
      shouldLoseShield: true, 
      reason: `Too many attacks sent (${user.attacks_sent_count}/${PROTECTION_CONFIG.MAX_ATTACKS_BEFORE_SHIELD_LOSS})` 
    };
  }
  
  // Too many cities (no longer a beginner)
  if (userCityCount > PROTECTION_CONFIG.MAX_CITIES_WITH_SHIELD) {
    return { 
      shouldLoseShield: true, 
      reason: `Too many cities (${userCityCount}/${PROTECTION_CONFIG.MAX_CITIES_WITH_SHIELD})` 
    };
  }
  
  return { shouldLoseShield: false };
}

/**
 * Check if attacker can attack defender (shield rules)
 * @param {Object} attacker - Attacker user
 * @param {Object} defender - Defender user
 * @returns {Object} - { canAttack: boolean, reason: string }
 */
function canAttack(attacker, defender) {
  // Defender has active shield
  if (hasActiveShield(defender)) {
    const shieldExpiration = new Date(defender.protection_shield_until);
    const hoursRemaining = Math.ceil((shieldExpiration - new Date()) / 3600000);
    
    return {
      canAttack: false,
      reason: `Target is protected by beginner shield (expires in ${hoursRemaining}h)`
    };
  }
  
  // Attacker has shield and tries to attack (should lose shield)
  if (hasActiveShield(attacker)) {
    return {
      canAttack: true,
      attackerWarning: 'Your protection shield will be removed after this attack'
    };
  }
  
  return { canAttack: true };
}

/**
 * Get remaining shield time in human-readable format
 * @param {Object} user - User model instance
 * @returns {string|null} - Remaining time string or null
 */
function getRemainingShieldTime(user) {
  if (!hasActiveShield(user)) {
    return null;
  }
  
  const now = new Date();
  const expiration = new Date(user.protection_shield_until);
  const diffMs = expiration - now;
  
  const hours = Math.floor(diffMs / 3600000);
  const minutes = Math.floor((diffMs % 3600000) / 60000);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Check if attacker can raid specific target (cooldown check)
 * @param {Date|null} lastAttackTime - Last attack time on this target
 * @returns {Object} - { canAttack: boolean, reason?: string, cooldownRemaining?: number }
 */
function canRaidTarget(lastAttackTime) {
  if (!lastAttackTime) {
    return { canAttack: true };
  }
  
  const now = new Date();
  const timeSinceLastAttack = now - new Date(lastAttackTime);
  
  if (timeSinceLastAttack < PROTECTION_CONFIG.RAID_COOLDOWN_MS) {
    const cooldownRemaining = PROTECTION_CONFIG.RAID_COOLDOWN_MS - timeSinceLastAttack;
    const minutesRemaining = Math.ceil(cooldownRemaining / 60000);
    
    return {
      canAttack: false,
      reason: `Raid cooldown active. Wait ${minutesRemaining} minutes.`,
      cooldownRemaining
    };
  }
  
  return { canAttack: true };
}

/**
 * Check daily attack limit
 * @param {number} attacksTodayCount - Number of attacks sent today
 * @returns {Object} - { canAttack: boolean, reason?: string }
 */
function checkDailyAttackLimit(attacksTodayCount) {
  if (attacksTodayCount >= PROTECTION_CONFIG.MAX_ATTACKS_PER_DAY) {
    return {
      canAttack: false,
      reason: `Daily attack limit reached (${attacksTodayCount}/${PROTECTION_CONFIG.MAX_ATTACKS_PER_DAY})`
    };
  }
  
  return { canAttack: true };
}

module.exports = {
  PROTECTION_CONFIG,
  hasActiveShield,
  calculateShieldExpiration,
  shouldLoseShield,
  canAttack,
  getRemainingShieldTime,
  canRaidTarget,
  checkDailyAttackLimit,
};
