const { getLogger } = require('../utils/logger');
const { getTokenService } = require('../services/TokenService');

const createAuthController = ({ userService, tokenService: injectedTokenService }) => {
  const logger = getLogger({ module: 'AuthController' });
  const tokenService = injectedTokenService || getTokenService();

  /**
   * @openapi
   * /auth/register:
   *   post:
   *     summary: Inscription d'un nouvel utilisateur
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - username
   *               - email
   *               - password
   *             properties:
   *               username:
   *                 type: string
   *                 minLength: 3
   *                 example: "joueur123"
   *               email:
   *                 type: string
   *                 format: email
   *                 example: "joueur@example.com"
   *               password:
   *                 type: string
   *                 minLength: 6
   *                 example: "motdepasse123"
   *     responses:
   *       201:
   *         description: Utilisateur créé avec succès
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 token:
   *                   type: string
   *                   description: Access token JWT
   *                 refreshToken:
   *                   type: string
   *                   description: Refresh token pour renouveler la session
   *                 user:
   *                   $ref: '#/components/schemas/User'
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       429:
   *         $ref: '#/components/responses/TooManyRequests'
   */
  const registerUser = async (req, res) => {
    const { username, email, password } = req.body;
    try {
      const { token, refreshToken, user } = await userService.registerUser({ username, email, password });
      res.status(201).json({ token, refreshToken, user });
      (req.logger || logger).audit({ userId: user.id, username, email }, 'User registration');
    } catch (error) {
      (req.logger || logger).error({ err: error }, 'Registration failed');
      res.status(error.status || 500).json({ message: "Erreur lors de l'inscription : " + error.message });
    }
  };

  /**
   * @openapi
   * /auth/login:
   *   post:
   *     summary: Connexion utilisateur
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - username
   *               - password
   *             properties:
   *               username:
   *                 type: string
   *                 example: "joueur123"
   *               password:
   *                 type: string
   *                 example: "motdepasse123"
   *     responses:
   *       200:
   *         description: Connexion réussie
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 token:
   *                   type: string
   *                   description: Access token JWT valide 2h
   *                 refreshToken:
   *                   type: string
   *                   description: Refresh token valide 7 jours
   *                 user:
   *                   $ref: '#/components/schemas/User'
   *       401:
   *         description: Identifiants invalides
   *       429:
   *         $ref: '#/components/responses/TooManyRequests'
   */
  const loginUser = async (req, res) => {
    const { username, password } = req.body;
    try {
      const { token, refreshToken, user } = await userService.loginUser({ username, password });
      res.json({ token, refreshToken, user });
      (req.logger || logger).audit({ userId: user.id, username }, 'User login');
    } catch (error) {
      (req.logger || logger).error({ err: error }, 'Login failed');
      res.status(error.status || 500).json({ message: 'Erreur lors de la connexion' });
    }
  };

  const refreshSession = async (req, res) => {
    const { refreshToken } = req.body;

    try {
      const { token, refreshToken: rotatedToken, user } = await userService.refreshSession(refreshToken);
      res.json({ token, refreshToken: rotatedToken, user });
      (req.logger || logger).audit({ userId: user.id }, 'Session refreshed');
    } catch (error) {
      (req.logger || logger).error({ err: error }, 'Refresh session failed');
      res.status(error.status || 500).json({ message: error.message || 'Erreur lors du rafraîchissement' });
    }
  };

  /**
   * @openapi
   * /auth/logout:
   *   post:
   *     summary: Déconnexion et révocation du token
   *     tags: [Auth]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Déconnexion réussie, token révoqué
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Déconnexion réussie
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   */
  const logout = async (req, res) => {
    try {
      // Le token est dans req.user.token (ajouté par authMiddleware)
      const token = req.headers.authorization?.split(' ')[1];
      
      if (token && tokenService) {
        await tokenService.revokeToken(token);
      }
      
      res.json({ message: 'Déconnexion réussie' });
      (req.logger || logger).audit({ userId: req.user?.id }, 'User logged out');
    } catch (error) {
      (req.logger || logger).error({ err: error, userId: req.user?.id }, 'Logout failed');
      res.status(500).json({ message: 'Erreur lors de la déconnexion' });
    }
  };

  return {
    registerUser,
    loginUser,
    refreshSession,
    logout,
  };
};

module.exports = createAuthController;