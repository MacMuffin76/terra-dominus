const { getLogger } = require('../utils/logger');

/**
 * CraftingController - REST API endpoints for the Crafting & Blueprints system
 * 
 * Endpoints:
 * - GET /api/v1/crafting/blueprints - List all blueprints (with filters)
 * - GET /api/v1/crafting/blueprints/:id - Get blueprint details
 * - GET /api/v1/crafting/user-blueprints - List user's discovered blueprints
 * - POST /api/v1/crafting/user-blueprints/:blueprintId/grant - Grant blueprint to user (admin)
 * - POST /api/v1/crafting/craft - Start a new craft
 * - GET /api/v1/crafting/queue - Get user's crafting queue
 * - DELETE /api/v1/crafting/queue/:id - Cancel a craft (50% refund)
 * - POST /api/v1/crafting/queue/:id/speedup - Speedup craft with CT
 * - POST /api/v1/crafting/queue/:id/collect - Collect completed craft
 * - GET /api/v1/crafting/stats - Get user's crafting stats
 * - GET /api/v1/crafting/leaderboard - Get global crafting leaderboard
 */

const createCraftingController = ({ craftingService }) => {
  const logger = getLogger({ module: 'CraftingController' });

  /**
   * @openapi
   * /api/v1/crafting/blueprints:
   *   get:
   *     summary: List all blueprints with optional filters
   *     tags: [Crafting]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: category
   *         schema:
   *           type: string
   *           enum: [building, unit, item, boost, cosmetic]
   *         description: Filter by category
   *       - in: query
   *         name: rarity
   *         schema:
   *           type: string
   *           enum: [common, rare, epic, legendary, mythic]
   *         description: Filter by rarity
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Search in blueprint name/description
   *     responses:
   *       200:
   *         description: List of blueprints
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   id:
   *                     type: integer
   *                   name:
   *                     type: string
   *                   category:
   *                     type: string
   *                   rarity:
   *                     type: string
   *                   craft_duration_seconds:
   *                     type: integer
   *                   inputs:
   *                     type: object
   *                   outputs:
   *                     type: object
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   */
  const getAllBlueprints = async (req, res) => {
    try {
      const { category, rarity, search } = req.query;
      const blueprints = await craftingService.getAllBlueprints({ category, rarity, search });
      res.json(blueprints);
    } catch (err) {
      (req.logger || logger).error({ err }, 'Error fetching blueprints');
      res.status(err.status || 500).json({ message: err.message || 'Error fetching blueprints' });
    }
  };

  /**
   * @openapi
   * /api/v1/crafting/blueprints/{id}:
   *   get:
   *     summary: Get blueprint details by ID
   *     tags: [Crafting]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Blueprint details
   *       404:
   *         description: Blueprint not found
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   */
  const getBlueprintById = async (req, res) => {
    try {
      const blueprint = await craftingService.getBlueprintById(parseInt(req.params.id));
      res.json(blueprint);
    } catch (err) {
      (req.logger || logger).error({ err, blueprintId: req.params.id }, 'Error fetching blueprint');
      res.status(err.status || 500).json({ message: err.message || 'Error fetching blueprint' });
    }
  };

  /**
   * @openapi
   * /api/v1/crafting/user-blueprints:
   *   get:
   *     summary: Get user's discovered blueprints
   *     tags: [Crafting]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: List of user's blueprints with craft counts
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   id:
   *                     type: integer
   *                   user_id:
   *                     type: integer
   *                   blueprint_id:
   *                     type: integer
   *                   discovered_at:
   *                     type: string
   *                     format: date-time
   *                   discovery_source:
   *                     type: string
   *                   times_crafted:
   *                     type: integer
   *                   Blueprint:
   *                     type: object
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   */
  const getUserBlueprints = async (req, res) => {
    try {
      const userBlueprints = await craftingService.getUserBlueprints(req.user.id);
      res.json(userBlueprints);
    } catch (err) {
      (req.logger || logger).error({ err, userId: req.user.id }, 'Error fetching user blueprints');
      res.status(err.status || 500).json({ message: err.message || 'Error fetching user blueprints' });
    }
  };

  /**
   * @openapi
   * /api/v1/crafting/user-blueprints/{blueprintId}/grant:
   *   post:
   *     summary: Grant a blueprint to user (admin or event trigger)
   *     tags: [Crafting]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: blueprintId
   *         required: true
   *         schema:
   *           type: integer
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               source:
   *                 type: string
   *                 enum: [research, quest, achievement, purchase, admin]
   *                 default: admin
   *     responses:
   *       200:
   *         description: Blueprint granted successfully
   *       400:
   *         description: Blueprint already discovered
   *       404:
   *         description: Blueprint not found
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   */
  const grantBlueprint = async (req, res) => {
    try {
      const blueprintId = parseInt(req.params.blueprintId);
      const { source = 'admin' } = req.body;
      
      const result = await craftingService.grantBlueprint(req.user.id, blueprintId, source);
      (req.logger || logger).audit({ 
        userId: req.user.id, 
        blueprintId, 
        source 
      }, 'Blueprint granted to user');
      
      res.json(result);
    } catch (err) {
      (req.logger || logger).error({ err, userId: req.user.id, blueprintId: req.params.blueprintId }, 'Error granting blueprint');
      res.status(err.status || 500).json({ message: err.message || 'Error granting blueprint' });
    }
  };

  /**
   * @openapi
   * /api/v1/crafting/craft:
   *   post:
   *     summary: Start a new craft
   *     tags: [Crafting]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - blueprintId
   *             properties:
   *               blueprintId:
   *                 type: integer
   *                 description: ID of the blueprint to craft
   *               quantity:
   *                 type: integer
   *                 default: 1
   *                 description: Number of items to craft (future feature)
   *     responses:
   *       201:
   *         description: Craft started successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: integer
   *                 user_id:
   *                   type: integer
   *                 blueprint_id:
   *                   type: integer
   *                 status:
   *                   type: string
   *                 started_at:
   *                   type: string
   *                   format: date-time
   *                 completion_time:
   *                   type: string
   *                   format: date-time
   *       400:
   *         description: Invalid request (no slots, blueprint not discovered, insufficient resources)
   *       404:
   *         description: Blueprint not found
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   */
  const startCraft = async (req, res) => {
    try {
      const { blueprintId, quantity = 1 } = req.body;
      
      if (!blueprintId) {
        return res.status(400).json({ message: 'blueprintId is required' });
      }

      const craft = await craftingService.startCraft(req.user.id, parseInt(blueprintId), quantity);
      (req.logger || logger).audit({ 
        userId: req.user.id, 
        blueprintId, 
        craftId: craft.id 
      }, 'Craft started');
      
      res.status(201).json(craft);
    } catch (err) {
      (req.logger || logger).error({ err, userId: req.user.id, blueprintId: req.body.blueprintId }, 'Error starting craft');
      res.status(err.status || 500).json({ message: err.message || 'Error starting craft' });
    }
  };

  /**
   * @openapi
   * /api/v1/crafting/queue:
   *   get:
   *     summary: Get user's crafting queue (active + completed)
   *     tags: [Crafting]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [in_progress, completed, cancelled, collected]
   *         description: Filter by status
   *     responses:
   *       200:
   *         description: User's crafting queue
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   id:
   *                     type: integer
   *                   blueprint_id:
   *                     type: integer
   *                   status:
   *                     type: string
   *                   started_at:
   *                     type: string
   *                     format: date-time
   *                   completion_time:
   *                     type: string
   *                     format: date-time
   *                   timeRemaining:
   *                     type: integer
   *                     description: Seconds remaining
   *                   progressPercentage:
   *                     type: number
   *                   Blueprint:
   *                     type: object
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   */
  const getUserCrafts = async (req, res) => {
    try {
      const { status } = req.query;
      const crafts = await craftingService.getUserCrafts(req.user.id, status);
      res.json(crafts);
    } catch (err) {
      (req.logger || logger).error({ err, userId: req.user.id }, 'Error fetching user crafts');
      res.status(err.status || 500).json({ message: err.message || 'Error fetching user crafts' });
    }
  };

  /**
   * @openapi
   * /api/v1/crafting/queue/{id}:
   *   delete:
   *     summary: Cancel a craft (50% resource refund)
   *     tags: [Crafting]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Craft cancelled successfully with refund details
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                 craft:
   *                   type: object
   *                 refund:
   *                   type: object
   *       400:
   *         description: Craft cannot be cancelled (already completed/collected)
   *       404:
   *         description: Craft not found
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   */
  const cancelCraft = async (req, res) => {
    try {
      const result = await craftingService.cancelCraft(req.user.id, parseInt(req.params.id));
      (req.logger || logger).audit({ 
        userId: req.user.id, 
        craftId: req.params.id 
      }, 'Craft cancelled');
      
      res.json(result);
    } catch (err) {
      (req.logger || logger).error({ err, userId: req.user.id, craftId: req.params.id }, 'Error cancelling craft');
      res.status(err.status || 500).json({ message: err.message || 'Error cancelling craft' });
    }
  };

  /**
   * @openapi
   * /api/v1/crafting/queue/{id}/speedup:
   *   post:
   *     summary: Speedup craft using CT (instant completion)
   *     tags: [Crafting]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Craft speedup successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                 craft:
   *                   type: object
   *                 ctSpent:
   *                   type: integer
   *       400:
   *         description: Insufficient CT or craft already completed
   *       404:
   *         description: Craft not found
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   */
  const speedupCraft = async (req, res) => {
    try {
      const result = await craftingService.speedupCraft(req.user.id, parseInt(req.params.id));
      (req.logger || logger).audit({ 
        userId: req.user.id, 
        craftId: req.params.id, 
        ctSpent: result.ctSpent 
      }, 'Craft speedup with CT');
      
      res.json(result);
    } catch (err) {
      (req.logger || logger).error({ err, userId: req.user.id, craftId: req.params.id }, 'Error speeding up craft');
      res.status(err.status || 500).json({ message: err.message || 'Error speeding up craft' });
    }
  };

  /**
   * @openapi
   * /api/v1/crafting/queue/{id}/collect:
   *   post:
   *     summary: Collect completed craft and receive outputs
   *     tags: [Crafting]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Craft collected successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                 craft:
   *                   type: object
   *                 outputs:
   *                   type: object
   *                 xpGained:
   *                   type: integer
   *                 leveledUp:
   *                   type: boolean
   *       400:
   *         description: Craft not ready to collect
   *       404:
   *         description: Craft not found
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   */
  const collectCraft = async (req, res) => {
    try {
      const result = await craftingService.collectCraft(req.user.id, parseInt(req.params.id));
      (req.logger || logger).audit({ 
        userId: req.user.id, 
        craftId: req.params.id, 
        xpGained: result.xpGained 
      }, 'Craft collected');
      
      res.json(result);
    } catch (err) {
      (req.logger || logger).error({ err, userId: req.user.id, craftId: req.params.id }, 'Error collecting craft');
      res.status(err.status || 500).json({ message: err.message || 'Error collecting craft' });
    }
  };

  /**
   * @openapi
   * /api/v1/crafting/stats:
   *   get:
   *     summary: Get user's crafting stats (level, XP, achievements)
   *     tags: [Crafting]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User's crafting statistics
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 level:
   *                   type: integer
   *                 total_xp:
   *                   type: integer
   *                 crafts_completed:
   *                   type: integer
   *                 crafts_cancelled:
   *                   type: integer
   *                 resources_consumed:
   *                   type: object
   *                 rarity_achievements:
   *                   type: object
   *                 levelProgress:
   *                   type: object
   *                 bonuses:
   *                   type: object
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   */
  const getUserCraftingStats = async (req, res) => {
    try {
      const stats = await craftingService.getUserCraftingStats(req.user.id);
      res.json(stats);
    } catch (err) {
      (req.logger || logger).error({ err, userId: req.user.id }, 'Error fetching crafting stats');
      res.status(err.status || 500).json({ message: err.message || 'Error fetching crafting stats' });
    }
  };

  /**
   * @openapi
   * /api/v1/crafting/leaderboard:
   *   get:
   *     summary: Get global crafting leaderboard
   *     tags: [Crafting]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *         description: Number of top players to return
   *       - in: query
   *         name: sortBy
   *         schema:
   *           type: string
   *           enum: [level, total_xp, crafts_completed]
   *           default: level
   *     responses:
   *       200:
   *         description: Top crafters leaderboard
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   rank:
   *                     type: integer
   *                   user_id:
   *                     type: integer
   *                   username:
   *                     type: string
   *                   level:
   *                     type: integer
   *                   total_xp:
   *                     type: integer
   *                   crafts_completed:
   *                     type: integer
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   */
  const getLeaderboard = async (req, res) => {
    try {
      const { limit = 10, sortBy = 'level' } = req.query;
      const leaderboard = await craftingService.getLeaderboard(parseInt(limit), sortBy);
      res.json(leaderboard);
    } catch (err) {
      (req.logger || logger).error({ err }, 'Error fetching crafting leaderboard');
      res.status(err.status || 500).json({ message: err.message || 'Error fetching leaderboard' });
    }
  };

  return {
    getAllBlueprints,
    getBlueprintById,
    getUserBlueprints,
    grantBlueprint,
    startCraft,
    getUserCrafts,
    cancelCraft,
    speedupCraft,
    collectCraft,
    getUserCraftingStats,
    getLeaderboard,
  };
};

module.exports = createCraftingController;
