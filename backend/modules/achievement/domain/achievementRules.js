// achievementRules.js - Domain logic for achievement system

/**
 * Achievement tiers and their properties
 */
const ACHIEVEMENT_TIERS = {
  BRONZE: 'bronze',
  SILVER: 'silver',
  GOLD: 'gold',
  PLATINUM: 'platinum',
  DIAMOND: 'diamond'
};

const TIER_PROPERTIES = {
  bronze: { color: '#cd7f32', multiplier: 1, minPoints: 10 },
  silver: { color: '#c0c0c0', multiplier: 2, minPoints: 20 },
  gold: { color: '#ffd700', multiplier: 3, minPoints: 40 },
  platinum: { color: '#e5e4e2', multiplier: 5, minPoints: 80 },
  diamond: { color: '#b9f2ff', multiplier: 10, minPoints: 150 }
};

/**
 * Achievement categories
 */
const ACHIEVEMENT_CATEGORIES = {
  COMBAT: 'combat',
  ECONOMY: 'economy',
  BUILDINGS: 'buildings',
  RESEARCH: 'research',
  SOCIAL: 'social',
  EXPLORATION: 'exploration',
  GENERAL: 'general'
};

/**
 * Objective types that can trigger achievement progress
 */
const OBJECTIVE_TYPES = {
  // Combat
  TOTAL_BATTLES_WON: 'total_battles_won',
  TOTAL_BATTLES_LOST: 'total_battles_lost',
  TOTAL_UNITS_KILLED: 'total_units_killed',
  
  // Economy
  TOTAL_GOLD_COLLECTED: 'total_gold_collected',
  TOTAL_METAL_COLLECTED: 'total_metal_collected',
  TOTAL_FUEL_COLLECTED: 'total_fuel_collected',
  
  // Buildings
  TOTAL_BUILDINGS_BUILT: 'total_buildings_built',
  TOTAL_BUILDINGS_UPGRADED: 'total_buildings_upgraded',
  MAX_BUILDING_LEVEL: 'max_building_level',
  
  // Research
  TOTAL_RESEARCH_COMPLETED: 'total_research_completed',
  
  // Social
  TOTAL_TRADES_COMPLETED: 'total_trades_completed',
  ALLIANCE_CREATED: 'alliance_created',
  ALLIANCE_MEMBERS: 'alliance_members',
  
  // Exploration
  TOTAL_TILES_EXPLORED: 'total_tiles_explored',
  TOTAL_COLONIES: 'total_colonies',
  
  // General
  PLAYER_LEVEL: 'player_level',
  TOTAL_QUESTS_COMPLETED: 'total_quests_completed',
  CONSECUTIVE_LOGIN_DAYS: 'consecutive_login_days',
  
  // Secret
  SECRET_LUCKY_SEVEN: 'secret_lucky_seven',
};

/**
 * Check if an achievement is unlocked
 * @param {Object} userAchievement - UserAchievement instance
 * @param {Object} achievement - Achievement definition
 * @returns {boolean} Whether achievement is unlocked
 */
function isAchievementUnlocked(userAchievement, achievement) {
  return userAchievement.progress >= achievement.objective_target;
}

/**
 * Calculate achievement rewards
 * @param {Object} achievement - Achievement definition
 * @returns {Object} Rewards object
 */
function calculateAchievementRewards(achievement) {
  return {
    or: achievement.reward_or || 0,
    metal: achievement.reward_metal || 0,
    carburant: achievement.reward_carburant || 0,
    xp: achievement.reward_xp || 0,
    items: achievement.reward_items || null,
    title: achievement.reward_title || null,
    points: achievement.points || 0
  };
}

/**
 * Parse reward items JSON
 * @param {string|Array|null} rewardItems - Reward items
 * @returns {Array} Parsed items array
 */
function parseRewardItems(rewardItems) {
  if (!rewardItems) {
    return [];
  }
  
  if (typeof rewardItems === 'string') {
    try {
      return JSON.parse(rewardItems);
    } catch (err) {
      console.error('Failed to parse reward items:', err);
      return [];
    }
  }
  
  return Array.isArray(rewardItems) ? rewardItems : [];
}

/**
 * Get achievement progress percentage
 * @param {number} progress - Current progress
 * @param {number} target - Objective target
 * @returns {number} Progress percentage (0-100)
 */
function getAchievementProgressPercentage(progress, target) {
  if (target === 0) return 100;
  return Math.min(100, Math.round((progress / target) * 100));
}

