// Mock du logger avant d'importer le service
jest.mock('../../../../utils/logger', () => ({
  getLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  })),
  runWithContext: (contextOrFn, maybeFn) => {
    if (typeof maybeFn === 'function') {
      return maybeFn();
    }
    return contextOrFn();
  }
}));

const CombatService = require('../CombatService');

/**
 * Tests pour CombatService
 */
describe('CombatService', () => {
  let combatService;
  let mockCombatRepository;
  let mockCity;
  let mockUnit;
  let mockResource;
  let mockBuilding;
  let mockResearch;
  let mockSequelize;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCombatRepository = {
      createAttack: jest.fn(async (data) => ({ id: 1, ...data })),
      getAttackById: jest.fn(),
      getUserAttacks: jest.fn(async () => [])
    };

    mockCity = {
      findByPk: jest.fn()
    };

    mockUnit = {
      findOne: jest.fn(),
      decrement: jest.fn()
    };

    mockResource = {
      findOne: jest.fn()
    };

    mockBuilding = {
      findAll: jest.fn(async () => [])
    };

    mockResearch = {
      findAll: jest.fn(async () => [])
    };

    mockSequelize = {
      transaction: jest.fn(async () => ({
        commit: jest.fn(),
        rollback: jest.fn(),
        LOCK: { UPDATE: 'UPDATE' }
      }))
    };

    combatService = new CombatService({
      combatRepository: mockCombatRepository,
      City: mockCity,
      Unit: mockUnit,
      Resource: mockResource,
      Building: mockBuilding,
      Research: mockResearch,
      sequelize: mockSequelize
    });
  });

  describe('launchAttack', () => {
    it('should reject attack on own city', async () => {
      const attackData = {
        attackerCityId: 1,
        defenderCityId: 2,
        attackType: 'raid',
        units: [{ entityId: 1, quantity: 10 }]
      };

      mockCity.findByPk
        .mockResolvedValueOnce({ id: 1, user_id: 1, coord_x: 10, coord_y: 10 })
        .mockResolvedValueOnce({ id: 2, user_id: 1, coord_x: 15, coord_y: 15 });

      await expect(
        combatService.launchAttack(1, attackData)
      ).rejects.toThrow('Impossible d\'attaquer votre propre ville');
    });

    it('should return draw when forces are equal', () => {
      const result = calculateCombatOutcome(500, 500);
      
      expect(result.outcome).toBe('draw');
      expect(result.attackerLosses).toBeGreaterThan(0);
      expect(result.defenderLosses).toBeGreaterThan(0);
    });

    it('should calculate correct loot for raid', () => {
      const resources = { gold: 10000, metal: 5000, fuel: 3000 };
      const result = calculateCombatOutcome(1000, 500, { 
        attackType: 'raid',
        defenderResources: resources
      });
      
      expect(result.loot.gold).toBe(3000); // 30% de 10000
      expect(result.loot.metal).toBe(1500);
      expect(result.loot.fuel).toBe(900);
    });

    it('should calculate higher loot for conquest', () => {
      const resources = { gold: 10000, metal: 5000, fuel: 3000 };
      const resultRaid = calculateCombatOutcome(1000, 500, { 
        attackType: 'raid',
        defenderResources: resources
      });
      const resultConquest = calculateCombatOutcome(1000, 500, { 
        attackType: 'conquest',
        defenderResources: resources
      });
      
      expect(resultConquest.loot.gold).toBeGreaterThan(resultRaid.loot.gold);
    });

    it('should apply walls defense bonus', () => {
      const resultNoWalls = calculateCombatOutcome(1000, 500, { wallsLevel: 0 });
      const resultWithWalls = calculateCombatOutcome(1000, 500, { wallsLevel: 5 });
      
      // Avec des murs, le défenseur devrait avoir moins de pertes
      expect(resultWithWalls.defenderLosses).toBeLessThan(resultNoWalls.defenderLosses);
    });

    it('should apply technology bonuses', () => {
      const resultNoTech = calculateCombatOutcome(1000, 500, { 
        attackerTechLevel: 0,
        defenderTechLevel: 0
      });
      const resultWithTech = calculateCombatOutcome(1000, 500, { 
        attackerTechLevel: 5,
        defenderTechLevel: 0
      });
      
      // Avec tech, l'attaquant devrait avoir moins de pertes
      expect(resultWithTech.attackerLosses).toBeLessThan(resultNoTech.attackerLosses);
    });
  });

  describe('simulateCombatRounds', () => {
    it('should return combat log with multiple rounds', () => {
      const attackers = [
        { name: 'Soldat', quantity: 50, attackPower: 10, defensePower: 5 },
        { name: 'Archer', quantity: 30, attackPower: 15, defensePower: 3 }
      ];
      const defenders = [
        { name: 'Soldat', quantity: 40, attackPower: 10, defensePower: 5 }
      ];

      const result = simulateCombatRounds(attackers, defenders);

      expect(result.rounds).toBeGreaterThan(0);
      expect(result.rounds).toBeLessThanOrEqual(10); // Max 10 rounds
      expect(result.combatLog).toBeInstanceOf(Array);
      expect(result.combatLog.length).toBe(result.rounds);
      expect(result.finalAttackerForce).toBeGreaterThanOrEqual(0);
      expect(result.finalDefenderForce).toBeGreaterThanOrEqual(0);
    });

    it('should end when one side is eliminated', () => {
      const attackers = [
        { name: 'Soldat', quantity: 100, attackPower: 20, defensePower: 10 }
      ];
      const defenders = [
        { name: 'Soldat', quantity: 10, attackPower: 5, defensePower: 3 }
      ];

      const result = simulateCombatRounds(attackers, defenders);

      expect(result.finalDefenderForce).toBe(0);
      expect(result.finalAttackerForce).toBeGreaterThan(0);
    });

    it('should handle empty defender units', () => {
      const attackers = [
        { name: 'Soldat', quantity: 50, attackPower: 10, defensePower: 5 }
      ];
      const defenders = [];

      const result = simulateCombatRounds(attackers, defenders);

      expect(result.rounds).toBe(0);
      expect(result.finalAttackerForce).toBeGreaterThan(0);
      expect(result.finalDefenderForce).toBe(0);
    });
  });
});

