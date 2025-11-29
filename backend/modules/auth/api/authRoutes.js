// backend/modules/auth/api/authRoutes.js

const express = require('express');
const validate = require('../../../middleware/validate');
const {
  registerSchema,
  loginSchema,
  refreshSchema,
} = require('../../../validation/authValidation');

/**
 * Router d’auth basé sur le container (même pattern que les autres modules)
 * @param {AwilixContainer} container
 * @returns {express.Router}
 */
module.exports = (container) => {
  const router = express.Router();

  // On récupère le contrôleur injecté par le container
  const controller = container.resolve('authController');

  // POST /api/v1/auth/register
  router.post('/register', validate(registerSchema), controller.registerUser);

  // POST /api/v1/auth/login
  router.post('/login', validate(loginSchema), controller.loginUser);

  // POST /api/v1/auth/refresh
  router.post('/refresh', validate(refreshSchema), controller.refreshSession);

  // POST /api/v1/auth/logout - Révocation de token
  const { protect } = require('../../../middleware/authMiddleware');
  router.post('/logout', protect, controller.logout);

  return router;
};
