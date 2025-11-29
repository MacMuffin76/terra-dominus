const swaggerJsdoc = require('swagger-jsdoc');

/**
 * Configuration Swagger/OpenAPI pour Terra Dominus API
 * 
 * Pour ajouter de la documentation à vos endpoints:
 * 
 * @openapi
 * /endpoint:
 *   post:
 *     summary: Description courte
 *     tags: [NomDuModule]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               field:
 *                 type: string
 *     responses:
 *       201:
 *         description: Success
 */

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Terra Dominus API',
      version: '1.0.0',
      description: 'API REST pour le jeu RTS Terra Dominus - Stratégie territoriale en temps réel',
      contact: {
        name: 'Terra Dominus Team',
        url: 'https://github.com/MacMuffin76/terra-dominus'
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000/api/v1',
        description: 'Serveur de développement'
      },
      {
        url: 'https://api.terra-dominus.com/api/v1',
        description: 'Serveur de production'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtenu via /auth/login'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: 'Bad Request'
            },
            message: {
              type: 'string',
              example: 'Description de l\'erreur'
            }
          }
        },
        City: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Capitale' },
            userId: { type: 'integer', example: 1 },
            coordX: { type: 'integer', example: 50 },
            coordY: { type: 'integer', example: 50 },
            visionRange: { type: 'integer', example: 5 },
            foundedAt: { type: 'string', format: 'date-time' }
          }
        },
        Resource: {
          type: 'object',
          properties: {
            gold: { type: 'integer', example: 10000 },
            metal: { type: 'integer', example: 5000 },
            fuel: { type: 'integer', example: 3000 },
            energy: { type: 'integer', example: 2000 }
          }
        },
        Attack: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            attackerId: { type: 'integer', example: 1 },
            defenderId: { type: 'integer', example: 2 },
            attackerCityId: { type: 'integer', example: 10 },
            defenderCityId: { type: 'integer', example: 20 },
            attackType: { 
              type: 'string', 
              enum: ['raid', 'conquest', 'siege'],
              example: 'raid'
            },
            status: {
              type: 'string',
              enum: ['traveling', 'arrived', 'completed', 'cancelled'],
              example: 'traveling'
            },
            departureTime: { type: 'string', format: 'date-time' },
            arrivalTime: { type: 'string', format: 'date-time' },
            distance: { type: 'integer', example: 20 },
            loot: { $ref: '#/components/schemas/Resource' },
            outcome: {
              type: 'string',
              enum: ['attacker_victory', 'defender_victory', 'draw'],
              nullable: true
            }
          }
        },
        ColonizationMission: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            userId: { type: 'integer', example: 1 },
            departureCityId: { type: 'integer', example: 1 },
            targetSlotId: { type: 'integer', example: 42 },
            status: {
              type: 'string',
              enum: ['traveling', 'arrived', 'completed', 'cancelled'],
              example: 'traveling'
            },
            departureTime: { type: 'string', format: 'date-time' },
            arrivalTime: { type: 'string', format: 'date-time' },
            distance: { type: 'integer', example: 15 }
          }
        },
        TradeRoute: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            ownerId: { type: 'integer', example: 1 },
            originCityId: { type: 'integer', example: 1 },
            destinationCityId: { type: 'integer', example: 2 },
            routeType: {
              type: 'string',
              enum: ['internal', 'external'],
              example: 'internal'
            },
            status: {
              type: 'string',
              enum: ['active', 'paused', 'cancelled'],
              example: 'active'
            },
            distance: { type: 'integer', example: 10 },
            autoTransfer: { $ref: '#/components/schemas/Resource' },
            transferFrequency: { type: 'integer', example: 3600 },
            totalTraded: { $ref: '#/components/schemas/Resource' }
          }
        }
      },
      responses: {
        Unauthorized: {
          description: 'Non authentifié - Token JWT manquant ou invalide',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                error: 'Unauthorized',
                message: 'Not authorized, no token'
              }
            }
          }
        },
        Forbidden: {
          description: 'Accès interdit - Permissions insuffisantes',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        NotFound: {
          description: 'Ressource non trouvée',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        BadRequest: {
          description: 'Requête invalide - Validation échouée',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        TooManyRequests: {
          description: 'Trop de requêtes - Rate limit dépassé',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: { type: 'string', example: 'Too Many Requests' },
                  message: { type: 'string' },
                  retryAfter: { type: 'integer', example: 60 }
                }
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Auth',
        description: 'Authentification et gestion des utilisateurs'
      },
      {
        name: 'Cities',
        description: 'Gestion des villes et multi-villes'
      },
      {
        name: 'Resources',
        description: 'Ressources et production'
      },
      {
        name: 'Buildings',
        description: 'Bâtiments et construction'
      },
      {
        name: 'Combat',
        description: 'Système de combat et espionnage'
      },
      {
        name: 'Colonization',
        description: 'Colonisation et expansion territoriale'
      },
      {
        name: 'Trade',
        description: 'Commerce inter-villes et routes commerciales'
      },
      {
        name: 'World',
        description: 'Carte du monde et exploration'
      },
      {
        name: 'Research',
        description: 'Recherches et technologies'
      },
      {
        name: 'Units',
        description: 'Unités militaires et entraînement'
      }
    ]
  },
  // Chemins vers les fichiers contenant les annotations OpenAPI
  apis: [
    './modules/*/api/*.js',
    './routes/*.js',
    './controllers/*.js'
  ]
};

const specs = swaggerJsdoc(options);

module.exports = specs;
