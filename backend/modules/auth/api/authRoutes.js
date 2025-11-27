const express = require('express');
const validate = require('../../../middleware/validate');
const authMiddleware = require('../../../middleware/authMiddleware');
const { registerSchema, loginSchema, refreshSchema } = require('../../../validation/authValidation');

module.exports = (container) => {
  const router = express.Router();
  const controller = container.resolve('authController');
  const userService = container.resolve('userService');

  // Inscription
  router.post('/register', validate(registerSchema), controller.registerUser);

  // Connexion
  router.post('/login', validate(loginSchema), controller.loginUser);

  // Refresh du token
  router.post('/refresh', validate(refreshSchema), controller.refreshSession);

  // 🔹 Récupérer les infos d’un utilisateur pour le dashboard
  //    GET /api/v1/auth/user/:id
  router.get('/user/:id', authMiddleware, async (req, res, next) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'ID utilisateur invalide',
        });
      }

      const user = await userService.getUserById(id);

      if (!user) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Utilisateur non trouvé',
        });
      }

      // On renvoie la même forme globale que login/register : { user: { ... } }
      const safeUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        points_experience: user.points_experience,
        two_factor_enabled: user.two_factor_enabled,
        rang: user.rang,
      };

      return res.json({ user: safeUser });
    } catch (err) {
      return next(err);
    }
  });

  return router;
};
