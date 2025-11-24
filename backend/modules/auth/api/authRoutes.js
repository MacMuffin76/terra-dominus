const { Router } = require('express');
const validate = require('../../../middleware/validate');
const { registerSchema, loginSchema } = require('../../../validation/authValidation');

const createAuthRouter = (container) => {
  const router = Router();
  const controller = container.resolve('authController');

  router.post('/register', validate(registerSchema), controller.registerUser);
  router.post('/login', validate(loginSchema), controller.loginUser);

  return router;
};

module.exports = createAuthRouter;