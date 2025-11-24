const { z } = require('zod');

const userConnectedSchema = z.object({
  userId: z.number().int().positive().optional(),
});

module.exports = { userConnectedSchema };