/**
 * Configuration globale pour Jest
 * Exécuté avant chaque suite de tests
 */

// Configuration des variables d'environnement pour les tests
process.env.JWT_SECRET = 'test-secret-key-for-integration-tests-minimum-32-characters';
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Réduire le bruit dans les logs de tests

// Timeout global pour les tests (10 secondes)
jest.setTimeout(10000);
