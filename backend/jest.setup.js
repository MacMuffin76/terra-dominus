/**
 * Configuration globale pour Jest
 * Exécuté avant chaque suite de tests
 */

// Charger les variables d'environnement de test AVANT tout
require('dotenv').config({ path: require('path').resolve(__dirname, '.env.test') });

// Configuration des variables d'environnement pour les tests
process.env.JWT_SECRET = 'test-secret-key-for-integration-tests-minimum-32-characters';
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Réduire le bruit dans les logs de tests

// Timeout global pour les tests (10 secondes)
jest.setTimeout(10000);

// Nettoyage global après tous les tests
afterAll(async () => {
  // Fermer la connexion Redis du TokenService
  try {
    const { getTokenService } = require('./services/TokenService');
    const tokenService = getTokenService();
    if (tokenService && tokenService.redis) {
      await tokenService.redis.quit();
    }
  } catch (error) {
    // Ignorer si le service n'existe pas
  }

  // Fermer toutes les connexions Sequelize
  try {
    const { sequelize } = require('./models');
    if (sequelize) {
      await sequelize.close();
    }
  } catch (error) {
    // Ignorer si Sequelize n'est pas initialisé
  }

  // Petit délai pour permettre aux connexions de se fermer proprement
  await new Promise(resolve => setTimeout(resolve, 100));
});
