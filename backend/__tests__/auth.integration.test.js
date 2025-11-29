const request = require('supertest');

// Configurer l'environnement de test AVANT tout import
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-integration-tests-minimum-32-characters';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const { getTokenService } = require('../services/TokenService');

// Ce test nécessite supertest
// Installer avec: npm install --save-dev supertest

describe('Authentication Integration Tests', () => {
  let app;
  let server;
  let tokenService;

  beforeAll(async () => {
    // Variables déjà configurées au-dessus
    
    const createApp = require('../app');
    const createContainer = require('../container');
    const container = createContainer();
    
    app = createApp(container);
    tokenService = getTokenService();
  }, 15000);

  afterAll(async () => {
    // Nettoyer
    if (tokenService) {
      await tokenService.close();
    }
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  describe('POST /api/v1/auth/register', () => {
    it('devrait créer un nouvel utilisateur et retourner des tokens', async () => {
      const userData = {
        username: `testuser_${Date.now()}`,
        email: `test${Date.now()}@example.com`,
        password: 'testpassword123'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.username).toBe(userData.username);
      expect(response.body.user.email).toBe(userData.email);
    });

    it('devrait rejeter un username déjà existant', async () => {
      const userData = {
        username: 'duplicateuser',
        email: 'duplicate1@example.com',
        password: 'testpassword123'
      };

      // Deuxième inscription avec le même username (premier déjà créé dans beforeAll si besoin)
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400); // L'API retourne 400 pour les duplicatas

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('existant');
    });

    it('devrait avoir des headers de rate limiting', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: `ratelimit_${Date.now()}`,
          email: `ratelimit_${Date.now()}@example.com`,
          password: 'testpass'
        });

      // Vérifier que les headers rate limit sont présents
      expect(response.headers).toHaveProperty('ratelimit-limit');
      expect(response.headers).toHaveProperty('ratelimit-remaining');
      expect(parseInt(response.headers['ratelimit-limit'])).toBeGreaterThan(0);
    }, 10000);
  });

  describe('POST /api/v1/auth/login', () => {
    const testUser = {
      username: `logintest_${Date.now()}`,
      email: `logintest${Date.now()}@example.com`,
      password: 'testpassword123'
    };

    beforeAll(async () => {
      // Créer un utilisateur de test
      await request(app)
        .post('/api/v1/auth/register')
        .send(testUser);
    }, 15000);

    it('devrait connecter un utilisateur avec des identifiants valides', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
    });

    it('devrait rejeter des identifiants invalides', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: testUser.username,
          password: 'wrongpassword'
        })
        .expect(400); // Bad Request pour credentials invalides

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    let authToken;
    const testUser = {
      username: `logouttest_${Date.now()}`,
      email: `logouttest${Date.now()}@example.com`,
      password: 'testpassword123'
    };

    beforeAll(async () => {
      // Créer et connecter un utilisateur
      await request(app)
        .post('/api/v1/auth/register')
        .send(testUser);

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password
        });

      authToken = loginResponse.body.token;
    }, 15000);

    it('devrait déconnecter un utilisateur et révoquer le token', async () => {
      // Logout
      await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Vérifier que le token est blacklisté
      const isBlacklisted = await tokenService.isTokenBlacklisted(authToken);
      expect(isBlacklisted).toBe(true);
    });

    it('devrait rejeter les requêtes avec un token révoqué', async () => {
      const newUser = {
        username: `revokedtest_${Date.now()}`,
        email: `revokedtest${Date.now()}@example.com`,
        password: 'testpassword123'
      };

      // Créer et connecter
      await request(app)
        .post('/api/v1/auth/register')
        .send(newUser);

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: newUser.username,
          password: newUser.password
        });

      const token = loginResponse.body.token;

      // Logout pour révoquer le token
      await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Tenter d'utiliser le token révoqué
      const response = await request(app)
        .get('/api/v1/dashboard')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);

      expect(response.body.message).toMatch(/révoqué|revoked/i);
    });

    it('devrait échouer sans token d\'authentification', async () => {
      await request(app)
        .post('/api/v1/auth/logout')
        .expect(401);
    });
  });

  describe('Validation Zod Integration', () => {
    it('devrait rejeter un register avec un email invalide', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'testuser',
          email: 'invalid-email', // Email invalide
          password: 'testpass'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      // L'erreur peut être "Validation Error" ou "Bad Request" selon le middleware
      expect(response.body.error).toMatch(/Validation|Bad Request/);
    });

    it('devrait rejeter un login sans password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'testuser'
          // password manquant
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    let refreshToken;
    const testUser = {
      username: `refreshtest_${Date.now()}`,
      email: `refreshtest${Date.now()}@example.com`,
      password: 'testpassword123'
    };

    beforeAll(async () => {
      // Créer et connecter
      await request(app)
        .post('/api/v1/auth/register')
        .send(testUser);

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password
        });

      refreshToken = loginResponse.body.refreshToken;
    }, 15000);

    it('devrait renouveler les tokens avec un refresh token valide', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.refreshToken).not.toBe(refreshToken); // Nouveau refresh token
    });

    it('devrait rejeter un refresh token invalide', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid.token.here' })
        .expect(401); // Unauthorized pour token invalide

      expect(response.body).toHaveProperty('message');
    });
  });
});
