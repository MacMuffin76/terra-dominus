const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { getLogger } = require('../utils/logger');
const { getJwtSecret } = require('../config/jwtConfig');
const { getTokenService } = require('../services/TokenService');

const logger = getLogger({ module: 'AuthMiddleware' });
const JWT_SECRET = getJwtSecret();
const tokenService = getTokenService();

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      
      // Vérifier si le token est dans la blacklist
      if (await tokenService.isTokenBlacklisted(token)) {
        return res.status(401).json({ message: 'Token révoqué' });
      }
      
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = await User.findByPk(decoded.id);

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }
      
      // Vérifier la révocation globale de l'utilisateur
      if (!(await tokenService.isTokenValidForUser(decoded))) {
        return res.status(401).json({ message: 'Token invalidé par révocation globale' });
      }

      next();
    } catch (error) {
      (req.logger || logger).error({ err: error }, 'JWT validation failed');
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
});

module.exports = { protect };