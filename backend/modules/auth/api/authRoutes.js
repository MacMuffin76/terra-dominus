// modules/auth/api/authRoutes.js

const express = require("express");
const router = express.Router();

const authController = require("../../../controllers/authController");
const validate = require("../../../middleware/validate");
const authMiddleware = require("../../../middleware/authMiddleware");
const authValidation = require("../../../validation/authValidation");

// Routes d’authentification

// Inscription
router.post(
  "/register",
  validate(authValidation.registerSchema),
  authController.register
);

// Login
router.post(
  "/login",
  validate(authValidation.loginSchema),
  authController.login
);

// Refresh token
router.post(
  "/refresh-token",
  validate(authValidation.refreshTokenSchema),
  authController.refreshToken
);

// Logout (nécessite d’être connecté)
router.post("/logout", authMiddleware, authController.logout);

// Récupérer le profil utilisateur connecté
router.get("/me", authMiddleware, authController.getCurrentUser);

// Récupérer un utilisateur par id (optionnel, si contrôleur existant)
router.get("/user/:id", authMiddleware, authController.getUserById);

module.exports = router;
