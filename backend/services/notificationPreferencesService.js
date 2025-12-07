const { UserNotificationPreference } = require('../models');

const DEFAULT_PREFS = {
  emailEnabled: true,
  pushEnabled: true,
  inAppEnabled: true,
};

async function getPreferences(userId) {
  let prefs = await UserNotificationPreference.findOne({ where: { userId } });

  if (!prefs) {
    prefs = await UserNotificationPreference.create({ userId, ...DEFAULT_PREFS });
  }

  return prefs.toJSON();
}

async function updatePreferences(userId, updates) {
  const prefs = await UserNotificationPreference.findOne({ where: { userId } });

  if (!prefs) {
    return UserNotificationPreference.create({ userId, ...DEFAULT_PREFS, ...updates });
  }

  Object.assign(prefs, updates);
  await prefs.save();
  return prefs.toJSON();
}

module.exports = {
  getPreferences,
  updatePreferences,
};