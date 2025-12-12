/**
 * Script de test pour vérifier la validation des attaques
 * Usage: node test_attack_validation.js
 */

const { z } = require('zod');

// Copie du schéma de validation
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

// Test cases
const testCases = [
  {
    name: 'Cas valide avec nombres',
    data: {
      body: {
        fromCityId: 1,
        toCityId: 2,
        attackType: 'raid',
        units: [
          { entityId: 10, quantity: 50 }
        ]
      },
      query: {},
      params: {}
    },
    shouldPass: true
  },
  {
    name: 'Cas valide avec strings (coercion)',
    data: {
      body: {
        fromCityId: "1",
        toCityId: "2",
        attackType: 'raid',
        units: [
          { entityId: "10", quantity: "50" }
        ]
      },
      query: {},
      params: {}
    },
    shouldPass: true
  },
  {
    name: 'Cas invalide - ville cible = ville attaquante',
    data: {
      body: {
        fromCityId: 1,
        toCityId: 1,
        attackType: 'raid',
        units: [
          { entityId: 10, quantity: 50 }
        ]
      },
      query: {},
      params: {}
    },
    shouldPass: false
  },
  {
    name: 'Cas invalide - pas d\'unités',
    data: {
      body: {
        fromCityId: 1,
        toCityId: 2,
        attackType: 'raid',
        units: []
      },
      query: {},
      params: {}
    },
    shouldPass: false
  },
  {
    name: 'Cas invalide - type d\'attaque incorrect',
    data: {
      body: {
        fromCityId: 1,
        toCityId: 2,
        attackType: 'invalid',
        units: [
          { entityId: 10, quantity: 50 }
        ]
      },
      query: {},
      params: {}
    },
    shouldPass: false
  }
];

// Run tests
console.log('🧪 Test de validation des attaques\n');

testCases.forEach((testCase, index) => {
  try {
    launchAttackSchema.parse(testCase.data);
    if (testCase.shouldPass) {
      console.log(`✅ Test ${index + 1}: ${testCase.name} - PASS`);
    } else {
      console.log(`❌ Test ${index + 1}: ${testCase.name} - FAIL (devait échouer mais a passé)`);
    }
  } catch (error) {
    if (!testCase.shouldPass) {
      console.log(`✅ Test ${index + 1}: ${testCase.name} - PASS (erreur attendue)`);
      console.log(`   Erreur: ${error.errors[0].message}`);
    } else {
      console.log(`❌ Test ${index + 1}: ${testCase.name} - FAIL`);
      console.log(`   Erreur inattendue:`, error.errors);
    }
  }
  console.log('');
});

console.log('✨ Tests terminés\n');
