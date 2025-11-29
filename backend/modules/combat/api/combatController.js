const { logger } = require('../../../utils/logger');

/**
 * CombatController - Gestion des combats et espionnage
 */
const combatController = ({ combatService }) => {
  /**
   * POST /api/v1/combat/attack
   * Lancer une attaque
   */
  const launchAttack = async (req, res) => {
    try {
      const userId = req.user.id;
      const result = await combatService.launchAttack(userId, req.body);

      logger.info(`Attaque lancée par user ${userId}`, { attackId: result.attackId });
      res.status(201).json(result);
    } catch (error) {
      logger.error('Erreur lancement attaque', { error: error.message });
      res.status(400).json({ message: error.message });
    }
  };

  /**
   * GET /api/v1/combat/attacks
   * Récupérer les attaques d'un utilisateur
   */
  const getUserAttacks = async (req, res) => {
    try {
      const userId = req.user.id;
      const { role, status, limit } = req.query;

      const attacks = await combatService.getUserAttacks(userId, { role, status, limit });
      res.json(attacks);
    } catch (error) {
      logger.error('Erreur récupération attaques', { error: error.message });
      res.status(500).json({ message: error.message });
    }
  };

  /**
   * POST /api/v1/combat/attack/:id/cancel
   * Annuler une attaque
   */
  const cancelAttack = async (req, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const result = await combatService.cancelAttack(userId, parseInt(id));
      logger.info(`Attaque ${id} annulée par user ${userId}`);
      res.json(result);
    } catch (error) {
      logger.error('Erreur annulation attaque', { error: error.message });
      res.status(400).json({ message: error.message });
    }
  };

  /**
   * GET /api/v1/combat/report/:attackId
   * Récupérer le rapport de combat
   */
  const getCombatReport = async (req, res) => {
    try {
      const { attackId } = req.params;
      const report = await combatService.getCombatReport(parseInt(attackId));

      if (!report) {
        return res.status(404).json({ message: 'Rapport introuvable' });
      }

      res.json(report);
    } catch (error) {
      logger.error('Erreur récupération rapport', { error: error.message });
      res.status(500).json({ message: error.message });
    }
  };

  /**
   * POST /api/v1/combat/spy
   * Lancer une mission d'espionnage
   */
  const launchSpyMission = async (req, res) => {
    try {
      const userId = req.user.id;
      const result = await combatService.launchSpyMission(userId, req.body);

      logger.info(`Mission espionnage lancée par user ${userId}`, { missionId: result.missionId });
      res.status(201).json(result);
    } catch (error) {
      logger.error('Erreur lancement espionnage', { error: error.message });
      res.status(400).json({ message: error.message });
    }
  };

  /**
   * GET /api/v1/combat/spy-missions
   * Récupérer les missions d'espionnage
   */
  const getUserSpyMissions = async (req, res) => {
    try {
      const userId = req.user.id;
      const { role, status, limit } = req.query;

      const missions = await combatService.getUserSpyMissions(userId, { role, status, limit });
      res.json(missions);
    } catch (error) {
      logger.error('Erreur récupération missions espionnage', { error: error.message });
      res.status(500).json({ message: error.message });
    }
  };

  return {
    launchAttack,
    getUserAttacks,
    cancelAttack,
    getCombatReport,
    launchSpyMission,
    getUserSpyMissions
  };
};

module.exports = combatController;
