const express = require('express');
const router = express.Router();
const protectionController = require('../controllers/protectionController');
const { protect } = require('../middleware/authMiddleware');

/**
 * @openapi
 * /protection/status:
 *   get:
 *     summary: Get protection shield status for current user
 *     tags: [Protection]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Protection status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hasActiveShield:
 *                   type: boolean
 *                 shieldExpiresAt:
 *                   type: string
 *                   format: date-time
 *                 remainingTime:
 *                   type: string
 *                   example: "48h 30m"
 *                 attacksSent:
 *                   type: integer
 *                 maxAttacksBeforeShieldLoss:
 *                   type: integer
 *                 cityCount:
 *                   type: integer
 *                 maxCitiesWithShield:
 *                   type: integer
 *                 shieldWarning:
 *                   type: string
 *                   nullable: true
 */
router.get('/status', protect, protectionController.getProtectionStatus);

/**
 * @openapi
 * /protection/can-attack/{targetUserId}:
 *   get:
 *     summary: Check if current user can attack target user
 *     tags: [Protection]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: targetUserId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Attack permission check
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 canAttack:
 *                   type: boolean
 *                 reason:
 *                   type: string
 *                   nullable: true
 *                 attackerWarning:
 *                   type: string
 *                   nullable: true
 *                 targetHasShield:
 *                   type: boolean
 *                 targetShieldExpires:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 */
router.get('/can-attack/:targetUserId', protect, protectionController.canAttackTarget);

module.exports = router;
