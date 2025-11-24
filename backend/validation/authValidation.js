const { Joi, Segments } = require('celebrate');

const registerSchema = {
  [Segments.BODY]: Joi.object({
    username: Joi.string().min(3).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  }),
};

const loginSchema = {
  [Segments.BODY]: Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required(),
  }),
};

const refreshSchema = {
  [Segments.BODY]: Joi.object({
    refreshToken: Joi.string().required(),
  }),
};

module.exports = { registerSchema, loginSchema, refreshSchema };