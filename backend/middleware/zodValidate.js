const { z } = require('zod');
const { getLogger } = require('../utils/logger');

const logger = getLogger({ module: 'ZodValidation' });

/**
 * Middleware de validation Zod
 * Prend un schéma Zod et valide req.body, req.query, req.params
 */
function zodValidate(schema) {
  return async (req, res, next) => {
    try {
      // Valider l'ensemble de la requête
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params
      });
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn({ 
          errors: error.errors, 
          path: req.path,
          method: req.method 
        }, 'Validation Zod failed');
        
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Données invalides',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        });
      }
      
      // Erreur non-Zod, passer au error handler
      next(error);
    }
  };
}

/**
 * Handler d'erreur global pour les erreurs Zod non catchées
 */
function zodErrorHandler(err, req, res, next) {
  if (err instanceof z.ZodError) {
    logger.error({ err, path: req.path }, 'Unhandled Zod validation error');
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Données invalides',
      details: err.errors
    });
  }
  
  next(err);
}

module.exports = { zodValidate, zodErrorHandler };
