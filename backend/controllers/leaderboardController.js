const leaderboardService = require('../modules/leaderboard/application/LeaderboardService');
const LeaderboardService = leaderboardService.constructor;
const { logger } = require('../utils/logger');

/**
 * Contrôleur pour les leaderboards
 */
const leaderboardController = {
  /**
   * Récupère un leaderboard par catégorie
   * GET /api/v1/leaderboards/:category
   */
  async getLeaderboard(req, res) {
    try {
      const { category } = req.params;
      const limit = parseInt(req.query.limit) || 100;
      const offset = parseInt(req.query.offset) || 0;

      // Valider la catégorie
      const validCategories = Object.values(LeaderboardService.CATEGORIES);
      if (!validCategories.includes(category)) {
        return res.status(400).json({
          message: `Invalid category. Valid categories: ${validCategories.join(', ')}`
        });
      }

      // Valider limit et offset
      if (limit < 1 || limit > 500) {
        return res.status(400).json({ message: 'Limit must be between 1 and 500' });
      }

      if (offset < 0) {
        return res.status(400).json({ message: 'Offset must be >= 0' });
      }

      const leaderboard = await leaderboardService.getLeaderboard(category, limit, offset);

      res.json({
        category,
        entries: leaderboard,
        limit,
        offset,
        count: leaderboard.length
      });
    } catch (error) {
      logger.error('Error in getLeaderboard:', error);
      console.error('Full leaderboard error:', error);
      res.status(500).json({ message: 'Error fetching leaderboard', error: error.message });
    }
  },

  /**
   * Récupère la position de l'utilisateur connecté
   * GET /api/v1/leaderboards/:category/me
   */
  async getMyPosition(req, res) {
    try {
      const { category } = req.params;
      const userId = req.user.id;

      // Valider la catégorie
      const validCategories = Object.values(LeaderboardService.CATEGORIES);
      if (!validCategories.includes(category)) {
        return res.status(400).json({
          message: `Invalid category. Valid categories: ${validCategories.join(', ')}`
        });
      }

      const position = await leaderboardService.getUserPosition(userId, category);

      if (!position) {
        return res.status(404).json({
          message: 'User not found in this leaderboard'
        });
      }

      res.json(position);
    } catch (error) {
      logger.error('Error in getMyPosition:', error);
      res.status(500).json({ message: 'Error fetching user position', error: error.message });
    }
  },

  /**
   * Récupère toutes les positions de l'utilisateur connecté
   * GET /api/v1/leaderboards/me/all
   */
  async getAllMyPositions(req, res) {
    try {
      const userId = req.user.id;
      const categories = Object.values(LeaderboardService.CATEGORIES);

      const positions = {};
      
      for (const category of categories) {
        const position = await leaderboardService.getUserPosition(userId, category);
        if (position) {
          positions[category] = position;
        }
      }

      res.json(positions);
    } catch (error) {
      logger.error('Error in getAllMyPositions:', error);
      res.status(500).json({ message: 'Error fetching user positions', error: error.message });
    }
  },

  /**
   * Met à jour le score d'un utilisateur (admin uniquement ou automatique)
   * POST /api/v1/leaderboards/:category/update
   * Body: { userId, score }
   */
  async updateScore(req, res) {
    try {
      const { category } = req.params;
      const { userId, score } = req.body;

      // Validation
      if (!userId || score === undefined) {
        return res.status(400).json({ message: 'userId and score are required' });
      }

      if (typeof score !== 'number' || score < 0) {
        return res.status(400).json({ message: 'Score must be a positive number' });
      }

      const validCategories = Object.values(LeaderboardService.CATEGORIES);
      if (!validCategories.includes(category)) {
        return res.status(400).json({
          message: `Invalid category. Valid categories: ${validCategories.join(', ')}`
        });
      }

      const entry = await leaderboardService.updateScore(userId, category, score);
      const position = await leaderboardService.getUserPosition(userId, category);

      res.json({
        message: 'Score updated successfully',
        entry: position
      });
    } catch (error) {
      logger.error('Error in updateScore:', error);
      res.status(500).json({ message: 'Error updating score', error: error.message });
    }
  },

  /**
   * Incrémente le score d'un utilisateur
   * POST /api/v1/leaderboards/:category/increment
   * Body: { userId, amount }
   */
  async incrementScore(req, res) {
    try {
      const { category } = req.params;
      const { userId, amount } = req.body;

      // Validation
      if (!userId || amount === undefined) {
        return res.status(400).json({ message: 'userId and amount are required' });
      }

      if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ message: 'Amount must be a positive number' });
      }

      const validCategories = Object.values(LeaderboardService.CATEGORIES);
      if (!validCategories.includes(category)) {
        return res.status(400).json({
          message: `Invalid category. Valid categories: ${validCategories.join(', ')}`
        });
      }

      await leaderboardService.incrementScore(userId, category, amount);
      const position = await leaderboardService.getUserPosition(userId, category);

      res.json({
        message: 'Score incremented successfully',
        entry: position
      });
    } catch (error) {
      logger.error('Error in incrementScore:', error);
      res.status(500).json({ message: 'Error incrementing score', error: error.message });
    }
  },

  /**
   * Récupère les récompenses disponibles pour l'utilisateur
   * GET /api/v1/leaderboards/:category/rewards
   */
  async getMyRewards(req, res) {
    try {
      const { category } = req.params;
      const userId = req.user.id;
      const seasonId = req.query.season_id ? parseInt(req.query.season_id) : null;

      const validCategories = Object.values(LeaderboardService.CATEGORIES);
      if (!validCategories.includes(category)) {
        return res.status(400).json({
          message: `Invalid category. Valid categories: ${validCategories.join(', ')}`
        });
      }

      const rewards = await leaderboardService.getUserRewards(userId, category, seasonId);

      res.json(rewards);
    } catch (error) {
      logger.error('Error in getMyRewards:', error);
      res.status(500).json({ message: 'Error fetching rewards', error: error.message });
    }
  },

  /**
   * Réclame une récompense
   * POST /api/v1/leaderboards/rewards/:rewardId/claim
   */
  async claimReward(req, res) {
    try {
      const { rewardId } = req.params;
      const userId = req.user.id;

      if (!rewardId || isNaN(parseInt(rewardId))) {
        return res.status(400).json({ message: 'Invalid reward ID' });
      }

      const result = await leaderboardService.claimReward(userId, parseInt(rewardId));

      res.json(result);
    } catch (error) {
      logger.error('Error in claimReward:', error);
      
      if (error.message.includes('not found') || error.message.includes('not in leaderboard')) {
        return res.status(404).json({ message: error.message });
      }
      
      if (error.message.includes('not eligible') || error.message.includes('already claimed')) {
        return res.status(400).json({ message: error.message });
      }

      res.status(500).json({ message: 'Error claiming reward', error: error.message });
    }
  },

  /**
   * Recalcule les rangs (maintenance, admin uniquement)
   * POST /api/v1/leaderboards/:category/recalculate
   */
  async recalculateRanks(req, res) {
    try {
      const { category } = req.params;

      const validCategories = Object.values(LeaderboardService.CATEGORIES);
      if (!validCategories.includes(category)) {
        return res.status(400).json({
          message: `Invalid category. Valid categories: ${validCategories.join(', ')}`
        });
      }

      await leaderboardService.recalculateRanks(category);

      res.json({ message: `Ranks recalculated for ${category}` });
    } catch (error) {
      logger.error('Error in recalculateRanks:', error);
      res.status(500).json({ message: 'Error recalculating ranks', error: error.message });
    }
  }
};

module.exports = leaderboardController;
