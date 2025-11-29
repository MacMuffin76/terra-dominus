const { z } = require('zod');

/**
 * Schéma de validation pour lancer une colonisation
 */
const startColonizationSchema = z.object({
  body: z.object({
    slotId: z.number().int().positive({
      message: 'slotId doit être un nombre entier positif'
    }),
    cityId: z.number().int().positive().optional()
  })
});

/**
 * Schéma de validation pour annuler une mission de colonisation
 */
const cancelMissionSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID de mission invalide')
  })
});

/**
 * Schéma de validation pour récupérer les missions
 */
const getMissionsSchema = z.object({
  query: z.object({
    status: z.enum(['traveling', 'arrived', 'cancelled']).optional()
  })
});

module.exports = {
  startColonizationSchema,
  cancelMissionSchema,
  getMissionsSchema
};