/**
 * Check if achievement should be displayed (secret achievements are hidden until unlocked)
 * @param {Object} achievement - Achievement definition
 * @param {boolean} isUnlocked - Whether user has unlocked it
 * @returns {boolean} Whether to display achievement
 */
function shouldDisplayAchievement(achievement, isUnlocked) {
  if (!achievement.is_secret) return true;
  return isUnlocked;
}

/**
 * Get masked title/description for secret achievements
 * @param {Object} achievement - Achievement definition
 * @returns {Object} Masked achievement info
 */
function getMaskedAchievementInfo(achievement) {
  return {
    title: '???',
    description: achievement.description || 'Débloquer ce succès secret',
    icon: '🔒'
  };
}

/**
 * Calculate total achievement points for user
 * @param {Array} unlockedAchievements - Array of unlocked achievements
 * @returns {number} Total points
 */
function calculateTotalPoints(unlockedAchievements) {
  return unlockedAchievements.reduce((total, ua) => {
    return total + (ua.achievement?.points || 0);
  }, 0);
}

/**
 * Get achievement tier info
 * @param {string} tier - Tier name
 * @returns {Object} Tier properties
 */
function getTierInfo(tier) {
  return TIER_PROPERTIES[tier] || TIER_PROPERTIES.bronze;
}

/**
 * Sort achievements by tier and category
 * @param {Array} achievements - Array of achievements
 * @returns {Array} Sorted achievements
 */
function sortAchievements(achievements) {
  const tierOrder = ['diamond', 'platinum', 'gold', 'silver', 'bronze'];
  
  return achievements.sort((a, b) => {
    // First sort by tier (highest to lowest)
    const tierA = tierOrder.indexOf(a.tier);
    const tierB = tierOrder.indexOf(b.tier);
    if (tierA !== tierB) return tierA - tierB;
    
    // Then by category
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category);
    }
    
    // Then by points (highest to lowest)
    return (b.points || 0) - (a.points || 0);
  });
}

/**
 * Filter achievements by category
 * @param {Array} achievements - Array of achievements
 * @param {string} category - Category to filter by
 * @returns {Array} Filtered achievements
 */
function filterByCategory(achievements, category) {
  if (!category || category === 'all') return achievements;
  return achievements.filter(a => a.category === category);
}

/**
 * Filter achievements by tier
 * @param {Array} achievements - Array of achievements
 * @param {string} tier - Tier to filter by
 * @returns {Array} Filtered achievements
 */
function filterByTier(achievements, tier) {
  if (!tier || tier === 'all') return achievements;
  return achievements.filter(a => a.tier === tier);
}

/**
 * Get achievements grouped by category
 * @param {Array} achievements - Array of achievements
 * @returns {Object} Achievements grouped by category
 */
function groupByCategory(achievements) {
  return achievements.reduce((groups, achievement) => {
    const category = achievement.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(achievement);
    return groups;
  }, {});
}

/**
 * Calculate user achievement statistics
 * @param {Array} userAchievements - Array of user achievements
 * @returns {Object} Statistics
 */
function calculateUserStats(userAchievements) {
  const stats = {
    total: userAchievements.length,
    unlocked: 0,
    claimed: 0,
    locked: 0,
    totalPoints: 0,
    byTier: {
      bronze: 0,
      silver: 0,
      gold: 0,
      platinum: 0,
      diamond: 0
    },
    byCategory: {}
  };

  userAchievements.forEach(ua => {
    if (ua.unlocked_at) {
      stats.unlocked++;
      stats.totalPoints += ua.achievement?.points || 0;
      
      if (ua.achievement?.tier) {
        stats.byTier[ua.achievement.tier]++;
      }
      
      if (ua.claimed_at) {
        stats.claimed++;
      }
    } else {
      stats.locked++;
    }
    
    const category = ua.achievement?.category;
    if (category) {
      stats.byCategory[category] = (stats.byCategory[category] || 0) + (ua.unlocked_at ? 1 : 0);
    }
  });

  return stats;
}

module.exports = {
  ACHIEVEMENT_TIERS,
  TIER_PROPERTIES,
  ACHIEVEMENT_CATEGORIES,
  OBJECTIVE_TYPES,
  isAchievementUnlocked,
  calculateAchievementRewards,
  parseRewardItems,
  getAchievementProgressPercentage,
  shouldDisplayAchievement,
  getMaskedAchievementInfo,
  calculateTotalPoints,
  getTierInfo,
  sortAchievements,
  filterByCategory,
  filterByTier,
  groupByCategory,
  calculateUserStats
};