/**
 * Tests pour CombatService
 */
describe('CombatService', () => {
  let combatService;
  let mockCombatRepository;
  let mockCity;
  let mockUnit;
  let mockResource;
  let mockSequelize;

  beforeEach(() => {
    // Mocks
    mockCombatRepository = {
      createAttack: jest.fn(),
      createAttackWave: jest.fn(),
      getAttackById: jest.fn(),
      updateAttack: jest.fn(),
      createDefenseReport: jest.fn(),
      getAttacksByUser: jest.fn()
    };

    mockCity = {
      findByPk: jest.fn(),
      findOne: jest.fn()
    };

    mockUnit = {
      findAll: jest.fn(),
      bulkCreate: jest.fn(),
      destroy: jest.fn()
    };

    mockResource = {
      findOne: jest.fn(),
      update: jest.fn()
    };

    mockSequelize = {
      transaction: jest.fn((callback) => callback({
        commit: jest.fn(),
        rollback: jest.fn()
      }))
    };

    // Importer le service (à adapter selon votre structure)
    const CombatService = require('../application/CombatService');
    combatService = new CombatService({
      combatRepository: mockCombatRepository,
      City: mockCity,
      Unit: mockUnit,
      Resource: mockResource,
      sequelize: mockSequelize
    });
  });

  describe('launchAttack', () => {
    it('should reject attack on same city', async () => {
      await expect(
        combatService.launchAttack(1, {
          fromCityId: 100,
          toCityId: 100,
          attackType: 'raid',
          units: [{ entityId: 1, quantity: 10 }]
        })
      ).rejects.toThrow('Une ville ne peut pas s\'attaquer elle-même');
    });

    it('should reject if insufficient units', async () => {
      mockCity.findByPk.mockResolvedValue({ 
        id: 100, 
        userId: 1,
        name: 'Ma Ville'
      });

      mockUnit.findAll.mockResolvedValue([
        { entityId: 1, quantity: 5 } // Seulement 5 disponibles
      ]);

      await expect(
        combatService.launchAttack(1, {
          fromCityId: 100,
          toCityId: 200,
          attackType: 'raid',
          units: [{ entityId: 1, quantity: 10 }] // Demande 10
        })
      ).rejects.toThrow('Unités insuffisantes');
    });

    it('should reject if insufficient resources', async () => {
      mockCity.findByPk.mockResolvedValue({ 
        id: 100, 
        userId: 1,
        coordX: 0,
        coordY: 0
      });

      mockCity.findOne.mockResolvedValue({
        id: 200,
        userId: 2,
        coordX: 10,
        coordY: 10
      });

      mockUnit.findAll.mockResolvedValue([
        { entityId: 1, quantity: 50 }
      ]);

      mockResource.findOne.mockResolvedValue({
        gold: 100, // Pas assez
        metal: 100,
        fuel: 100
      });

      await expect(
        combatService.launchAttack(1, {
          fromCityId: 100,
          toCityId: 200,
          attackType: 'raid',
          units: [{ entityId: 1, quantity: 10 }]
        })
      ).rejects.toThrow('Ressources insuffisantes');
    });

    it('should create attack and deduct units/resources', async () => {
      mockCity.findByPk.mockResolvedValueOnce({ 
        id: 100, 
        userId: 1,
        coordX: 0,
        coordY: 0,
        name: 'Attacker City'
      });

      mockCity.findOne.mockResolvedValue({
        id: 200,
        userId: 2,
        coordX: 5,
        coordY: 5,
        name: 'Defender City'
      });

      mockUnit.findAll.mockResolvedValue([
        { entityId: 1, quantity: 50, save: jest.fn() }
      ]);

      mockResource.findOne.mockResolvedValue({
        gold: 10000,
        metal: 10000,
        fuel: 10000,
        save: jest.fn()
      });

      mockCombatRepository.createAttack.mockResolvedValue({
        id: 999,
        status: 'traveling'
      });

      const result = await combatService.launchAttack(1, {
        fromCityId: 100,
        toCityId: 200,
        attackType: 'raid',
        units: [{ entityId: 1, quantity: 10 }]
      });

      expect(result.id).toBe(999);
      expect(result.status).toBe('traveling');
      expect(mockCombatRepository.createAttack).toHaveBeenCalled();
      expect(mockUnit.destroy).toHaveBeenCalled(); // Unités déduites
    });
  });

  describe('cancelAttack', () => {
    it('should reject if attack not found', async () => {
      mockCombatRepository.getAttackById.mockResolvedValue(null);

      await expect(
        combatService.cancelAttack(1, 999)
      ).rejects.toThrow('Attaque non trouvée');
    });

    it('should reject if not attacker', async () => {
      mockCombatRepository.getAttackById.mockResolvedValue({
        id: 999,
        attackerId: 2, // Différent de userId 1
        status: 'traveling'
      });

      await expect(
        combatService.cancelAttack(1, 999)
      ).rejects.toThrow('Non autorisé');
    });

    it('should reject if attack already arrived', async () => {
      mockCombatRepository.getAttackById.mockResolvedValue({
        id: 999,
        attackerId: 1,
        status: 'arrived'
      });

      await expect(
        combatService.cancelAttack(1, 999)
      ).rejects.toThrow('Impossible d\'annuler');
    });

    it('should refund 50% of resources and units', async () => {
      mockCombatRepository.getAttackById.mockResolvedValue({
        id: 999,
        attackerId: 1,
        attackerCityId: 100,
        status: 'traveling',
        waves: [
          { entityId: 1, quantity: 10, unit: { name: 'Soldat' } }
        ]
      });

      mockCity.findByPk.mockResolvedValue({ id: 100, userId: 1 });
      mockResource.findOne.mockResolvedValue({
        gold: 5000,
        metal: 5000,
        fuel: 5000,
        save: jest.fn()
      });

      mockCombatRepository.updateAttack.mockResolvedValue({});

      const result = await combatService.cancelAttack(1, 999);

      expect(result.status).toBe('cancelled');
      expect(mockUnit.bulkCreate).toHaveBeenCalled(); // Unités remboursées
      // Vérifier que les ressources ont été augmentées
    });
  });

  describe('resolveAttack', () => {
    it('should calculate combat and create defense report', async () => {
      mockCombatRepository.getAttackById.mockResolvedValue({
        id: 999,
        attackerId: 1,
        defenderId: 2,
        attackerCityId: 100,
        defenderCityId: 200,
        attackType: 'raid',
        waves: [
          { entityId: 1, quantity: 50, unit: { name: 'Soldat', attackPower: 10, defensePower: 5 } }
        ]
      });

      mockUnit.findAll.mockResolvedValue([
        { entityId: 1, quantity: 30, unit: { name: 'Soldat', attackPower: 10, defensePower: 5 } }
      ]);

      mockResource.findOne.mockResolvedValue({
        gold: 10000,
        metal: 5000,
        fuel: 3000
      });

      mockCombatRepository.updateAttack.mockResolvedValue({});
      mockCombatRepository.createDefenseReport.mockResolvedValue({});

      const result = await combatService.resolveAttack(999);

      expect(result.outcome).toMatch(/victory|draw/);
      expect(mockCombatRepository.createDefenseReport).toHaveBeenCalled();
      expect(mockCombatRepository.updateAttack).toHaveBeenCalled();
    });
  });

  describe('getAttacks', () => {
    it('should return attacks filtered by role', async () => {
      const mockAttacks = [
        { id: 1, status: 'traveling', attackType: 'raid' },
        { id: 2, status: 'completed', attackType: 'conquest' }
      ];

      mockCombatRepository.getAttacksByUser.mockResolvedValue(mockAttacks);

      const result = await combatService.getAttacks(1, { 
        role: 'attacker', 
        status: 'traveling' 
      });

      expect(result).toHaveLength(2);
      expect(mockCombatRepository.getAttacksByUser).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ role: 'attacker', status: 'traveling' })
      );
    });
  });
});

module.exports = {};
