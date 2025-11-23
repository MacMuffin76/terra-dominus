const { checkSchema, validationResult } = require('express-validator');

const validate = (schema) => {
  const validationChain = checkSchema(schema);

  return [
    ...validationChain,
    (req, res, next) => {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      return next();
    },
  ];
};

module.exports = validate;