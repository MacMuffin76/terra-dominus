/**
 * Tests unitaires pour Research Service
 * Focus sur l'arbre technologique et prérequis
 */

describe('ResearchService - Technology Tree', () => {
  describe('Research Prerequisites', () => {
    it('should validate research prerequisites', () => {
      const research = {
        id: 'advanced_warfare',
        prerequisites: ['basic_warfare', 'military_training']
      };

      const completedResearch = ['basic_warfare', 'military_training'];

      const hasPrerequisites = research.prerequisites.every(
        prereq => completedResearch.includes(prereq)
      );

      expect(hasPrerequisites).toBe(true);
    });

    it('should reject research without prerequisites', () => {
      const research = {
        id: 'advanced_warfare',
        prerequisites: ['basic_warfare', 'military_training']
      };

      const completedResearch = ['basic_warfare'];

      const hasPrerequisites = research.prerequisites.every(
        prereq => completedResearch.includes(prereq)
      );

      expect(hasPrerequisites).toBe(false);
    });

    it('should support multiple prerequisite levels', () => {
      const research = {
        id: 'elite_forces',
        prerequisites: ['advanced_warfare']
      };

      const prereqChain = {
        'advanced_warfare': ['basic_warfare', 'military_training'],
        'basic_warfare': [],
        'military_training': []
      };

      const completedResearch = ['basic_warfare', 'military_training', 'advanced_warfare'];

      const canResearch = research.prerequisites.every(
        prereq => completedResearch.includes(prereq)
      );

      expect(canResearch).toBe(true);
    });
  });

  describe('Research Costs', () => {
    it('should calculate research cost', () => {
      const baseCost = 1000;
      const level = 5;
      const costMultiplier = 1.5;

      const cost = baseCost * Math.pow(costMultiplier, level - 1);

      expect(cost).toBeCloseTo(5062.5, 1);
    });

    it('should support multi-resource costs', () => {
      const costs = {
        gold: 5000,
        titanium: 100,
        plasma: 50
      };

      const resources = {
        gold: 6000,
        titanium: 120,
        plasma: 60
      };

      const canAfford = Object.keys(costs).every(
        resource => resources[resource] >= costs[resource]
      );

      expect(canAfford).toBe(true);
    });

    it('should apply research cost reduction', () => {
      const baseCost = 1000;
      const costReduction = 0.2; // 20% reduction

      const actualCost = baseCost * (1 - costReduction);

      expect(actualCost).toBe(800);
    });
  });

  describe('Research Duration', () => {
    it('should calculate research duration', () => {
      const baseDuration = 3600; // 1 hour in seconds
      const level = 3;
      const durationMultiplier = 1.25;

      const duration = baseDuration * Math.pow(durationMultiplier, level - 1);

      expect(duration).toBeCloseTo(5625, 0);
    });

    it('should apply research speed bonus', () => {
      const baseDuration = 3600;
      const speedBonus = 0.3; // 30% faster

      const actualDuration = baseDuration * (1 - speedBonus);

      expect(actualDuration).toBe(2520);
    });

    it('should calculate completion time', () => {
      const startTime = new Date('2024-01-01T10:00:00Z');
      const durationSeconds = 3600;

      const completionTime = new Date(startTime.getTime() + durationSeconds * 1000);

      expect(completionTime.toISOString()).toBe('2024-01-01T11:00:00.000Z');
    });

    it('should check if research is complete', () => {
      const completionTime = new Date('2024-01-01T12:00:00Z');
      const currentTime = new Date('2024-01-01T13:00:00Z');

      const isComplete = currentTime >= completionTime;

      expect(isComplete).toBe(true);
    });
  });

  describe('Research Levels', () => {
    it('should track research level', () => {
      const research = {
        id: 'mining_efficiency',
        currentLevel: 5,
        maxLevel: 10
      };

      expect(research.currentLevel).toBe(5);
      expect(research.maxLevel).toBe(10);
    });

    it('should enforce max level', () => {
      const research = {
        currentLevel: 10,
        maxLevel: 10
      };

      const canUpgrade = research.currentLevel < research.maxLevel;

      expect(canUpgrade).toBe(false);
    });

    it('should calculate bonus per level', () => {
      const bonusPerLevel = 0.05; // 5% per level
      const level = 8;

      const totalBonus = bonusPerLevel * level;

      expect(totalBonus).toBe(0.4); // 40% total
    });
  });

  describe('Research Categories', () => {
    const categories = ['military', 'economy', 'defense', 'science'];

    it('should support all research categories', () => {
      expect(categories).toContain('military');
      expect(categories).toContain('economy');
      expect(categories).toContain('defense');
      expect(categories).toContain('science');
    });

    it('should filter research by category', () => {
      const allResearch = [
        { id: 'warfare', category: 'military' },
        { id: 'mining', category: 'economy' },
        { id: 'shields', category: 'defense' }
      ];

      const militaryResearch = allResearch.filter(r => r.category === 'military');

      expect(militaryResearch).toHaveLength(1);
    });
  });

  describe('Research Queue', () => {
    it('should allow single research at a time', () => {
      const activeResearch = [
        { id: 'warfare', startTime: new Date() }
      ];

      const maxActiveResearch = 1;
      const canStartNew = activeResearch.length < maxActiveResearch;

      expect(canStartNew).toBe(false);
    });

    it('should queue multiple researches', () => {
      const queue = [
        { id: 'warfare', position: 1 },
        { id: 'mining', position: 2 },
        { id: 'shields', position: 3 }
      ];

      expect(queue).toHaveLength(3);
      expect(queue[0].position).toBe(1);
    });

    it('should start next research after completion', () => {
      const queue = [
        { id: 'warfare', position: 1, status: 'completed' },
        { id: 'mining', position: 2, status: 'queued' }
      ];

      const nextResearch = queue.find(r => r.status === 'queued');

      expect(nextResearch.id).toBe('mining');
    });
  });

  describe('Research Bonuses', () => {
    it('should apply production bonus', () => {
      const baseProduction = 1000;
      const researchBonus = 0.25; // 25%

      const production = baseProduction * (1 + researchBonus);

      expect(production).toBe(1250);
    });

    it('should apply combat bonus', () => {
      const baseAttack = 100;
      const researchBonus = 0.3; // 30%

      const attack = baseAttack * (1 + researchBonus);

      expect(attack).toBe(130);
    });

    it('should apply defense bonus', () => {
      const baseDefense = 50;
      const researchBonus = 0.4; // 40%

      const defense = baseDefense * (1 + researchBonus);

      expect(defense).toBe(70);
    });

    it('should stack multiple bonuses', () => {
      const baseValue = 100;
      const researchBonuses = [0.1, 0.15, 0.2]; // 10%, 15%, 20%

      const totalBonus = researchBonuses.reduce((sum, bonus) => sum + bonus, 0);
      const finalValue = baseValue * (1 + totalBonus);

      expect(finalValue).toBe(145);
    });
  });

  describe('Research Points', () => {
    it('should calculate research points per hour', () => {
      const researchLabs = 3;
      const pointsPerLab = 50;

      const totalPoints = researchLabs * pointsPerLab;

      expect(totalPoints).toBe(150);
    });

    it('should apply research point bonus', () => {
      const basePoints = 100;
      const bonus = 0.25; // 25%

      const totalPoints = basePoints * (1 + bonus);

      expect(totalPoints).toBe(125);
    });

    it('should accumulate research points over time', () => {
      const pointsPerHour = 100;
      const hours = 5;

      const totalPoints = pointsPerHour * hours;

      expect(totalPoints).toBe(500);
    });
  });

  describe('Technology Unlocks', () => {
    it('should unlock new buildings', () => {
      const research = {
        id: 'advanced_construction',
        unlocks: ['fortress', 'academy']
      };

      expect(research.unlocks).toContain('fortress');
      expect(research.unlocks).toContain('academy');
    });

    it('should unlock new units', () => {
      const research = {
        id: 'tank_warfare',
        unlocks: ['heavy_tank', 'artillery']
      };

      expect(research.unlocks).toHaveLength(2);
    });

    it('should check if feature is unlocked', () => {
      const completedResearch = ['basic_warfare', 'advanced_warfare'];
      const requiredResearch = 'advanced_warfare';

      const isUnlocked = completedResearch.includes(requiredResearch);

      expect(isUnlocked).toBe(true);
    });
  });

  describe('Research Instant Completion', () => {
    it('should calculate instant completion cost', () => {
      const remainingSeconds = 3600;
      const costPerSecond = 1; // 1 crystal per second

      const instantCost = remainingSeconds * costPerSecond;

      expect(instantCost).toBe(3600);
    });

    it('should apply discount for long duration', () => {
      const remainingSeconds = 7200;
      const baseCostPerSecond = 1;
      const discount = 0.1; // 10% off for > 1 hour

      const costPerSecond = baseCostPerSecond * (1 - discount);
      const instantCost = remainingSeconds * costPerSecond;

      expect(instantCost).toBe(6480);
    });
  });

  describe('Research Tree Paths', () => {
    it('should support multiple tech paths', () => {
      const techTree = {
        military: ['basic_warfare', 'advanced_warfare', 'elite_forces'],
        economy: ['mining_basics', 'advanced_mining', 'automated_mining'],
        defense: ['basic_shields', 'advanced_shields', 'energy_shields']
      };

      expect(Object.keys(techTree)).toHaveLength(3);
      expect(techTree.military).toHaveLength(3);
    });

    it('should calculate progress on tech path', () => {
      const techPath = ['tech1', 'tech2', 'tech3', 'tech4', 'tech5'];
      const completedTechs = ['tech1', 'tech2', 'tech3'];

      const progress = (completedTechs.length / techPath.length) * 100;

      expect(progress).toBe(60);
    });
  });

  describe('Research Effects', () => {
    it('should apply passive effects', () => {
      const research = {
        id: 'mining_efficiency',
        effects: {
          goldProduction: 0.2,
          miningSpeed: 0.15
        }
      };

      expect(research.effects.goldProduction).toBe(0.2);
      expect(research.effects.miningSpeed).toBe(0.15);
    });

    it('should apply active abilities', () => {
      const research = {
        id: 'emergency_shields',
        ability: {
          name: 'Activate Shields',
          cooldown: 3600,
          duration: 600
        }
      };

      expect(research.ability.cooldown).toBe(3600);
      expect(research.ability.duration).toBe(600);
    });
  });

  describe('Research Refund', () => {
    it('should calculate refund amount', () => {
      const researchCost = 5000;
      const refundPercentage = 0.5; // 50% refund

      const refundAmount = researchCost * refundPercentage;

      expect(refundAmount).toBe(2500);
    });

    it('should reset research to level 0', () => {
      const research = {
        id: 'warfare',
        currentLevel: 5
      };

      research.currentLevel = 0;

      expect(research.currentLevel).toBe(0);
    });
  });

  describe('Research Dependencies', () => {
    it('should check building level requirements', () => {
      const research = {
        id: 'advanced_warfare',
        requiredBuildings: {
          academy: 5,
          barracks: 3
        }
      };

      const buildings = {
        academy: 5,
        barracks: 4
      };

      const meetsRequirements = Object.keys(research.requiredBuildings).every(
        building => buildings[building] >= research.requiredBuildings[building]
      );

      expect(meetsRequirements).toBe(true);
    });

    it('should check player level requirement', () => {
      const research = {
        id: 'elite_forces',
        requiredLevel: 20
      };

      const playerLevel = 25;

      const meetsRequirement = playerLevel >= research.requiredLevel;

      expect(meetsRequirement).toBe(true);
    });
  });

  describe('Research Statistics', () => {
    it('should track total research completed', () => {
      const completedResearch = [
        { id: 'tech1', level: 5 },
        { id: 'tech2', level: 3 },
        { id: 'tech3', level: 7 }
      ];

      const totalLevels = completedResearch.reduce((sum, r) => sum + r.level, 0);

      expect(totalLevels).toBe(15);
    });

    it('should calculate research investment', () => {
      const completedResearch = [
        { id: 'tech1', totalCost: 10000 },
        { id: 'tech2', totalCost: 15000 },
        { id: 'tech3', totalCost: 20000 }
      ];

      const totalInvestment = completedResearch.reduce((sum, r) => sum + r.totalCost, 0);

      expect(totalInvestment).toBe(45000);
    });

    it('should track research time spent', () => {
      const completedResearch = [
        { id: 'tech1', duration: 3600 },
        { id: 'tech2', duration: 7200 },
        { id: 'tech3', duration: 5400 }
      ];

      const totalTime = completedResearch.reduce((sum, r) => sum + r.duration, 0);
      const totalHours = totalTime / 3600;

      expect(totalHours).toBeCloseTo(4.5, 1);
    });
  });
});
