/**
 * Factions System - Integration Tests
 * Tests for faction membership, zone control, point accumulation, and bonuses
 */

const request = require('supertest');
const app = require('../app');
const { User, Faction, ControlZone, FactionControlPoints, UserFaction } = require('../models');
const { generateToken } = require('../utils/jwt');

describe('Factions System Integration Tests', () => {
  let authToken;
  let testUser;
  let terranFaction;
  let nomadFaction;
  let testZone;

  beforeAll(async () => {
    // Create test user
    testUser = await User.create({
      username: `faction_test_${Date.now()}`,
      email: `faction_test_${Date.now()}@example.com`,
      password: 'hashedPassword123'
    });

    authToken = generateToken({ id: testUser.id, username: testUser.username });

    // Get existing factions from seed data
    terranFaction = await Faction.findOne({ where: { id: 'TERRAN_FEDERATION' } });
    nomadFaction = await Faction.findOne({ where: { id: 'NOMAD_RAIDERS' } });

    // Get a test zone
    testZone = await ControlZone.findOne({ where: { name: 'Research Valley' } });
  });

  afterAll(async () => {
    // Clean up test data
    await UserFaction.destroy({ where: { user_id: testUser.id } });
    await User.destroy({ where: { id: testUser.id } });
  });

  describe('GET /api/v1/factions', () => {
    test('should get all available factions', async () => {
      const response = await request(app)
        .get('/api/v1/factions')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThanOrEqual(3);

      const faction = response.body.data[0];
      expect(faction).toHaveProperty('id');
      expect(faction).toHaveProperty('name');
      expect(faction).toHaveProperty('bonuses');
      expect(faction).toHaveProperty('color');
    });
  });

  describe('GET /api/v1/factions/:factionId', () => {
    test('should get faction details with stats', async () => {
      const response = await request(app)
        .get(`/api/v1/factions/${terranFaction.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id', terranFaction.id);
      expect(response.body.data).toHaveProperty('name', terranFaction.name);
      expect(response.body.data).toHaveProperty('stats');
      expect(response.body.data).toHaveProperty('top_contributors');
      expect(response.body.data.stats).toHaveProperty('member_count');
      expect(response.body.data.stats).toHaveProperty('controlled_zones');
    });

    test('should return 404 for non-existent faction', async () => {
      const response = await request(app)
        .get('/api/v1/factions/INVALID_FACTION')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/factions/join', () => {
    test('should allow user to join a faction', async () => {
      const response = await request(app)
        .post('/api/v1/factions/join')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ factionId: terranFaction.id });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('faction_id', terranFaction.id);
      expect(response.body.data).toHaveProperty('faction_name', terranFaction.name);
      expect(response.body.data).toHaveProperty('bonuses');
      expect(response.body.data).toHaveProperty('can_change_at');

      // Verify database record
      const membership = await UserFaction.findOne({
        where: {
          user_id: testUser.id,
          faction_id: terranFaction.id,
          is_active: true
        }
      });

      expect(membership).not.toBeNull();
      expect(membership.contribution_points).toBe(0);
    });

    test('should reject joining faction when already member', async () => {
      const response = await request(app)
        .post('/api/v1/factions/join')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ factionId: nomadFaction.id });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already a member');
    });

    test('should reject joining non-existent faction', async () => {
      // Leave current faction first
      await UserFaction.update(
        { is_active: false, left_at: new Date() },
        { where: { user_id: testUser.id } }
      );

      const response = await request(app)
        .post('/api/v1/factions/join')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ factionId: 'INVALID_FACTION' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('does not exist');
    });
  });

  describe('GET /api/v1/factions/my-faction', () => {
    test('should get user current faction stats', async () => {
      // Rejoin Terran faction for this test
      await UserFaction.destroy({ where: { user_id: testUser.id } });
      await UserFaction.create({
        user_id: testUser.id,
        faction_id: terranFaction.id,
        joined_at: new Date(),
        contribution_points: 100,
        can_change_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        is_active: true
      });

      const response = await request(app)
        .get('/api/v1/factions/my-faction')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).not.toBeNull();
      expect(response.body.data).toHaveProperty('faction_id', terranFaction.id);
      expect(response.body.data).toHaveProperty('contribution_points');
      expect(response.body.data).toHaveProperty('rank');
      expect(response.body.data).toHaveProperty('active_bonuses');
      expect(response.body.data).toHaveProperty('can_change_faction');
      expect(response.body.data).toHaveProperty('cooldown_remaining_seconds');
    });

    test('should return null when user has no faction', async () => {
      // Leave faction
      await UserFaction.destroy({ where: { user_id: testUser.id } });

      const response = await request(app)
        .get('/api/v1/factions/my-faction')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeNull();
      expect(response.body.message).toContain('not currently in a faction');
    });
  });

  describe('POST /api/v1/factions/leave', () => {
    beforeEach(async () => {
      // Ensure user has active faction
      await UserFaction.destroy({ where: { user_id: testUser.id } });
      await UserFaction.create({
        user_id: testUser.id,
        faction_id: terranFaction.id,
        joined_at: new Date(),
        contribution_points: 50,
        can_change_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        is_active: true
      });
    });

    test('should allow user to leave current faction', async () => {
      const response = await request(app)
        .post('/api/v1/factions/leave')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('left_faction');
      expect(response.body.data).toHaveProperty('cooldown_days', 30);

      // Verify database record
      const membership = await UserFaction.findOne({
        where: {
          user_id: testUser.id,
          faction_id: terranFaction.id
        }
      });

      expect(membership.is_active).toBe(false);
      expect(membership.left_at).not.toBeNull();
    });

    test('should reject leaving when not in faction', async () => {
      // Already left in previous test
      const response = await request(app)
        .post('/api/v1/factions/leave')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not currently in a faction');
    });
  });

  describe('GET /api/v1/factions/leaderboard', () => {
    test('should get global faction leaderboard by members', async () => {
      const response = await request(app)
        .get('/api/v1/factions/leaderboard?sortBy=members')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThanOrEqual(3);

      const ranking = response.body.data[0];
      expect(ranking).toHaveProperty('faction_id');
      expect(ranking).toHaveProperty('name');
      expect(ranking).toHaveProperty('member_count');
      expect(ranking).toHaveProperty('controlled_zones');
      expect(ranking).toHaveProperty('total_contribution');
    });

    test('should sort leaderboard by zones', async () => {
      const response = await request(app)
        .get('/api/v1/factions/leaderboard?sortBy=zones')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/v1/factions/zones/all', () => {
    test('should get all control zones', async () => {
      const response = await request(app)
        .get('/api/v1/factions/zones/all')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThanOrEqual(10);

      const zone = response.body.data[0];
      expect(zone).toHaveProperty('id');
      expect(zone).toHaveProperty('name');
      expect(zone).toHaveProperty('center_x');
      expect(zone).toHaveProperty('center_y');
      expect(zone).toHaveProperty('radius');
      expect(zone).toHaveProperty('status');
      expect(zone).toHaveProperty('bonuses');
    });
  });

  describe('GET /api/v1/factions/zones/:zoneId', () => {
    test('should get zone details with control progress', async () => {
      const response = await request(app)
        .get(`/api/v1/factions/zones/${testZone.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id', testZone.id);
      expect(response.body.data).toHaveProperty('name', testZone.name);
      expect(response.body.data).toHaveProperty('control_progress');
      expect(response.body.data.control_progress).toBeInstanceOf(Array);
    });

    test('should return 404 for non-existent zone', async () => {
      const response = await request(app)
        .get('/api/v1/factions/zones/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/factions/zones/at/:x/:y', () => {
    test('should get zone at specific coordinates', async () => {
      const response = await request(app)
        .get(`/api/v1/factions/zones/at/${testZone.center_x}/${testZone.center_y}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).not.toBeNull();
      expect(response.body.data).toHaveProperty('name', testZone.name);
    });

    test('should return null for coordinates outside zones', async () => {
      const response = await request(app)
        .get('/api/v1/factions/zones/at/9999/9999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeNull();
      expect(response.body.message).toContain('No control zone');
    });
  });

  describe('GET /api/v1/factions/my-bonuses', () => {
    test('should get user active bonuses from faction', async () => {
      // Ensure user has active faction
      await UserFaction.destroy({ where: { user_id: testUser.id } });
      await UserFaction.create({
        user_id: testUser.id,
        faction_id: terranFaction.id,
        joined_at: new Date(),
        contribution_points: 200,
        can_change_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        is_active: true
      });

      const response = await request(app)
        .get('/api/v1/factions/my-bonuses')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Object);
      // Terran faction has defense and research bonuses
      expect(response.body.data).toHaveProperty('defense_bonus');
      expect(response.body.data).toHaveProperty('research_speed_bonus');
    });

    test('should return empty bonuses when user has no faction', async () => {
      await UserFaction.destroy({ where: { user_id: testUser.id } });

      const response = await request(app)
        .get('/api/v1/factions/my-bonuses')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual({});
    });
  });

  describe('Faction Change Cooldown', () => {
    test('should enforce 30-day cooldown when leaving faction', async () => {
      // Join faction
      await UserFaction.destroy({ where: { user_id: testUser.id } });
      await request(app)
        .post('/api/v1/factions/join')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ factionId: terranFaction.id });

      // Leave faction
      await request(app)
        .post('/api/v1/factions/leave')
        .set('Authorization', `Bearer ${authToken}`);

      // Try to rejoin immediately
      const response = await request(app)
        .post('/api/v1/factions/join')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ factionId: terranFaction.id });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('cooldown active');
      expect(response.body.message).toMatch(/\d+ days/);
    });
  });

  describe('Authorization', () => {
    test('should reject requests without auth token', async () => {
      const response = await request(app)
        .get('/api/v1/factions');

      expect(response.status).toBe(401);
    });

    test('should reject requests with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/factions')
        .set('Authorization', 'Bearer invalid_token_12345');

      expect(response.status).toBe(401);
    });
  });
});
