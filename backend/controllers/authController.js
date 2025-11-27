const { getLogger } = require('./utils/logger');

const createAuthController = ({ userService }) => {
  const logger = getLogger({ module: 'AuthController' });

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

  return {
    registerUser,
    loginUser,
    refreshSession,
  };
};

module.exports = createAuthController;