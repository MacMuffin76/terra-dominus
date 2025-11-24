const express = require('express');
const validate = require('../../../middleware/validate');
const { registerSchema, loginSchema, refreshSchema } = require('../../../validation/authValidation');

module.exports = (container) => {
  const router = express.Router();
  const controller = container.resolve('authController');

  router.post('/register', validate(registerSchema), controller.registerUser);
  router.post('/login', validate(loginSchema), controller.loginUser);
  router.post('/refresh', validate(refreshSchema), controller.refreshSession);

  return router;
};