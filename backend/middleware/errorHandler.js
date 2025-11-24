const { getLogger } = require('../utils/logger');

function errorHandler(err, req, res, next) {
  const logger = req.logger || getLogger({ module: 'ErrorHandler' });
  logger.error({ err }, 'Unhandled error');

  const status = err.status || 500;
  const payload = err.expose
    ? { message: err.message }
    : { error: 'Erreur interne du serveur' };

  res.status(status).json(payload);
}

module.exports = errorHandler;