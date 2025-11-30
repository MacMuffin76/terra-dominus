/**
 * Portal Boss Controller
 * Handles boss battle and alliance raid requests
 */

const { getLogger, runWithContext } = require('../utils/logger');
const logger = getLogger({ module: 'portal-boss-controller' });

function createPortalBossController({
  portalBossCombatService,
  portalBossRepository,
  portalRaidRepository,
}) {
  return {
    /**
     * List active bosses
     * GET /api/v1/portals/bosses
     */
    async listActiveBosses(req, res) {
      return runWithContext(async () => {
        try {
          const { tier, boss_type } = req.query;

          let bosses;
          if (tier) {
            bosses = await portalBossRepository.getBossesByTier(tier);
          } else if (boss_type) {
            bosses = await portalBossRepository.getBossesByType(boss_type);
          } else {
            bosses = await portalBossRepository.getActiveBosses();
          }

          const bossData = bosses.map((boss) => boss.getSummary());

          res.json({
            success: true,
            count: bossData.length,
            bosses: bossData,
          });
        } catch (error) {
          logger.error('Error listing bosses:', error);
          res.status(500).json({
            success: false,
            message: 'Failed to list bosses',
            error: error.message,
          });
        }
      });
    },

    /**
     * Get boss details
     * GET /api/v1/portals/bosses/:bossId
     */
    async getBossDetails(req, res) {
      return runWithContext(async () => {
        try {
          const { bossId } = req.params;

          const boss = await portalBossRepository.findById(bossId);
          if (!boss) {
            return res.status(404).json({
              success: false,
              message: 'Boss not found',
            });
          }

          const stats = await portalBossRepository.getBossStats(bossId);

          res.json({
            success: true,
            boss: boss.getSummary(),
            portal: boss.portal,
            stats: stats || {
              total_attempts: 0,
              victories: 0,
              avg_damage: 0,
              max_damage: 0,
              avg_phases: 1,
            },
          });
        } catch (error) {
          logger.error('Error getting boss details:', error);
          res.status(500).json({
            success: false,
            message: 'Failed to get boss details',
            error: error.message,
          });
        }
      });
    },

    /**
     * Get boss attempts
     * GET /api/v1/portals/bosses/:bossId/attempts
     */
    async getBossAttempts(req, res) {
      return runWithContext(async () => {
        try {
          const { bossId } = req.params;
          const limit = parseInt(req.query.limit) || 20;

          const attempts = await portalBossRepository.getBossAttempts(bossId, limit);

          res.json({
            success: true,
            count: attempts.length,
            attempts: attempts.map((attempt) => attempt.getSummary()),
          });
        } catch (error) {
          logger.error('Error getting boss attempts:', error);
          res.status(500).json({
            success: false,
            message: 'Failed to get boss attempts',
            error: error.message,
          });
        }
      });
    },

    /**
     * Get boss leaderboard
     * GET /api/v1/portals/bosses/:bossId/leaderboard
     */
    async getBossLeaderboard(req, res) {
      return runWithContext(async () => {
        try {
          const { bossId } = req.params;
          const limit = parseInt(req.query.limit) || 10;

          const leaderboard = await portalBossRepository.getBossLeaderboard(bossId, limit);

          res.json({
            success: true,
            leaderboard: leaderboard.map((entry, index) => ({
              rank: index + 1,
              user: entry.user,
              damage_dealt: entry.damage_dealt,
              phases_reached: entry.phases_reached,
              result: entry.result,
              created_at: entry.created_at,
            })),
          });
        } catch (error) {
          logger.error('Error getting boss leaderboard:', error);
          res.status(500).json({
            success: false,
            message: 'Failed to get boss leaderboard',
            error: error.message,
          });
        }
      });
    },

    /**
     * Attack boss
     * POST /api/v1/portals/bosses/:bossId/attack
     */
    async attackBoss(req, res) {
      return runWithContext(async () => {
        try {
          const { bossId } = req.params;
          const { units, tactic } = req.body;
          const userId = req.user.id;

          if (!units || typeof units !== 'object') {
            return res.status(400).json({
              success: false,
              message: 'Invalid units data',
            });
          }

          // Check if boss exists
          const boss = await portalBossRepository.findById(bossId);
          if (!boss) {
            return res.status(404).json({
              success: false,
              message: 'Boss not found',
            });
          }

          if (!boss.isAlive()) {
            return res.status(400).json({
              success: false,
              message: 'Boss already defeated',
            });
          }

          // Simulate battle
          const result = await portalBossCombatService.simulateBossBattle(
            userId,
            bossId,
            units,
            tactic || 'balanced'
          );

          logger.info(
            `Boss battle: User ${userId} vs Boss ${bossId}, Result: ${result.result}, Phases: ${result.phases_reached}`
          );

          res.json({
            success: true,
            ...result,
          });
        } catch (error) {
          logger.error('Error attacking boss:', error);
          res.status(500).json({
            success: false,
            message: 'Failed to attack boss',
            error: error.message,
          });
        }
      });
    },

    /**
     * Estimate boss battle
     * POST /api/v1/portals/bosses/:bossId/estimate
     */
    async estimateBossBattle(req, res) {
      return runWithContext(async () => {
        try {
          const { bossId } = req.params;
          const { units } = req.body;

          if (!units || typeof units !== 'object') {
            return res.status(400).json({
              success: false,
              message: 'Invalid units data',
            });
          }

          const estimate = await portalBossCombatService.estimateBossBattle(bossId, units);

          res.json({
            success: true,
            ...estimate,
          });
        } catch (error) {
          logger.error('Error estimating boss battle:', error);
          res.status(500).json({
            success: false,
            message: 'Failed to estimate boss battle',
            error: error.message,
          });
        }
      });
    },

    /**
     * Get user's boss attempts
     * GET /api/v1/portals/user/boss-attempts
     */
    async getUserBossAttempts(req, res) {
      return runWithContext(async () => {
        try {
          const userId = req.user.id;
          const limit = parseInt(req.query.limit) || 10;

          const attempts = await portalBossRepository.getUserAttempts(userId, limit);

          res.json({
            success: true,
            count: attempts.length,
            attempts: attempts.map((attempt) => attempt.getSummary()),
          });
        } catch (error) {
          logger.error('Error getting user boss attempts:', error);
          res.status(500).json({
            success: false,
            message: 'Failed to get user boss attempts',
            error: error.message,
          });
        }
      });
    },

    /**
     * List alliance raids
     * GET /api/v1/portals/raids
     */
    async listAllianceRaids(req, res) {
      return runWithContext(async () => {
        try {
          const userId = req.user.id;
          const { alliance_id, status } = req.query;

          if (!alliance_id) {
            return res.status(400).json({
              success: false,
              message: 'alliance_id required',
            });
          }

          // TODO: Verify user is in alliance

          let raids;
          if (status === 'completed') {
            raids = await portalRaidRepository.getCompletedRaidsForAlliance(alliance_id);
          } else {
            raids = await portalRaidRepository.getActiveRaidsForAlliance(alliance_id);
          }

          res.json({
            success: true,
            count: raids.length,
            raids: raids.map((raid) => raid.getSummary()),
          });
        } catch (error) {
          logger.error('Error listing alliance raids:', error);
          res.status(500).json({
            success: false,
            message: 'Failed to list alliance raids',
            error: error.message,
          });
        }
      });
    },

    /**
     * Get raid details
     * GET /api/v1/portals/raids/:raidId
     */
    async getRaidDetails(req, res) {
      return runWithContext(async () => {
        try {
          const { raidId } = req.params;

          const raid = await portalRaidRepository.findById(raidId);
          if (!raid) {
            return res.status(404).json({
              success: false,
              message: 'Raid not found',
            });
          }

          const participants = await portalRaidRepository.getParticipants(raidId);

          res.json({
            success: true,
            raid: raid.getSummary(),
            boss: raid.boss.getSummary(),
            participants: participants.map((p) => p.getSummary()),
          });
        } catch (error) {
          logger.error('Error getting raid details:', error);
          res.status(500).json({
            success: false,
            message: 'Failed to get raid details',
            error: error.message,
          });
        }
      });
    },

    /**
     * Create alliance raid
     * POST /api/v1/portals/raids/create
     */
    async createRaid(req, res) {
      return runWithContext(async () => {
        try {
          const { boss_id, alliance_id, min_participants, max_participants } = req.body;
          const userId = req.user.id;

          if (!boss_id || !alliance_id) {
            return res.status(400).json({
              success: false,
              message: 'boss_id and alliance_id required',
            });
          }

          // TODO: Verify user is alliance leader or officer
          // TODO: Verify boss is not already in a raid

          const boss = await portalBossRepository.findById(boss_id);
          if (!boss) {
            return res.status(404).json({
              success: false,
              message: 'Boss not found',
            });
          }

          if (!boss.isAlive()) {
            return res.status(400).json({
              success: false,
              message: 'Boss already defeated',
            });
          }

          const raid = await portalRaidRepository.create({
            boss_id,
            alliance_id,
            min_participants: min_participants || 3,
            max_participants: max_participants || 10,
            status: 'forming',
            total_damage: 0,
            rewards_pool: boss.rewards,
          });

          logger.info(`Raid created: ${raid.raid_id} for boss ${boss_id} by alliance ${alliance_id}`);

          res.json({
            success: true,
            raid: raid.getSummary(),
          });
        } catch (error) {
          logger.error('Error creating raid:', error);
          res.status(500).json({
            success: false,
            message: 'Failed to create raid',
            error: error.message,
          });
        }
      });
    },

    /**
     * Join alliance raid
     * POST /api/v1/portals/raids/:raidId/join
     */
    async joinRaid(req, res) {
      return runWithContext(async () => {
        try {
          const { raidId } = req.params;
          const { units } = req.body;
          const userId = req.user.id;

          if (!units || typeof units !== 'object') {
            return res.status(400).json({
              success: false,
              message: 'Invalid units data',
            });
          }

          const raid = await portalRaidRepository.findById(raidId);
          if (!raid) {
            return res.status(404).json({
              success: false,
              message: 'Raid not found',
            });
          }

          if (raid.status !== 'forming') {
            return res.status(400).json({
              success: false,
              message: 'Raid is not accepting participants',
            });
          }

          // Check if user already joined
          const alreadyJoined = await portalRaidRepository.isUserInRaid(raidId, userId);
          if (alreadyJoined) {
            return res.status(400).json({
              success: false,
              message: 'Already joined this raid',
            });
          }

          // Check if raid is full
          const isFull = await raid.isFull();
          if (isFull) {
            return res.status(400).json({
              success: false,
              message: 'Raid is full',
            });
          }

          const participant = await portalRaidRepository.addParticipant(raidId, userId, units);

          logger.info(`User ${userId} joined raid ${raidId}`);

          res.json({
            success: true,
            participant: participant.getSummary(),
          });
        } catch (error) {
          logger.error('Error joining raid:', error);
          res.status(500).json({
            success: false,
            message: 'Failed to join raid',
            error: error.message,
          });
        }
      });
    },

    /**
     * Start alliance raid
     * POST /api/v1/portals/raids/:raidId/start
     */
    async startRaid(req, res) {
      return runWithContext(async () => {
        try {
          const { raidId } = req.params;
          const userId = req.user.id;

          const raid = await portalRaidRepository.findById(raidId);
          if (!raid) {
            return res.status(404).json({
              success: false,
              message: 'Raid not found',
            });
          }

          if (raid.status !== 'forming') {
            return res.status(400).json({
              success: false,
              message: 'Raid already started or completed',
            });
          }

          // TODO: Verify user is alliance leader
          // TODO: Check minimum participants

          const canStart = await raid.canStart();
          if (!canStart) {
            return res.status(400).json({
              success: false,
              message: `Need at least ${raid.min_participants} participants`,
            });
          }

          await portalRaidRepository.startRaid(raidId);

          logger.info(`Raid ${raidId} started by user ${userId}`);

          res.json({
            success: true,
            message: 'Raid started',
          });
        } catch (error) {
          logger.error('Error starting raid:', error);
          res.status(500).json({
            success: false,
            message: 'Failed to start raid',
            error: error.message,
          });
        }
      });
    },

    /**
     * Get raid participants
     * GET /api/v1/portals/raids/:raidId/participants
     */
    async getRaidParticipants(req, res) {
      return runWithContext(async () => {
        try {
          const { raidId } = req.params;

          const participants = await portalRaidRepository.getParticipants(raidId);

          res.json({
            success: true,
            count: participants.length,
            participants: participants.map((p) => p.getSummary()),
          });
        } catch (error) {
          logger.error('Error getting raid participants:', error);
          res.status(500).json({
            success: false,
            message: 'Failed to get raid participants',
            error: error.message,
          });
        }
      });
    },

    /**
     * Spawn boss (Admin only)
     * POST /api/v1/portals/admin/spawn-boss
     */
    async spawnBoss(req, res) {
      return runWithContext(async () => {
        try {
          const { portal_id, boss_type, base_hp, defense, abilities, rewards } = req.body;

          if (!portal_id || !boss_type || !base_hp) {
            return res.status(400).json({
              success: false,
              message: 'portal_id, boss_type, and base_hp required',
            });
          }

          const boss = await portalBossRepository.create({
            portal_id,
            boss_type,
            base_hp,
            current_hp: base_hp,
            current_phase: 1,
            defense: defense || 100,
            abilities: abilities || [],
            rewards: rewards || {},
            defeated: false,
          });

          logger.info(`Boss spawned: ${boss.boss_id} (${boss_type}) on portal ${portal_id}`);

          res.json({
            success: true,
            boss: boss.getSummary(),
          });
        } catch (error) {
          logger.error('Error spawning boss:', error);
          res.status(500).json({
            success: false,
            message: 'Failed to spawn boss',
            error: error.message,
          });
        }
      });
    },

    /**
     * Delete boss (Admin only)
     * DELETE /api/v1/portals/admin/bosses/:bossId
     */
    async deleteBoss(req, res) {
      return runWithContext(async () => {
        try {
          const { bossId } = req.params;

          const boss = await portalBossRepository.findById(bossId);
          if (!boss) {
            return res.status(404).json({
              success: false,
              message: 'Boss not found',
            });
          }

          await boss.destroy();

          logger.info(`Boss deleted: ${bossId}`);

          res.json({
            success: true,
            message: 'Boss deleted',
          });
        } catch (error) {
          logger.error('Error deleting boss:', error);
          res.status(500).json({
            success: false,
            message: 'Failed to delete boss',
            error: error.message,
          });
        }
      });
    },
  };
}

module.exports = createPortalBossController;
