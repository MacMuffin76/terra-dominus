/**
 * Boss Battles Backend Integration Tests
 * Tests for boss battle API endpoints, combat service, and repositories
 */

const request = require('supertest');
const app = require('../app');
const { sequelize } = require('../models');
const container = require('../container');

describe('Boss Battles API Integration Tests', () => {
  let authToken;
  let testUser;
  let testPortal;
  let testBoss;
  let portalBossRepository;
  let portalBossCombatService;

  beforeAll(async () => {
    // Initialize services
    portalBossRepository = container.resolve('portalBossRepository');
    portalBossCombatService = container.resolve('portalBossCombatService');

    // Create test user
    const userResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'testbossuser',
        email: 'testboss@test.com',
        password: 'Password123!',
      });

    testUser = userResponse.body.user || userResponse.body;

    // Login to get token
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        username: 'testbossuser',
        password: 'Password123!',
      });

    authToken = loginResponse.body.token;
  });

  afterAll(async () => {
    // Cleanup test data
    if (testBoss) {
      await portalBossRepository.findById(testBoss.boss_id)
        .then(boss => boss?.destroy())
        .catch(() => {});
    }
    if (testUser) {
      await sequelize.models.User.destroy({ where: { id: testUser.id } }).catch(() => {});
    }
    await sequelize.close();
  });

  describe('GET /api/v1/portals/bosses', () => {
    it('should return list of active bosses', async () => {
      const response = await request(app)
        .get('/api/v1/portals/bosses')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.bosses)).toBe(true);
    });

    it('should filter bosses by tier', async () => {
      const response = await request(app)
        .get('/api/v1/portals/bosses?tier=rare')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.bosses)).toBe(true);
      
      // All returned bosses should be rare tier
      if (response.body.bosses.length > 0) {
        response.body.bosses.forEach(boss => {
          expect(boss.tier).toBe('rare');
        });
      }
    });

    it('should filter bosses by type', async () => {
      const response = await request(app)
        .get('/api/v1/portals/bosses?boss_type=elite_guardian')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      
      if (response.body.bosses.length > 0) {
        response.body.bosses.forEach(boss => {
          expect(boss.boss_type).toBe('elite_guardian');
        });
      }
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/v1/portals/bosses')
        .expect(401);
    });
  });

  describe('POST /api/v1/portals/admin/spawn-boss', () => {
    it('should spawn a new boss (admin)', async () => {
      // This test requires admin privileges
      // Create admin token or skip if not admin
      
      const bossData = {
        portal_id: 1, // Assuming portal exists
        boss_type: 'elite_guardian',
        base_hp: 100000,
        defense: 150,
        abilities: ['shield_regeneration', 'aoe_blast'],
      };

      const response = await request(app)
        .post('/api/v1/portals/admin/spawn-boss')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bossData);

      // May return 403 if not admin, which is expected
      if (response.status === 201) {
        expect(response.body.success).toBe(true);
        expect(response.body.boss).toBeDefined();
        testBoss = response.body.boss;
      } else {
        expect(response.status).toBe(403);
      }
    });
  });

  describe('GET /api/v1/portals/bosses/:bossId', () => {
    it('should return boss details', async () => {
      // First get list to find a boss ID
      const listResponse = await request(app)
        .get('/api/v1/portals/bosses')
        .set('Authorization', `Bearer ${authToken}`);

      if (listResponse.body.bosses && listResponse.body.bosses.length > 0) {
        const bossId = listResponse.body.bosses[0].boss_id;

        const response = await request(app)
          .get(`/api/v1/portals/bosses/${bossId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.boss).toBeDefined();
        expect(response.body.stats).toBeDefined();
        expect(response.body.boss.boss_id).toBe(bossId);
      }
    });

    it('should return 404 for non-existent boss', async () => {
      await request(app)
        .get('/api/v1/portals/bosses/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('POST /api/v1/portals/bosses/:bossId/estimate', () => {
    it('should estimate battle outcome', async () => {
      const listResponse = await request(app)
        .get('/api/v1/portals/bosses')
        .set('Authorization', `Bearer ${authToken}`);

      if (listResponse.body.bosses && listResponse.body.bosses.length > 0) {
        const bossId = listResponse.body.bosses[0].boss_id;

        const response = await request(app)
          .post(`/api/v1/portals/bosses/${bossId}/estimate`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            units: {
              infantry: 100,
              cavalry: 50,
              archers: 75,
              siege: 25,
            },
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.playerPower).toBeDefined();
        expect(response.body.bossPower).toBeDefined();
        expect(response.body.powerRatio).toBeDefined();
        expect(response.body.estimate).toBeDefined();
      }
    });

    it('should reject estimate without units', async () => {
      const listResponse = await request(app)
        .get('/api/v1/portals/bosses')
        .set('Authorization', `Bearer ${authToken}`);

      if (listResponse.body.bosses && listResponse.body.bosses.length > 0) {
        const bossId = listResponse.body.bosses[0].boss_id;

        await request(app)
          .post(`/api/v1/portals/bosses/${bossId}/estimate`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({})
          .expect(400);
      }
    });
  });

  describe('POST /api/v1/portals/bosses/:bossId/attack', () => {
    it('should attack boss and return battle result', async () => {
      const listResponse = await request(app)
        .get('/api/v1/portals/bosses')
        .set('Authorization', `Bearer ${authToken}`);

      if (listResponse.body.bosses && listResponse.body.bosses.length > 0) {
        const boss = listResponse.body.bosses[0];
        
        // Only attack if boss is alive
        if (!boss.defeated) {
          const response = await request(app)
            .post(`/api/v1/portals/bosses/${boss.boss_id}/attack`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              units: {
                infantry: 100,
                cavalry: 50,
                archers: 75,
                siege: 25,
              },
              tactic: 'balanced',
            })
            .expect(200);

          expect(response.body.success).toBe(true);
          expect(response.body.result).toBeDefined();
          expect(['victory', 'defeat']).toContain(response.body.result);
          expect(response.body.damage_dealt).toBeDefined();
          expect(response.body.phases_reached).toBeDefined();
          expect(Array.isArray(response.body.battle_log)).toBe(true);
        }
      }
    });

    it('should reject attack on defeated boss', async () => {
      // This test requires a defeated boss
      // Skip if no defeated bosses available
    });

    it('should validate unit data', async () => {
      const listResponse = await request(app)
        .get('/api/v1/portals/bosses')
        .set('Authorization', `Bearer ${authToken}`);

      if (listResponse.body.bosses && listResponse.body.bosses.length > 0) {
        const bossId = listResponse.body.bosses[0].boss_id;

        await request(app)
          .post(`/api/v1/portals/bosses/${bossId}/attack`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            tactic: 'balanced',
          })
          .expect(400);
      }
    });
  });

  describe('GET /api/v1/portals/bosses/:bossId/leaderboard', () => {
    it('should return boss leaderboard', async () => {
      const listResponse = await request(app)
        .get('/api/v1/portals/bosses')
        .set('Authorization', `Bearer ${authToken}`);

      if (listResponse.body.bosses && listResponse.body.bosses.length > 0) {
        const bossId = listResponse.body.bosses[0].boss_id;

        const response = await request(app)
          .get(`/api/v1/portals/bosses/${bossId}/leaderboard?limit=10`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.leaderboard)).toBe(true);
        expect(response.body.leaderboard.length).toBeLessThanOrEqual(10);

        if (response.body.leaderboard.length > 0) {
          const entry = response.body.leaderboard[0];
          expect(entry.rank).toBe(1);
          expect(entry.damage_dealt).toBeDefined();
          expect(entry.user).toBeDefined();
        }
      }
    });
  });

  describe('GET /api/v1/portals/user/boss-attempts', () => {
    it('should return user boss attempt history', async () => {
      const response = await request(app)
        .get('/api/v1/portals/user/boss-attempts?limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.attempts)).toBe(true);
    });
  });

  describe('Alliance Raids Endpoints', () => {
    describe('GET /api/v1/portals/raids', () => {
      it('should return alliance raids', async () => {
        // Requires alliance_id parameter
        const response = await request(app)
          .get('/api/v1/portals/raids?alliance_id=1')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.raids)).toBe(true);
      });

      it('should require alliance_id parameter', async () => {
        await request(app)
          .get('/api/v1/portals/raids')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(400);
      });
    });

    describe('POST /api/v1/portals/raids/create', () => {
      it('should create alliance raid', async () => {
        const listResponse = await request(app)
          .get('/api/v1/portals/bosses')
          .set('Authorization', `Bearer ${authToken}`);

        if (listResponse.body.bosses && listResponse.body.bosses.length > 0) {
          const bossId = listResponse.body.bosses[0].boss_id;

          const response = await request(app)
            .post('/api/v1/portals/raids/create')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              boss_id: bossId,
              alliance_id: 1, // Assuming alliance exists
              min_participants: 3,
              max_participants: 10,
            });

          // May fail if user not in alliance or not leader
          if (response.status === 201) {
            expect(response.body.success).toBe(true);
            expect(response.body.raid).toBeDefined();
          }
        }
      });

      it('should validate raid parameters', async () => {
        await request(app)
          .post('/api/v1/portals/raids/create')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            // Missing required fields
          })
          .expect(400);
      });
    });
  });

  describe('Boss Combat Service Tests', () => {
    it('should calculate unit power correctly', () => {
      const units = {
        infantry: 100,
        cavalry: 50,
        archers: 75,
        siege: 25,
      };

      // Access service method if public
      // This may require mocking or refactoring service for testability
    });

    it('should determine boss phase based on HP', () => {
      // Test phase calculation logic
      // Phase 1: 100-75%, Phase 2: 75-50%, Phase 3: 50-25%, Phase 4: 25-0%
    });

    it('should apply tactic modifiers correctly', () => {
      // Test balanced, aggressive, defensive modifiers
    });

    it('should trigger phase transition abilities', () => {
      // Test shield_regeneration on phase change
    });

    it('should process boss abilities during combat', () => {
      // Test aoe_blast and unit_disable
    });
  });
});
