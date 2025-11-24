const { Joi, Segments } = require('celebrate');

const upgradeBuildingSchema = {
  [Segments.PARAMS]: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
};

const saveUserResourcesSchema = {
  [Segments.BODY]: Joi.object({
    resources: Joi.array()
      .items(
        Joi.object({
          type: Joi.string().required(),
          amount: Joi.number().optional(),
        })
      )
      .required(),
  }),
};

module.exports = {
  upgradeBuildingSchema,
  saveUserResourcesSchema,
};