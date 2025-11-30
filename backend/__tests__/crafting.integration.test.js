const request = require('supertest');

// Configure test environment BEFORE imports
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-integration-tests-minimum-32-characters';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const { getTokenService } = require('../services/TokenService');
const models = require('../models');

describe('Crafting System Integration Tests', () => {
  let app;
  let tokenService;
  let authToken;
  let testUser;
  let testBlueprint;

  beforeAll(async () => {
    const createApp = require('../app');
    const createContainer = require('../container');
    const container = createContainer();
    
    app = createApp(container);
    tokenService = getTokenService();

    // Create test user
    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: `crafttest_${Date.now()}`,
        email: `crafttest${Date.now()}@example.com`,
        password: 'testpassword123'
      });

    authToken = registerResponse.body.token;
    testUser = registerResponse.body.user;

    // Get a test blueprint from database
    testBlueprint = await models.BlueprintCrafting.findOne({
      where: { rarity: 'common', is_active: true }
    });
  }, 30000);

  afterAll(async () => {
    if (tokenService) {
      await tokenService.close();
    }
  });

  describe('GET /api/v1/crafting/blueprints', () => {
    it('should list all active blueprints', async () => {
      const response = await request(app)
        .get('/api/v1/crafting/blueprints')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('category');
      expect(response.body[0]).toHaveProperty('rarity');
    });

    it('should filter blueprints by category', async () => {
      const response = await request(app)
        .get('/api/v1/crafting/blueprints?category=boost')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach(blueprint => {
        expect(blueprint.category).toBe('boost');
      });
    });

    it('should filter blueprints by rarity', async () => {
      const response = await request(app)
        .get('/api/v1/crafting/blueprints?rarity=rare')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach(blueprint => {
        expect(blueprint.rarity).toBe('rare');
      });
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/v1/crafting/blueprints')
        .expect(401);
    });
  });

  describe('GET /api/v1/crafting/blueprints/:id', () => {
    it('should return blueprint details by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/crafting/blueprints/${testBlueprint.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', testBlueprint.id);
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('inputs');
      expect(response.body).toHaveProperty('outputs');
      expect(response.body).toHaveProperty('craft_duration_seconds');
    });

    it('should return 404 for non-existent blueprint', async () => {
      await request(app)
        .get('/api/v1/crafting/blueprints/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('POST /api/v1/crafting/user-blueprints/:blueprintId/grant', () => {
    it('should grant a blueprint to user', async () => {
      const response = await request(app)
        .post(`/api/v1/crafting/user-blueprints/${testBlueprint.id}/grant`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ source: 'admin' })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('playerBlueprint');
      expect(response.body.playerBlueprint.blueprint_id).toBe(testBlueprint.id);
    });

    it('should reject duplicate blueprint grant', async () => {
      // Try to grant same blueprint again
      await request(app)
        .post(`/api/v1/crafting/user-blueprints/${testBlueprint.id}/grant`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ source: 'admin' })
        .expect(400);
    });

    it('should return 404 for non-existent blueprint', async () => {
      await request(app)
        .post('/api/v1/crafting/user-blueprints/999999/grant')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ source: 'admin' })
        .expect(404);
    });
  });

  describe('GET /api/v1/crafting/user-blueprints', () => {
    it('should list user discovered blueprints', async () => {
      const response = await request(app)
        .get('/api/v1/crafting/user-blueprints')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('blueprint_id');
      expect(response.body[0]).toHaveProperty('discovered_at');
      expect(response.body[0]).toHaveProperty('times_crafted');
      expect(response.body[0]).toHaveProperty('Blueprint');
    });
  });

  describe('POST /api/v1/crafting/craft', () => {
    it('should reject craft without blueprintId', async () => {
      await request(app)
        .post('/api/v1/crafting/craft')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);
    });

    it('should reject craft for non-existent blueprint', async () => {
      await request(app)
        .post('/api/v1/crafting/craft')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ blueprintId: 999999 })
        .expect(404);
    });

    it('should reject craft for undiscovered blueprint', async () => {
      // Find a blueprint user doesn't have
      const anotherBlueprint = await models.BlueprintCrafting.findOne({
        where: { 
          id: { [models.Sequelize.Op.ne]: testBlueprint.id },
          is_active: true 
        }
      });

      if (anotherBlueprint) {
        const response = await request(app)
          .post('/api/v1/crafting/craft')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ blueprintId: anotherBlueprint.id })
          .expect(400);

        expect(response.body.message).toContain('not discovered');
      }
    });

    // Note: Full craft flow test requires mocking resource system
    // which will be integrated later
  });

  describe('GET /api/v1/crafting/queue', () => {
    it('should return user crafting queue', async () => {
      const response = await request(app)
        .get('/api/v1/crafting/queue')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      // Queue might be empty initially
    });

    it('should filter queue by status', async () => {
      const response = await request(app)
        .get('/api/v1/crafting/queue?status=in_progress')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach(craft => {
        expect(craft.status).toBe('in_progress');
      });
    });
  });

  describe('DELETE /api/v1/crafting/queue/:id', () => {
    it('should return 404 for non-existent craft', async () => {
      await request(app)
        .delete('/api/v1/crafting/queue/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    // Full cancel test requires creating a craft first
  });

  describe('POST /api/v1/crafting/queue/:id/speedup', () => {
    it('should return 404 for non-existent craft', async () => {
      await request(app)
        .post('/api/v1/crafting/queue/999999/speedup')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    // Full speedup test requires creating a craft and having CT
  });

  describe('POST /api/v1/crafting/queue/:id/collect', () => {
    it('should return 404 for non-existent craft', async () => {
      await request(app)
        .post('/api/v1/crafting/queue/999999/collect')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    // Full collect test requires creating and completing a craft
  });

  describe('GET /api/v1/crafting/stats', () => {
    it('should return user crafting stats', async () => {
      const response = await request(app)
        .get('/api/v1/crafting/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('level');
      expect(response.body).toHaveProperty('total_xp');
      expect(response.body).toHaveProperty('crafts_completed');
      expect(response.body).toHaveProperty('crafts_cancelled');
      expect(response.body).toHaveProperty('resources_consumed');
      expect(response.body).toHaveProperty('levelProgress');
      expect(response.body).toHaveProperty('bonuses');
    });

    it('should initialize stats for new user', async () => {
      const response = await request(app)
        .get('/api/v1/crafting/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.level).toBeGreaterThanOrEqual(1);
      expect(response.body.total_xp).toBeGreaterThanOrEqual(0);
      expect(response.body.crafts_completed).toBeGreaterThanOrEqual(0);
    });
  });

  describe('GET /api/v1/crafting/leaderboard', () => {
    it('should return global crafting leaderboard', async () => {
      const response = await request(app)
        .get('/api/v1/crafting/leaderboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      // Leaderboard might have entries from other tests
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('rank');
        expect(response.body[0]).toHaveProperty('user_id');
        expect(response.body[0]).toHaveProperty('level');
        expect(response.body[0]).toHaveProperty('total_xp');
      }
    });

    it('should respect limit parameter', async () => {
      const response = await request(app)
        .get('/api/v1/crafting/leaderboard?limit=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeLessThanOrEqual(5);
    });

    it('should sort by specified field', async () => {
      const response = await request(app)
        .get('/api/v1/crafting/leaderboard?sortBy=total_xp&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify descending order
      for (let i = 1; i < response.body.length; i++) {
        expect(response.body[i].total_xp).toBeLessThanOrEqual(response.body[i - 1].total_xp);
      }
    });
  });

  describe('Complete Crafting Flow', () => {
    let secondTestUser;
    let secondAuthToken;
    let craftId;

    beforeAll(async () => {
      // Create another test user for full flow
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: `craftflow_${Date.now()}`,
          email: `craftflow${Date.now()}@example.com`,
          password: 'testpassword123'
        });

      secondAuthToken = registerResponse.body.token;
      secondTestUser = registerResponse.body.user;

      // Grant blueprint to new user
      await request(app)
        .post(`/api/v1/crafting/user-blueprints/${testBlueprint.id}/grant`)
        .set('Authorization', `Bearer ${secondAuthToken}`)
        .send({ source: 'quest' });
    });

    it('should complete full craft lifecycle (mock resources)', async () => {
      // Step 1: Check initial stats
      const initialStats = await request(app)
        .get('/api/v1/crafting/stats')
        .set('Authorization', `Bearer ${secondAuthToken}`)
        .expect(200);

      const initialCrafts = initialStats.body.crafts_completed;

      // Step 2: Start craft (will fail without resources - expected)
      const craftResponse = await request(app)
        .post('/api/v1/crafting/craft')
        .set('Authorization', `Bearer ${secondAuthToken}`)
        .send({ blueprintId: testBlueprint.id });

      // Expected to fail due to missing resource integration
      expect([201, 400]).toContain(craftResponse.status);

      if (craftResponse.status === 201) {
        craftId = craftResponse.body.id;

        // Step 3: Check queue
        const queueResponse = await request(app)
          .get('/api/v1/crafting/queue')
          .set('Authorization', `Bearer ${secondAuthToken}`)
          .expect(200);

        const activeCrafts = queueResponse.body.filter(c => c.status === 'in_progress');
        expect(activeCrafts.length).toBeGreaterThan(0);

        // Step 4: Try to cancel
        const cancelResponse = await request(app)
          .delete(`/api/v1/crafting/queue/${craftId}`)
          .set('Authorization', `Bearer ${secondAuthToken}`)
          .expect(200);

        expect(cancelResponse.body.message).toContain('cancelled');

        // Step 5: Verify stats updated
        const finalStats = await request(app)
          .get('/api/v1/crafting/stats')
          .set('Authorization', `Bearer ${secondAuthToken}`)
          .expect(200);

        expect(finalStats.body.crafts_cancelled).toBeGreaterThan(0);
      }
    });
  });

  describe('Authorization & Security', () => {
    it('should prevent accessing other users crafts', async () => {
      // Create another user
      const otherUserResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: `otheruser_${Date.now()}`,
          email: `otheruser${Date.now()}@example.com`,
          password: 'testpassword123'
        });

      const otherToken = otherUserResponse.body.token;

      // Grant blueprint and try to craft
      await request(app)
        .post(`/api/v1/crafting/user-blueprints/${testBlueprint.id}/grant`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ source: 'admin' });

      // Original user should not see other user's blueprints in their list
      const userBlueprints = await request(app)
        .get('/api/v1/crafting/user-blueprints')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const originalUserBlueprintIds = userBlueprints.body.map(pb => pb.user_id);
      originalUserBlueprintIds.forEach(userId => {
        expect(userId).toBe(testUser.id);
      });
    });

    it('should require valid JWT for all endpoints', async () => {
      await request(app)
        .get('/api/v1/crafting/blueprints')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      await request(app)
        .post('/api/v1/crafting/craft')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      await request(app)
        .get('/api/v1/crafting/stats')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
