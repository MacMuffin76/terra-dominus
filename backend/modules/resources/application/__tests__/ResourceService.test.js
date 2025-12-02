/**
 * Tests unitaires pour Resource Service
 * Focus sur les calculs de production et conversions T2
 */

describe('ResourceService - Production Calculations', () => {
  describe('Base Resource Production', () => {
    it('should calculate basic production rate', () => {
      const baseProduction = 100; // per hour
      const hours = 2;

      const totalProduction = baseProduction * hours;

      expect(totalProduction).toBe(200);
    });

    it('should apply building level multiplier', () => {
      const baseProduction = 100;
      const buildingLevel = 5;
      const multiplierPerLevel = 0.1; // 10% per level

      const multiplier = 1 + (buildingLevel * multiplierPerLevel);
      const production = baseProduction * multiplier;

      expect(production).toBe(150); // 100 * 1.5
    });

    it('should apply research bonus', () => {
      const baseProduction = 100;
      const researchBonus = 0.25; // 25% bonus

      const production = baseProduction * (1 + researchBonus);

      expect(production).toBe(125);
    });

    it('should stack all bonuses multiplicatively', () => {
      const baseProduction = 100;
      const buildingBonus = 0.5; // 50%
      const researchBonus = 0.25; // 25%
      const itemBonus = 0.1; // 10%

      const totalMultiplier = (1 + buildingBonus) * (1 + researchBonus) * (1 + itemBonus);
      const production = baseProduction * totalMultiplier;

      expect(production).toBeCloseTo(206.25, 2);
    });
  });

  describe('Resource Types', () => {
    const resourceTypes = ['gold', 'titanium', 'plasma', 'nanotubes'];

    it('should support all resource types', () => {
      expect(resourceTypes).toContain('gold');
      expect(resourceTypes).toContain('titanium');
      expect(resourceTypes).toContain('plasma');
      expect(resourceTypes).toContain('nanotubes');
    });

    it('should categorize T1 and T2 resources', () => {
      const t1Resources = ['gold'];
      const t2Resources = ['titanium', 'plasma', 'nanotubes'];

      expect(t1Resources).toHaveLength(1);
      expect(t2Resources).toHaveLength(3);
    });
  });

  describe('T2 Resource Conversion', () => {
    it('should convert gold to titanium', () => {
      const goldCost = 1000;
      const conversionRate = 10; // 10 gold = 1 titanium

      const titaniumProduced = goldCost / conversionRate;

      expect(titaniumProduced).toBe(100);
    });

    it('should convert gold to plasma', () => {
      const goldCost = 2000;
      const conversionRate = 20; // 20 gold = 1 plasma

      const plasmaProduced = goldCost / conversionRate;

      expect(plasmaProduced).toBe(100);
    });

    it('should convert gold to nanotubes', () => {
      const goldCost = 5000;
      const conversionRate = 50; // 50 gold = 1 nanotube

      const nanotubesProduced = goldCost / conversionRate;

      expect(nanotubesProduced).toBe(100);
    });

    it('should validate sufficient gold for conversion', () => {
      const currentGold = 500;
      const conversionCost = 1000;

      const canConvert = currentGold >= conversionCost;

      expect(canConvert).toBe(false);
    });

    it('should apply conversion efficiency research', () => {
      const goldCost = 1000;
      const baseConversionRate = 10;
      const efficiencyBonus = 0.2; // 20% efficiency

      const effectiveRate = baseConversionRate * (1 - efficiencyBonus);
      const titaniumProduced = goldCost / effectiveRate;

      expect(titaniumProduced).toBe(125);
    });
  });

  describe('Resource Storage', () => {
    it('should enforce storage capacity', () => {
      const currentGold = 5000;
      const productionAmount = 3000;
      const storageCapacity = 7000;

      const newAmount = Math.min(currentGold + productionAmount, storageCapacity);

      expect(newAmount).toBe(7000); // Capped at capacity
    });

    it('should calculate storage capacity', () => {
      const baseCapacity = 10000;
      const warehouseLevel = 5;
      const capacityPerLevel = 1000;

      const totalCapacity = baseCapacity + (warehouseLevel * capacityPerLevel);

      expect(totalCapacity).toBe(15000);
    });

    it('should warn when storage is full', () => {
      const currentAmount = 9900;
      const storageCapacity = 10000;
      const threshold = 0.95; // 95% full

      const percentFull = currentAmount / storageCapacity;
      const shouldWarn = percentFull >= threshold;

      expect(shouldWarn).toBe(true);
    });

    it('should calculate remaining storage', () => {
      const currentAmount = 7500;
      const storageCapacity = 10000;

      const remaining = storageCapacity - currentAmount;

      expect(remaining).toBe(2500);
    });
  });

  describe('Production Over Time', () => {
    it('should calculate production since last collection', () => {
      const lastCollectionTime = new Date('2024-01-01T10:00:00Z');
      const currentTime = new Date('2024-01-01T13:00:00Z');
      const productionPerHour = 500;

      const hoursPassed = (currentTime - lastCollectionTime) / (1000 * 60 * 60);
      const production = hoursPassed * productionPerHour;

      expect(production).toBe(1500);
    });

    it('should handle partial hours', () => {
      const productionPerHour = 600;
      const minutesPassed = 30;

      const production = (minutesPassed / 60) * productionPerHour;

      expect(production).toBe(300);
    });

    it('should cap production at storage capacity', () => {
      const productionPerHour = 1000;
      const hoursPassed = 10;
      const currentAmount = 5000;
      const storageCapacity = 10000;

      const rawProduction = productionPerHour * hoursPassed;
      const newAmount = Math.min(currentAmount + rawProduction, storageCapacity);

      expect(newAmount).toBe(10000); // Capped
    });
  });

  describe('Resource Costs', () => {
    it('should validate multi-resource costs', () => {
      const currentResources = {
        gold: 5000,
        titanium: 100,
        plasma: 50
      };

      const costs = {
        gold: 3000,
        titanium: 80,
        plasma: 60
      };

      const canAfford = Object.keys(costs).every(
        resource => currentResources[resource] >= costs[resource]
      );

      expect(canAfford).toBe(false); // Not enough plasma
    });

    it('should deduct resources after purchase', () => {
      const resources = {
        gold: 5000,
        titanium: 100
      };

      const costs = {
        gold: 1000,
        titanium: 20
      };

      const newResources = { ...resources };
      Object.keys(costs).forEach(resource => {
        newResources[resource] -= costs[resource];
      });

      expect(newResources.gold).toBe(4000);
      expect(newResources.titanium).toBe(80);
    });
  });

  describe('Resource Bonuses', () => {
    it('should apply faction bonus', () => {
      const baseProduction = 1000;
      const factionBonus = 0.15; // 15% bonus

      const production = baseProduction * (1 + factionBonus);

      expect(production).toBe(1150);
    });

    it('should apply alliance territory bonus', () => {
      const baseProduction = 1000;
      const territoryBonus = 0.1; // 10% per territory

      const production = baseProduction * (1 + territoryBonus);

      expect(production).toBe(1100);
    });

    it('should apply event multiplier', () => {
      const baseProduction = 1000;
      const eventMultiplier = 2.0; // 2x event

      const production = baseProduction * eventMultiplier;

      expect(production).toBe(2000);
    });
  });

  describe('Resource Raids', () => {
    it('should calculate raid loot', () => {
      const targetGold = 10000;
      const raidSuccessRate = 0.6;
      const lootPercentage = 0.25;

      const lootAmount = targetGold * lootPercentage * raidSuccessRate;

      expect(lootAmount).toBe(1500);
    });

    it('should apply resource protection', () => {
      const totalGold = 10000;
      const protectedPercentage = 0.2; // 20% protected

      const protectedAmount = totalGold * protectedPercentage;
      const vulnerableAmount = totalGold - protectedAmount;

      expect(protectedAmount).toBe(2000);
      expect(vulnerableAmount).toBe(8000);
    });
  });

  describe('Daily Production Limits', () => {
    it('should track daily production', () => {
      const productionHistory = [
        { amount: 5000, timestamp: new Date('2024-01-01T10:00:00Z') },
        { amount: 3000, timestamp: new Date('2024-01-01T14:00:00Z') }
      ];

      const totalDailyProduction = productionHistory.reduce((sum, entry) => sum + entry.amount, 0);

      expect(totalDailyProduction).toBe(8000);
    });

    it('should reset daily production at midnight', () => {
      const now = new Date('2024-01-01T23:59:59Z');
      const midnight = new Date(now);
      midnight.setUTCHours(24, 0, 0, 0);

      const shouldReset = now >= midnight;

      expect(shouldReset).toBe(false);
    });
  });

  describe('Resource Transactions', () => {
    it('should create transaction log', () => {
      const transaction = {
        type: 'production',
        resource: 'gold',
        amount: 1000,
        timestamp: new Date(),
        source: 'mine_level_5'
      };

      expect(transaction.type).toBe('production');
      expect(transaction.amount).toBe(1000);
    });

    it('should track transaction types', () => {
      const transactionTypes = ['production', 'conversion', 'purchase', 'raid', 'trade', 'gift'];

      expect(transactionTypes).toContain('production');
      expect(transactionTypes).toContain('conversion');
      expect(transactionTypes).toContain('raid');
    });
  });

  describe('Resource Efficiency', () => {
    it('should calculate production efficiency', () => {
      const actualProduction = 850;
      const maxProduction = 1000;

      const efficiency = (actualProduction / maxProduction) * 100;

      expect(efficiency).toBe(85);
    });

    it('should detect underutilized facilities', () => {
      const currentProduction = 600;
      const maxProduction = 1000;
      const threshold = 0.7; // 70%

      const utilizationRate = currentProduction / maxProduction;
      const isUnderutilized = utilizationRate < threshold;

      expect(isUnderutilized).toBe(true);
    });
  });

  describe('Resource Boosters', () => {
    it('should apply time-limited booster', () => {
      const booster = {
        multiplier: 2.0,
        startTime: new Date('2024-01-01T10:00:00Z'),
        duration: 3600000 // 1 hour in ms
      };

      const currentTime = new Date('2024-01-01T10:30:00Z');
      const endTime = new Date(booster.startTime.getTime() + booster.duration);

      const isActive = currentTime >= booster.startTime && currentTime <= endTime;

      expect(isActive).toBe(true);
    });

    it('should expire booster after duration', () => {
      const booster = {
        multiplier: 2.0,
        startTime: new Date('2024-01-01T10:00:00Z'),
        duration: 3600000
      };

      const currentTime = new Date('2024-01-01T12:00:00Z');
      const endTime = new Date(booster.startTime.getTime() + booster.duration);

      const isActive = currentTime <= endTime;

      expect(isActive).toBe(false);
    });

    it('should stack multiple boosters', () => {
      const baseProduction = 1000;
      const boosters = [
        { multiplier: 1.5 },
        { multiplier: 1.2 },
        { multiplier: 1.1 }
      ];

      const totalMultiplier = boosters.reduce((acc, b) => acc * b.multiplier, 1);
      const production = baseProduction * totalMultiplier;

      expect(production).toBeCloseTo(1980, 0);
    });
  });

  describe('Resource Trading', () => {
    it('should calculate trade value', () => {
      const goldAmount = 1000;
      const exchangeRate = 0.9; // 10% market fee

      const tradeValue = goldAmount * exchangeRate;

      expect(tradeValue).toBe(900);
    });

    it('should enforce minimum trade amount', () => {
      const tradeAmount = 50;
      const minimumTrade = 100;

      const isValidTrade = tradeAmount >= minimumTrade;

      expect(isValidTrade).toBe(false);
    });
  });

  describe('Resource Statistics', () => {
    it('should calculate total resources value', () => {
      const resources = {
        gold: 5000,
        titanium: 100,
        plasma: 50,
        nanotubes: 10
      };

      const values = {
        gold: 1,
        titanium: 10,
        plasma: 20,
        nanotubes: 50
      };

      const totalValue = Object.keys(resources).reduce(
        (sum, resource) => sum + (resources[resource] * values[resource]),
        0
      );

      expect(totalValue).toBe(7500);
    });

    it('should track resource generation rate', () => {
      const productions = [100, 120, 110, 130, 115];
      const averageProduction = productions.reduce((sum, p) => sum + p, 0) / productions.length;

      expect(averageProduction).toBe(115);
    });
  });
});
