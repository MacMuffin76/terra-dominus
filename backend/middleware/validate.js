const { celebrate, Joi, Segments, errors, isCelebrateError } = require('celebrate');

const validate = (schema) => celebrate(schema, { abortEarly: false, stripUnknown: true });

const validationErrorHandler = errors();

module.exports = validate;
module.exports.Joi = Joi;
module.exports.Segments = Segments;
module.exports.validationErrorHandler = validationErrorHandler;
module.exports.isCelebrateError = isCelebrateError;