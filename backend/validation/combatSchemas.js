const { z } = require('zod');

/**
 * Schéma de validation pour lancer une attaque
 */
const launchAttackSchema = z.object({
  body: z.object({
    fromCityId: z.coerce.number().int().positive({
      message: 'fromCityId doit être un nombre entier positif'
    }),
    toCityId: z.coerce.number().int().positive({
      message: 'toCityId doit être un nombre entier positif'
    }),
    attackType: z.enum(['raid', 'conquest', 'siege'], {
      errorMap: () => ({ message: 'Type d\'attaque invalide. Doit être raid, conquest ou siege' })
    }),
    formation: z.enum(['line', 'wedge', 'echelon']).optional(),
    speedFactor: z.coerce.number().min(0.5).max(2).optional(),
    units: z.array(z.object({
      entityId: z.coerce.number().int().positive(),
      quantity: z.coerce.number().int().positive()
    })).min(1, 'Au moins une unité doit être envoyée')
  }).refine(data => data.fromCityId !== data.toCityId, {
    message: 'Une ville ne peut pas s\'attaquer elle-même'
  })
});

/**
 * Schéma de validation pour lancer une mission d'espionnage
 */
const launchSpyMissionSchema = z.object({
  body: z.object({
    fromCityId: z.coerce.number().int().positive(),
    targetCityId: z.coerce.number().int().positive(),
    missionType: z.enum(['reconnaissance', 'military_intel', 'sabotage']),
    spyCount: z.coerce.number().int().positive().max(100, 'Maximum 100 espions par mission')
  }).refine(data => data.fromCityId !== data.targetCityId, {
    message: 'Une ville ne peut pas s\'espionner elle-même'
  })
});

/**
 * Schéma de validation pour annuler une attaque
 */
const cancelAttackSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID d\'attaque invalide')
  })
});

/**
 * Schéma de validation pour récupérer les attaques
 */
const getAttacksSchema = z.object({
  query: z.object({
    role: z.enum(['attacker', 'defender']).optional(),
    status: z.enum(['traveling', 'arrived', 'completed']).optional(),
    limit: z.string().regex(/^\d+$/).optional().transform(val => val ? parseInt(val) : undefined),
    offset: z.string().regex(/^\d+$/).optional().transform(val => val ? parseInt(val) : undefined)
  })
});

/**
 * Schéma de validation pour récupérer un rapport de combat
 */
const getReportSchema = z.object({
  params: z.object({
    attackId: z.string().regex(/^\d+$/, 'ID d\'attaque invalide')
  })
});

module.exports = {
  launchAttackSchema,
  launchSpyMissionSchema,
  cancelAttackSchema,
  getAttacksSchema,
  getReportSchema
};
