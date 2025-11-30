const express = require('express');
const leaderboardController = require('../controllers/leaderboardController');
const { protect } = require('../middleware/authMiddleware');

/**
 * Routes pour les leaderboards
 */
function createLeaderboardRouter() {
  const router = express.Router();

  // Toutes les routes nécessitent l'authentification
  router.use(protect);

  // GET /api/v1/leaderboards/me/all - Toutes les positions de l'utilisateur
  router.get('/me/all', leaderboardController.getAllMyPositions);

  // GET /api/v1/leaderboards/:category - Récupérer un leaderboard
  router.get('/:category', leaderboardController.getLeaderboard);

  // GET /api/v1/leaderboards/:category/me - Position de l'utilisateur
  router.get('/:category/me', leaderboardController.getMyPosition);

  // GET /api/v1/leaderboards/:category/rewards - Récompenses disponibles
  router.get('/:category/rewards', leaderboardController.getMyRewards);

  // POST /api/v1/leaderboards/:category/update - Mettre à jour le score (système interne)
  router.post('/:category/update', leaderboardController.updateScore);

  // POST /api/v1/leaderboards/:category/increment - Incrémenter le score (système interne)
  router.post('/:category/increment', leaderboardController.incrementScore);

  // POST /api/v1/leaderboards/rewards/:rewardId/claim - Réclamer une récompense
  router.post('/rewards/:rewardId/claim', leaderboardController.claimReward);

  // POST /api/v1/leaderboards/:category/recalculate - Recalculer les rangs (admin/maintenance)
  router.post('/:category/recalculate', leaderboardController.recalculateRanks);

  return router;
}

module.exports = createLeaderboardRouter;
