// questRules.js - Domain logic for quest system
// Contains business rules for quest assignment, validation, and rotation

/**
 * Quest system constants
 */
const QUEST_CONSTANTS = {
  // Daily quest reset time (UTC)
  DAILY_RESET_HOUR: 0, // Midnight UTC
  
  // Weekly quest reset day (0 = Sunday, 1 = Monday, etc.)
  WEEKLY_RESET_DAY: 1, // Monday
  WEEKLY_RESET_HOUR: 0, // Midnight UTC
  
  // Number of quests per player
  MAX_DAILY_QUESTS: 3,
  MAX_WEEKLY_QUESTS: 2,
  
  // Quest expiration times (in hours)
  DAILY_QUEST_DURATION: 24,
  WEEKLY_QUEST_DURATION: 168, // 7 days
};

/**
 * Quest type definitions
 */
const QUEST_TYPES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  ACHIEVEMENT: 'achievement'
};

const QUEST_CATEGORIES = {
  COMBAT: 'combat',
  ECONOMY: 'economy',
  BUILDINGS: 'buildings',
  RESEARCH: 'research',
  SOCIAL: 'social'
};

const QUEST_DIFFICULTIES = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
  EPIC: 'epic'
};

const QUEST_STATUS = {
  AVAILABLE: 'available',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CLAIMED: 'claimed'
};

const OBJECTIVE_TYPES = {
  COLLECT_RESOURCES: 'collect_resources',
  TRAIN_UNITS: 'train_units',
  WIN_BATTLES: 'win_battles',
  UPGRADE_BUILDING: 'upgrade_building',
  COMPLETE_RESEARCH: 'complete_research',
  COMPLETE_TRADES: 'complete_trades'
};

/**
 * Calculate next daily reset time
 * @returns {Date} Next daily reset timestamp
 */
function getNextDailyReset() {
  const now = new Date();
  const nextReset = new Date(now);
  
  // Set to next midnight UTC
  nextReset.setUTCHours(QUEST_CONSTANTS.DAILY_RESET_HOUR, 0, 0, 0);
  
  // If we're past today's reset, move to tomorrow
  if (nextReset <= now) {
    nextReset.setUTCDate(nextReset.getUTCDate() + 1);
  }
  
  return nextReset;
}

/**
 * Calculate next weekly reset time
 * @returns {Date} Next weekly reset timestamp
 */
function getNextWeeklyReset() {
  const now = new Date();
  const nextReset = new Date(now);
  
  // Set to next Monday midnight UTC
  nextReset.setUTCHours(QUEST_CONSTANTS.WEEKLY_RESET_HOUR, 0, 0, 0);
  
  const currentDay = nextReset.getUTCDay();
  const daysUntilMonday = (QUEST_CONSTANTS.WEEKLY_RESET_DAY + 7 - currentDay) % 7;
  
  if (daysUntilMonday === 0 && nextReset <= now) {
    // If it's Monday but past reset time, go to next Monday
    nextReset.setUTCDate(nextReset.getUTCDate() + 7);
  } else if (daysUntilMonday > 0) {
    nextReset.setUTCDate(nextReset.getUTCDate() + daysUntilMonday);
  }
  
  return nextReset;
}

/**
 * Check if a quest is available for a user
 * @param {Object} quest - Quest definition
 * @param {Object} user - User object
 * @returns {boolean} Whether quest is available
 */
function isQuestAvailableForUser(quest, user) {
  // Check if quest is active
  if (!quest.is_active) {
    return false;
  }
  
  // Check minimum level requirement
  if (quest.min_level > user.level) {
    return false;
  }
  
  return true;
}

/**
 * Filter quests by eligibility
 * @param {Array} quests - Array of quest definitions
 * @param {Object} user - User object
 * @param {Array} existingUserQuests - User's current quests
 * @returns {Array} Filtered available quests
 */
function filterEligibleQuests(quests, user, existingUserQuests = []) {
  const assignedQuestIds = new Set(existingUserQuests.map(uq => uq.quest_id));
  
  return quests.filter(quest => {
    // Quest not already assigned
    if (assignedQuestIds.has(quest.id)) {
      return false;
    }
    
    // Quest is available for user
    return isQuestAvailableForUser(quest, user);
  });
}

/**
 * Select random quests from available pool
 * @param {Array} availableQuests - Pool of eligible quests
 * @param {number} count - Number of quests to select
 * @returns {Array} Randomly selected quests
 */
function selectRandomQuests(availableQuests, count) {
  if (availableQuests.length <= count) {
    return availableQuests;
  }
  
  // Shuffle and take first N
  const shuffled = [...availableQuests].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Validate if quest objective is completed
 * @param {Object} userQuest - UserQuest instance
 * @param {Object} quest - Quest definition
 * @returns {boolean} Whether objective is completed
 */
function isQuestObjectiveCompleted(userQuest, quest) {
  return userQuest.progress >= quest.objective_target;
}

/**
 * Calculate quest rewards
 * @param {Object} quest - Quest definition
 * @returns {Object} Rewards object
 */
function calculateQuestRewards(quest) {
  return {
    or: quest.reward_or || 0,
    metal: quest.reward_metal || 0,
    carburant: quest.reward_carburant || 0,
    xp: quest.reward_xp || 0,
    items: quest.reward_items || null
  };
}

/**
 * Parse reward items JSON
 * @param {string|Array|null} rewardItems - Reward items (JSON string or array)
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
 * Check if quest has expired
 * @param {Object} userQuest - UserQuest instance
 * @returns {boolean} Whether quest has expired
 */
function isQuestExpired(userQuest) {
  if (!userQuest.expires_at) {
    return false;
  }
  
  return new Date(userQuest.expires_at) < new Date();
}

/**
 * Determine if quest should auto-start or require manual start
 * Daily and weekly quests auto-start, achievements require manual start
 * @param {string} questType - Quest type
 * @returns {boolean} Whether quest should auto-start
 */
function shouldAutoStartQuest(questType) {
  return questType === QUEST_TYPES.DAILY || questType === QUEST_TYPES.WEEKLY;
}

/**
 * Get quest progress percentage
 * @param {number} progress - Current progress
 * @param {number} target - Objective target
 * @returns {number} Progress percentage (0-100)
 */
function getQuestProgressPercentage(progress, target) {
  if (target === 0) return 0;
  return Math.min(100, Math.round((progress / target) * 100));
}

/**
 * Validate quest progression increment
 * @param {Object} userQuest - UserQuest instance
 * @param {number} increment - Progress increment
 * @returns {boolean} Whether increment is valid
 */
function isValidProgressIncrement(userQuest, increment) {
  // Must be positive
  if (increment <= 0) {
    return false;
  }
  
  // Quest must be in progress
  if (userQuest.status !== QUEST_STATUS.IN_PROGRESS) {
    return false;
  }
  
  // Quest must not be expired
  if (isQuestExpired(userQuest)) {
    return false;
  }
  
  return true;
}

module.exports = {
  QUEST_CONSTANTS,
  QUEST_TYPES,
  QUEST_CATEGORIES,
  QUEST_DIFFICULTIES,
  QUEST_STATUS,
  OBJECTIVE_TYPES,
  getNextDailyReset,
  getNextWeeklyReset,
  isQuestAvailableForUser,
  filterEligibleQuests,
  selectRandomQuests,
  isQuestObjectiveCompleted,
  calculateQuestRewards,
  parseRewardItems,
  isQuestExpired,
  shouldAutoStartQuest,
  getQuestProgressPercentage,
  isValidProgressIncrement
};
