const { z } = require('zod');

/**
 * Schéma de validation pour créer une route commerciale
 */
const createTradeRouteSchema = z.object({
  body: z.object({
    originCityId: z.number().int().positive(),
    destinationCityId: z.number().int().positive(),
    routeType: z.enum(['internal', 'external']),
    autoTransfer: z.object({
      gold: z.number().int().min(0).optional(),
      metal: z.number().int().min(0).optional(),
      fuel: z.number().int().min(0).optional()
    }).optional(),
    transferFrequency: z.number().int().positive().max(86400, 'Fréquence max: 24h').optional(),
    tradeOffer: z.object({
      gold: z.number().int().min(0).optional(),
      metal: z.number().int().min(0).optional(),
      fuel: z.number().int().min(0).optional()
    }).optional(),
    tradeRequest: z.object({
      gold: z.number().int().min(0).optional(),
      metal: z.number().int().min(0).optional(),
      fuel: z.number().int().min(0).optional()
    }).optional()
  }).refine(data => data.originCityId !== data.destinationCityId, {
    message: 'Origine et destination doivent être différentes'
  })
});

/**
 * Schéma de validation pour modifier une route
 */
const updateTradeRouteSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID de route invalide')
  }),
  body: z.object({
    status: z.enum(['active', 'paused', 'cancelled']).optional(),
    autoTransfer: z.object({
      gold: z.number().int().min(0).optional(),
      metal: z.number().int().min(0).optional(),
      fuel: z.number().int().min(0).optional()
    }).optional(),
    transferFrequency: z.number().int().positive().max(86400).optional()
  })
});

/**
 * Schéma de validation pour envoyer un convoi manuel
 */
const sendConvoySchema = z.object({
  body: z.object({
    tradeRouteId: z.number().int().positive(),
    cargo: z.object({
      gold: z.number().int().min(0).max(1000000),
      metal: z.number().int().min(0).max(1000000),
      fuel: z.number().int().min(0).max(1000000)
    }).refine(data => data.gold > 0 || data.metal > 0 || data.fuel > 0, {
      message: 'Le convoi doit transporter au moins une ressource'
    }),
    escortUnits: z.array(z.object({
      entityId: z.number().int().positive(),
      quantity: z.number().int().positive().max(100)
    })).optional()
  })
});

/**
 * Schéma de validation pour récupérer les routes
 */
const getRoutesSchema = z.object({
  query: z.object({
    status: z.enum(['active', 'paused', 'cancelled']).optional(),
    routeType: z.enum(['internal', 'external']).optional()
  })
});

module.exports = {
  createTradeRouteSchema,
  updateTradeRouteSchema,
  sendConvoySchema,
  getRoutesSchema
};
