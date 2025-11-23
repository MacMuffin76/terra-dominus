// backend/controllers/authController.js

const userService = require('../services/userService');

const registerUser = async (req, res) => {
  const { username, email, password } = req.body;
  try { const { token, user } = await userService.registerUser({ username, email, password });
    res.status(201).json({ token, user });
  } catch (error) {
    console.error(error);
    res.status(error.status || 500).json({ message: "Erreur lors de l'inscription : " + error.message });
  }
};

const loginUser = async (req, res) => {
  const { username, password } = req.body;
  try {const { token, user } = await userService.loginUser({ username, password });
    res.json({ token, user });
  } catch (error) {
    console.error(error);
    res.status(error.status || 500).json({ message: 'Erreur lors de la connexion' });
  }
};

