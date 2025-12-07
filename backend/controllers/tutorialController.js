const { getLogger } = require('../utils/logger');
const { getAnalyticsService } = require('../services/analyticsService');

const logger = getLogger({ module: 'TutorialController' });
const analyticsService = getAnalyticsService();

const createTutorialController = ({ tutorialService }) => {
  /**
   * GET /api/tutorial/progress
   * Get current user's tutorial progress
   */
  const getProgress = async (req, res) => {
    try {
      const userId = req.user.id;
      const progress = await tutorialService.getProgress(userId);
      res.json(progress);
    } catch (error) {
      (req.logger || logger).error({ err: error }, 'Error fetching tutorial progress');
      res.status(500).json({ message: 'Erreur lors de la récupération de la progression du tutoriel' });
    }
  };

  /**
   * POST /api/tutorial/complete-step
   * Complete a tutorial step
   */
  const completeStep = async (req, res) => {
    try {
      const userId = req.user.id;
      const { stepId, actionData } = req.body;

      if (!stepId) {
        return res.status(400).json({ message: 'stepId requis' });
      }

      const result = await tutorialService.completeStep(userId, stepId, actionData);

      (req.logger || logger).audit({ userId, stepId }, 'Tutorial step completed');
      analyticsService.trackEvent({
        userId,
        eventName: 'tutorial_step_completed',
        properties: {
          stepId,
          completion: result?.completionPercentage,
        },
        consent: { status: req.get('x-analytics-consent') },
      });
      
      (req.logger || logger).audit({ userId, stepId }, 'Tutorial step completed');
      res.json(result);
    } catch (error) {
      (req.logger || logger).error({ err: error }, 'Error completing tutorial step');
      res.status(500).json({ message: error.message || 'Erreur lors de la complétion de l\'étape' });
    }
  };

  /**
   * POST /api/tutorial/skip
   * Skip tutorial
   */
  const skipTutorial = async (req, res) => {
    try {
      const userId = req.user.id;
      const progress = await tutorialService.skipTutorial(userId);
      
      (req.logger || logger).audit({ userId }, 'Tutorial skipped');
      res.json({ progress, message: 'Tutoriel ignoré' });
    } catch (error) {
      (req.logger || logger).error({ err: error }, 'Error skipping tutorial');
      res.status(500).json({ message: error.message || 'Erreur lors de l\'ignorance du tutoriel' });
    }
  };

  /**
   * POST /api/tutorial/reset
   * Reset tutorial (for replay)
   */
  const resetTutorial = async (req, res) => {
    try {
      const userId = req.user.id;
      const progress = await tutorialService.resetTutorial(userId);
      
      (req.logger || logger).audit({ userId }, 'Tutorial reset');
      res.json({ progress, message: 'Tutoriel réinitialisé' });
    } catch (error) {
      (req.logger || logger).error({ err: error }, 'Error resetting tutorial');
      res.status(500).json({ message: error.message || 'Erreur lors de la réinitialisation du tutoriel' });
    }
  };

  /**
   * GET /api/tutorial/statistics
   * Get tutorial statistics (admin only)
   */
  const getStatistics = async (req, res) => {
    try {
      const stats = await tutorialService.getStatistics();
      res.json(stats);
    } catch (error) {
      (req.logger || logger).error({ err: error }, 'Error fetching tutorial statistics');
      res.status(500).json({ message: 'Erreur lors de la récupération des statistiques' });
    }
  };

  return {
    getProgress,
    completeStep,
    skipTutorial,
    resetTutorial,
    getStatistics,
  };
};

module.exports = createTutorialController;
