// backend/controllers/authController.js

const createAuthController = ({ userService }) => {
  const registerUser = async (req, res) => {
    const { username, email, password } = req.body;
    try {
      const { token, refreshToken, user } = await userService.registerUser({ username, email, password });
      res.status(201).json({ token, refreshToken, user });
    } catch (error) {
      console.error(error);
      res.status(error.status || 500).json({ message: "Erreur lors de l'inscription : " + error.message });
    }
  };

  const loginUser = async (req, res) => {
    const { username, password } = req.body;
    try {
      const { token, refreshToken, user } = await userService.loginUser({ username, password });
      res.json({ token, refreshToken, user });
    } catch (error) {
      console.error(error);
      res.status(error.status || 500).json({ message: 'Erreur lors de la connexion' });
    }
  };

  const refreshSession = async (req, res) => {
    const { refreshToken } = req.body;

    try {
      const { token, refreshToken: rotatedToken, user } = await userService.refreshSession(refreshToken);
      res.json({ token, refreshToken: rotatedToken, user });
    } catch (error) {
      console.error(error);
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