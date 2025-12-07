/**
 * Frontend Logger Utility
 * Fournit une API de logging structuré pour le frontend
 * En production, peut être étendu pour envoyer les logs à un service externe (Sentry, LogRocket, etc.)
 */

import { trackEvent as sendAnalyticsEvent } from './analytics';

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Configuration des niveaux de log
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

// Niveau minimum de log (configurable via env)
const MIN_LOG_LEVEL = process.env.REACT_APP_LOG_LEVEL 
  ? LOG_LEVELS[process.env.REACT_APP_LOG_LEVEL.toUpperCase()] 
  : (isDevelopment ? LOG_LEVELS.DEBUG : LOG_LEVELS.WARN);

/**
 * Formate un message de log avec timestamp et contexte
 * @param {string} level - Niveau de log
 * @param {string} message - Message principal
 * @param {Object} context - Contexte additionnel
 * @returns {string} Message formaté
 */
function formatLogMessage(level, message, context = {}) {
  const timestamp = new Date().toISOString();
  const contextStr = Object.keys(context).length > 0 
    ? ` | ${JSON.stringify(context)}` 
    : '';
  
  return `[${timestamp}] [${level}] ${message}${contextStr}`;
}

/**
 * Envoie un log à un service externe (optionnel)
 * @param {string} level - Niveau de log
 * @param {string} message - Message
 * @param {Object} context - Contexte
 */
async function sendToExternalService(level, message, context) {
  // TODO: Intégrer avec Sentry, LogRocket, ou autre service
  // Exemple avec Sentry:
  // if (window.Sentry && level === 'ERROR') {
  //   window.Sentry.captureException(new Error(message), {
  //     extra: context
  //   });
  // }
}

/**
 * Logger class avec méthodes structurées
 */
class Logger {
  constructor(module = 'App') {
    this.module = module;
  }

  /**
   * Log de debug (développement uniquement)
   * @param {string} message - Message à logger
   * @param {Object} context - Contexte additionnel
   */
  debug(message, context = {}) {
    if (LOG_LEVELS.DEBUG < MIN_LOG_LEVEL) return;
    
    const fullContext = { ...context, module: this.module };
    const formatted = formatLogMessage('DEBUG', message, fullContext);
    
    if (isDevelopment) {
      console.debug(formatted);
    }
  }

  /**
   * Log informatif
   * @param {string} message - Message à logger
   * @param {Object} context - Contexte additionnel
   */
  info(message, context = {}) {
    if (LOG_LEVELS.INFO < MIN_LOG_LEVEL) return;
    
    const fullContext = { ...context, module: this.module };
    const formatted = formatLogMessage('INFO', message, fullContext);
    
    if (isDevelopment) {
      console.info(formatted);
    }
    
    if (isProduction) {
      sendToExternalService('INFO', message, fullContext);
    }
  }

  /**
   * Log d'avertissement
   * @param {string} message - Message à logger
   * @param {Object} context - Contexte additionnel
   */
  warn(message, context = {}) {
    if (LOG_LEVELS.WARN < MIN_LOG_LEVEL) return;
    
    const fullContext = { ...context, module: this.module };
    const formatted = formatLogMessage('WARN', message, fullContext);
    
    console.warn(formatted);
    
    if (isProduction) {
      sendToExternalService('WARN', message, fullContext);
    }
  }

  /**
   * Log d'erreur
   * @param {string} message - Message à logger
   * @param {Error|Object} error - Erreur ou contexte
   */
  error(message, error = {}) {
    if (LOG_LEVELS.ERROR < MIN_LOG_LEVEL) return;
    
    const context = error instanceof Error 
      ? { 
          errorMessage: error.message, 
          stack: error.stack,
          module: this.module 
        }
      : { ...error, module: this.module };
    
    const formatted = formatLogMessage('ERROR', message, context);
    
    console.error(formatted);
    
    if (isProduction) {
      sendToExternalService('ERROR', message, context);
    }
  }

  /**
   * Log d'événement utilisateur (analytics)
   * @param {string} eventName - Nom de l'événement
   * @param {Object} properties - Propriétés de l'événement
   */
  event(eventName, properties = {}) {
    const context = {
      event: eventName,
      ...properties,
      module: this.module,
      timestamp: Date.now()
    };
    
    if (isDevelopment) {
      console.log(`[EVENT] ${eventName}`, context);
    }
    
    sendAnalyticsEvent(eventName, context).catch(() => {
      // best effort, ignore errors
    });
  }
}

/**
 * Crée une instance de logger pour un module spécifique
 * @param {string} module - Nom du module
 * @returns {Logger}
 */
export function getLogger(module) {
  return new Logger(module);
}

/**
 * Logger par défaut pour l'application
 */
export const logger = new Logger('App');

/**
 * Hook React pour obtenir un logger dans un composant
 * @param {string} componentName - Nom du composant
 * @returns {Logger}
 */
export function useLogger(componentName) {
  return getLogger(componentName);
}

export default logger;
