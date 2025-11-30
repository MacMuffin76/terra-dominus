const { getLogger } = require('../utils/logger');
const protectionRules = require('../modules/protection/domain/protectionRules');
const User = require('../models/User');
const City = require('../models/City');

const logger = getLogger({ module: 'ProtectionController' });

/**
 * GET /api/protection/status
 * Get protection shield status for current user
 */
const getProtectionStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findByPk(userId, {
      attributes: ['id', 'username', 'protection_shield_until', 'attacks_sent_count']
    });

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    const cityCount = await City.count({ where: { user_id: userId } });

    const hasShield = protectionRules.hasActiveShield(user);
    const remainingTime = protectionRules.getRemainingShieldTime(user);
    const shieldCheck = protectionRules.shouldLoseShield(user, cityCount);

    res.json({
      hasActiveShield: hasShield,
      shieldExpiresAt: user.protection_shield_until,
      remainingTime,
      attacksSent: user.attacks_sent_count,
      maxAttacksBeforeShieldLoss: protectionRules.PROTECTION_CONFIG.MAX_ATTACKS_BEFORE_SHIELD_LOSS,
      cityCount,
      maxCitiesWithShield: protectionRules.PROTECTION_CONFIG.MAX_CITIES_WITH_SHIELD,
      shieldWarning: shieldCheck.shouldLoseShield ? shieldCheck.reason : null,
      dailyAttackLimit: protectionRules.PROTECTION_CONFIG.MAX_ATTACKS_PER_DAY,
      raidCooldownHours: protectionRules.PROTECTION_CONFIG.RAID_COOLDOWN_MS / 3600000
    });
  } catch (err) {
    (req.logger || logger).error({ err }, 'Error fetching protection status');
    res.status(500).json({ message: 'Erreur lors de la récupération du statut de protection' });
  }
};

/**
 * GET /api/protection/can-attack/:targetUserId
 * Check if current user can attack target user
 */
const canAttackTarget = async (req, res) => {
  try {
    const attackerId = req.user.id;
    const targetUserId = parseInt(req.params.targetUserId);

    if (isNaN(targetUserId)) {
      return res.status(400).json({ message: 'ID cible invalide' });
    }

    const attacker = await User.findByPk(attackerId);
    const target = await User.findByPk(targetUserId);

    if (!attacker || !target) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    const attackCheck = protectionRules.canAttack(attacker, target);

    res.json({
      canAttack: attackCheck.canAttack,
      reason: attackCheck.reason || null,
      attackerWarning: attackCheck.attackerWarning || null,
      targetHasShield: protectionRules.hasActiveShield(target),
      targetShieldExpires: target.protection_shield_until,
      attackerHasShield: protectionRules.hasActiveShield(attacker)
    });
  } catch (err) {
    (req.logger || logger).error({ err }, 'Error checking attack permission');
    res.status(500).json({ message: 'Erreur lors de la vérification des permissions d\'attaque' });
  }
};

module.exports = {
  getProtectionStatus,
  canAttackTarget,
};
