'use strict';

/**
 * Migration: Seed Balanced Unit System
 * 
 * This migration introduces a balanced unit system for PvP combat with:
 * - 14 unit types across 4 tiers
 * - Rock-paper-scissors counter mechanics
 * - Economic balance through upkeep costs
 * - Extended unit attributes (initiative, speed, carry capacity)
 * 
 * Tables created:
 * - unit_stats: Extended unit attributes and counter system
 * - unit_upkeep: Hourly maintenance costs per unit
 * 
 * References: docs/PVP_BALANCE_PLAN.md, backend/modules/combat/domain/unitDefinitions.js
 */

const { UNIT_DEFINITIONS } = require('../modules/combat/domain/unitDefinitions');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get max entity_id to avoid conflicts
    const [maxResult] = await queryInterface.sequelize.query(
      'SELECT COALESCE(MAX(entity_id), 0) as max_id FROM entities'
    );
    const startId = maxResult[0].max_id + 1000;
    console.log(`ℹ️  Starting entity_id at ${startId}`);

    // 1. Create unit_stats table
    await queryInterface.createTable('unit_stats', {
      unit_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: {
          model: 'entities',
          key: 'entity_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      unit_key: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      tier: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      category: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      attack: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      defense: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      health: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 10
      },
      initiative: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 10
      },
      speed: {
        type: Sequelize.DECIMAL(3, 1),
        allowNull: false,
        defaultValue: 1.0
      },
      carry_capacity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      train_time_seconds: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 60
      },
      counters: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: []
      },
      weak_to: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: []
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
    console.log('✅ Created unit_stats table');

    // 2. Create unit_upkeep table
    await queryInterface.createTable('unit_upkeep', {
      unit_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: {
          model: 'entities',
          key: 'entity_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      gold_per_hour: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      metal_per_hour: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      fuel_per_hour: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
    console.log('✅ Created unit_upkeep table');

    // 3. Prepare unit data
    const now = new Date();
    const unitEntities = [];
    const unitStats = [];
    const resourceCosts = [];
    const upkeepCosts = [];

    Object.values(UNIT_DEFINITIONS).forEach((unit, index) => {
      const entityId = startId + index;

      // Entity record
      unitEntities.push({
        entity_id: entityId,
        entity_type: 'unit',
        entity_name: unit.name
      });

      // Unit stats record
      unitStats.push({
        unit_id: entityId,
        unit_key: unit.id,
        description: unit.description,
        tier: unit.tier,
        category: unit.category,
        attack: unit.attack,
        defense: unit.defense,
        health: unit.health,
        initiative: unit.initiative,
        speed: unit.speed,
        carry_capacity: unit.carryCapacity,
        train_time_seconds: unit.trainTime,
        counters: JSON.stringify(unit.counters),
        weak_to: JSON.stringify(unit.weakTo),
        created_at: now,
        updated_at: now
      });

      // Resource costs
      if (unit.cost.gold > 0) {
        resourceCosts.push({
          entity_id: entityId,
          resource_type: 'gold',
          amount: unit.cost.gold,
          level: 1
        });
      }
      if (unit.cost.metal > 0) {
        resourceCosts.push({
          entity_id: entityId,
          resource_type: 'metal',
          amount: unit.cost.metal,
          level: 1
        });
      }
      if (unit.cost.fuel > 0) {
        resourceCosts.push({
          entity_id: entityId,
          resource_type: 'fuel',
          amount: unit.cost.fuel,
          level: 1
        });
      }

      // Upkeep costs
      upkeepCosts.push({
        unit_id: entityId,
        gold_per_hour: unit.upkeepPerHour.gold || 0,
        metal_per_hour: unit.upkeepPerHour.metal || 0,
        fuel_per_hour: unit.upkeepPerHour.fuel || 0,
        created_at: now,
        updated_at: now
      });
    });

    // 4. Insert data
    await queryInterface.bulkInsert('entities', unitEntities);
    console.log(`✅ Inserted ${unitEntities.length} unit entities`);

    await queryInterface.bulkInsert('unit_stats', unitStats);
    console.log(`✅ Inserted ${unitStats.length} unit stat records`);

    await queryInterface.bulkInsert('resource_costs', resourceCosts);
    console.log(`✅ Inserted ${resourceCosts.length} resource cost records`);

    await queryInterface.bulkInsert('unit_upkeep', upkeepCosts);
    console.log(`✅ Inserted ${upkeepCosts.length} upkeep cost records`);

    console.log('\n🎉 Successfully seeded balanced unit system!');
  },

  down: async (queryInterface, Sequelize) => {
    // Remove upkeep records
    await queryInterface.bulkDelete('unit_upkeep', {});
    
    // Remove resource costs for units
    await queryInterface.sequelize.query(
      "DELETE FROM resource_costs WHERE entity_id IN (SELECT entity_id FROM entities WHERE entity_type = 'unit')"
    );
    
    // Remove unit stats
    await queryInterface.bulkDelete('unit_stats', {});
    
    // Remove unit entities
    await queryInterface.bulkDelete('entities', { entity_type: 'unit' });
    
    // Drop tables
    await queryInterface.dropTable('unit_upkeep');
    await queryInterface.dropTable('unit_stats');
    
    console.log('✅ Rolled back balanced unit system');
  }
};
