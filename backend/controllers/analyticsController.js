const { getAnalyticsService } = require('../services/analyticsService');
const { getLogger } = require('../utils/logger');

const analyticsService = getAnalyticsService();
const logger = getLogger({ module: 'analytics-controller' });

const allowedEvents = analyticsService.allowedEvents || [];

const analyticsController = {
  track: async (req, res) => {
    const { eventName, properties = {}, userProperties = {}, anonymousId } = req.body || {};
    const userId = req.user?.id;
    const consent = {
      status: req.get('x-analytics-consent'),
      optOut: req.get('x-analytics-opt-out') === 'true',
    };

    if (!eventName) {
      return res.status(400).json({ message: 'eventName requis' });
    }

    if (allowedEvents.length && !allowedEvents.includes(eventName)) {
      return res.status(400).json({ message: 'Événement non autorisé', eventName });
    }

    try {
      const result = await analyticsService.trackEvent({
        userId,
        anonymousId,
        eventName,
        properties: { ...properties, request_path: req.originalUrl },
        userProperties,
        consent,
      });

      res.status(202).json({ success: true, result });
    } catch (error) {
      logger.error({ err: error, eventName, userId }, 'Analytics track failed');
      res.status(500).json({ message: 'Erreur lors de l\'envoi analytics' });
    }
  },
};

module.exports = analyticsController;