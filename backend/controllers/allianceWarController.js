/**
 * Alliance War Controller
 * Endpoints HTTP pour le système de guerres d'alliances
 */

const { getLogger } = require('../utils/logger');

const logger = getLogger('allianceWarController');

module.exports = ({ allianceWarService }) => {
  /**
   * GET /alliances/:allianceId/wars
   * Récupérer toutes les guerres d'une alliance
   */
  const getAllianceWars = async (req, res) => {
    try {
      const { allianceId } = req.params;
      const { status, limit = 20, offset = 0 } = req.query;

      const wars = await allianceWarService.getAllianceWars(
        parseInt(allianceId),
        req.user.id,
        { status, limit: parseInt(limit), offset: parseInt(offset) }
      );

      res.json({
        success: true,
        wars,
      });
    } catch (error) {
      logger.error('Failed to get alliance wars', { error: error.message });
      res.status(error.message.includes('member') ? 403 : 500).json({
        success: false,
        message: error.message,
      });
    }
  };

  /**
   * POST /alliances/:allianceId/wars/declare
   * Déclarer la guerre à une autre alliance
   */
  const declareWar = async (req, res) => {
    try {
      const { allianceId } = req.params;
      const { defenderAllianceId, warGoal } = req.body;

      if (!defenderAllianceId) {
        return res.status(400).json({
          success: false,
          message: 'defenderAllianceId is required',
        });
      }

      const war = await allianceWarService.declareWar(
        parseInt(allianceId),
        parseInt(defenderAllianceId),
        req.user.id,
        warGoal
      );

      res.status(201).json({
        success: true,
        message: 'War declared successfully',
        war,
      });
    } catch (error) {
      logger.error('Failed to declare war', { error: error.message });

      let statusCode = 500;
      if (error.message.includes('leader')) statusCode = 403;
      else if (error.message.includes('found') || error.message.includes('already')) statusCode = 400;

      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  };

  /**
   * GET /wars/:warId
   * Obtenir les détails d'une guerre
   */
  const getWarDetails = async (req, res) => {
    try {
      const { warId } = req.params;

      const war = await allianceWarService.getWarDetails(parseInt(warId), req.user.id);

      res.json({
        success: true,
        war,
      });
    } catch (error) {
      logger.error('Failed to get war details', { error: error.message });
      res.status(error.message.includes('member') ? 403 : 404).json({
        success: false,
        message: error.message,
      });
    }
  };

  /**
   * GET /wars/:warId/statistics
   * Obtenir les statistiques d'une guerre
   */
  const getWarStatistics = async (req, res) => {
    try {
      const { warId } = req.params;

      const statistics = await allianceWarService.getWarStatistics(parseInt(warId), req.user.id);

      res.json({
        success: true,
        ...statistics,
      });
    } catch (error) {
      logger.error('Failed to get war statistics', { error: error.message });
      res.status(error.message.includes('member') ? 403 : 404).json({
        success: false,
        message: error.message,
      });
    }
  };

  /**
   * POST /wars/:warId/battles
   * Enregistrer un combat dans une guerre
   */
  const recordBattle = async (req, res) => {
    try {
      const { warId } = req.params;
      const battleData = req.body;

      // Validation des données de bataille
      if (!battleData.attackerUserId || !battleData.defenderUserId || !battleData.outcome) {
        return res.status(400).json({
          success: false,
          message: 'attackerUserId, defenderUserId, and outcome are required',
        });
      }

      if (!['attacker_victory', 'defender_victory', 'draw'].includes(battleData.outcome)) {
        return res.status(400).json({
          success: false,
          message: 'outcome must be attacker_victory, defender_victory, or draw',
        });
      }

      const result = await allianceWarService.recordBattle(parseInt(warId), battleData);

      res.status(201).json({
        success: true,
        message: 'Battle recorded successfully',
        battle: result.battle,
        updatedWar: result.updatedWar,
      });
    } catch (error) {
      logger.error('Failed to record battle', { error: error.message });

      let statusCode = 500;
      if (error.message.includes('not active')) statusCode = 400;
      else if (error.message.includes('member')) statusCode = 403;

      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  };

  /**
   * GET /wars/:warId/battles
   * Récupérer les batailles d'une guerre
   */
  const getWarBattles = async (req, res) => {
    try {
      const { warId } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      const battles = await allianceWarService.getWarBattles(
        parseInt(warId),
        req.user.id,
        { limit: parseInt(limit), offset: parseInt(offset) }
      );

      res.json({
        success: true,
        battles,
      });
    } catch (error) {
      logger.error('Failed to get war battles', { error: error.message });
      res.status(error.message.includes('member') ? 403 : 404).json({
        success: false,
        message: error.message,
      });
    }
  };

  /**
   * POST /wars/:warId/ceasefire/propose
   * Proposer un cessez-le-feu
   */
  const proposeCeasefire = async (req, res) => {
    try {
      const { warId } = req.params;
      const { terms } = req.body;

      const war = await allianceWarService.proposeCeasefire(parseInt(warId), req.user.id, terms);

      res.json({
        success: true,
        message: 'Ceasefire proposal submitted',
        war,
      });
    } catch (error) {
      logger.error('Failed to propose ceasefire', { error: error.message });

      let statusCode = 500;
      if (error.message.includes('leader')) statusCode = 403;
      else if (error.message.includes('active')) statusCode = 400;

      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  };

  /**
   * POST /wars/:warId/ceasefire/respond
   * Répondre à une proposition de cessez-le-feu
   */
  const respondToCeasefire = async (req, res) => {
    try {
      const { warId } = req.params;
      const { accepted } = req.body;

      if (typeof accepted !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'accepted (boolean) is required',
        });
      }

      const war = await allianceWarService.respondToCeasefire(parseInt(warId), req.user.id, accepted);

      res.json({
        success: true,
        message: accepted ? 'Ceasefire accepted' : 'Ceasefire rejected',
        war,
      });
    } catch (error) {
      logger.error('Failed to respond to ceasefire', { error: error.message });

      let statusCode = 500;
      if (error.message.includes('leader')) statusCode = 403;
      else if (error.message.includes('proposal')) statusCode = 400;

      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  };

  /**
   * POST /wars/:warId/end
   * Terminer une guerre
   */
  const endWar = async (req, res) => {
    try {
      const { warId } = req.params;
      const { winnerAllianceId, warTerms } = req.body;

      if (!winnerAllianceId) {
        return res.status(400).json({
          success: false,
          message: 'winnerAllianceId is required',
        });
      }

      const war = await allianceWarService.endWar(
        parseInt(warId),
        req.user.id,
        parseInt(winnerAllianceId),
        warTerms || {}
      );

      res.json({
        success: true,
        message: 'War ended successfully',
        war,
      });
    } catch (error) {
      logger.error('Failed to end war', { error: error.message });

      let statusCode = 500;
      if (error.message.includes('leader')) statusCode = 403;
      else if (error.message.includes('ended') || error.message.includes('Winner')) statusCode = 400;

      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  };

  /**
   * GET /wars/active
   * Récupérer toutes les guerres actives (global)
   */
  const getActiveWars = async (req, res) => {
    try {
      const { limit = 10, offset = 0 } = req.query;

      const wars = await allianceWarService.getActiveWars({
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      res.json({
        success: true,
        wars,
      });
    } catch (error) {
      logger.error('Failed to get active wars', { error: error.message });
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

  /**
   * GET /wars/check/:alliance1Id/:alliance2Id
   * Vérifier si deux alliances sont en guerre
   */
  const checkWarStatus = async (req, res) => {
    try {
      const { alliance1Id, alliance2Id } = req.params;

      const atWar = await allianceWarService.isAtWar(parseInt(alliance1Id), parseInt(alliance2Id));

      res.json({
        success: true,
        atWar,
      });
    } catch (error) {
      logger.error('Failed to check war status', { error: error.message });
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

  return {
    getAllianceWars,
    declareWar,
    getWarDetails,
    getWarStatistics,
    recordBattle,
    getWarBattles,
    proposeCeasefire,
    respondToCeasefire,
    endWar,
    getActiveWars,
    checkWarStatus,
  };
};
