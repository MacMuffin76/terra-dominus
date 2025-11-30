'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create blueprints table (master data for all craftable items)
    await queryInterface.createTable('blueprints', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      
      // Identity
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      category: {
        type: Sequelize.STRING(30),
        allowNull: false,
        comment: 'unit, building, consumable, cosmetic, alliance_building'
      },
      rarity: {
        type: Sequelize.STRING(20),
        allowNull: false,
        comment: 'common, rare, epic, legendary, mythic'
      },
      
      // Requirements
      crafting_station_level_min: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      unlock_requirements: {
        type: Sequelize.JSONB,
        defaultValue: {},
        comment: 'Research, building, alliance tech requirements'
      },
      
      // Recipe
      inputs: {
        type: Sequelize.JSONB,
        allowNull: false,
        comment: 'Resources T1/T2, units, items, premium currency needed'
      },
      outputs: {
        type: Sequelize.JSONB,
        allowNull: false,
        comment: 'What is produced (unit, building, item, cosmetic)'
      },
      duration_seconds: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      
      // Rewards
      experience_reward: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Crafting XP awarded on completion'
      },
      
      // Metadata
      description: {
        type: Sequelize.TEXT
      },
      icon_url: {
        type: Sequelize.STRING(255)
      },
      
      // Flags
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      is_tradeable: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        comment: 'Can be sold on market'
      },
      is_alliance_craft: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Indexes for blueprints
    await queryInterface.addIndex('blueprints', ['category'], {
      name: 'idx_blueprints_category'
    });
    await queryInterface.addIndex('blueprints', ['rarity'], {
      name: 'idx_blueprints_rarity'
    });
    await queryInterface.addIndex('blueprints', ['is_active'], {
      name: 'idx_blueprints_active'
    });

    // 2. Create player_blueprints table (user-owned blueprints)
    await queryInterface.createTable('player_blueprints', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      
      // Relations
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      blueprint_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'blueprints',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      
      // Discovery
      discovered_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      discovery_source: {
        type: Sequelize.STRING(50),
        comment: 'portal_blue, research, quest_reward, market_purchase, event'
      },
      
      // Stats
      times_crafted: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Unique constraint: user can't own same blueprint twice
    await queryInterface.addConstraint('player_blueprints', {
      fields: ['user_id', 'blueprint_id'],
      type: 'unique',
      name: 'unique_user_blueprint'
    });

    // Indexes for player_blueprints
    await queryInterface.addIndex('player_blueprints', ['user_id'], {
      name: 'idx_player_blueprints_user'
    });
    await queryInterface.addIndex('player_blueprints', ['blueprint_id'], {
      name: 'idx_player_blueprints_blueprint'
    });

    // 3. Create crafting_queue table (active crafts)
    await queryInterface.createTable('crafting_queue', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      
      // Relations
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      blueprint_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'blueprints',
          key: 'id'
        }
      },
      
      // Craft Details
      quantity_target: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        comment: 'For mass craft future feature'
      },
      resources_consumed: {
        type: Sequelize.JSONB,
        allowNull: false,
        comment: 'Snapshot of inputs at craft start'
      },
      
      // Timing
      started_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'When craft will be ready'
      },
      collected_at: {
        type: Sequelize.DATE,
        comment: 'When user collected the output'
      },
      
      // Status
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'in_progress',
        comment: 'in_progress, completed, cancelled, collected'
      },
      
      // Output (stored after completion)
      output_items: {
        type: Sequelize.JSONB,
        comment: 'What was crafted with exact quantities'
      },
      
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Indexes for crafting_queue
    await queryInterface.addIndex('crafting_queue', ['user_id'], {
      name: 'idx_crafting_queue_user'
    });
    await queryInterface.addIndex('crafting_queue', ['status'], {
      name: 'idx_crafting_queue_status'
    });
    await queryInterface.addIndex('crafting_queue', ['completed_at'], {
      name: 'idx_crafting_queue_completed',
      where: {
        status: 'in_progress'
      }
    });

    // 4. Create player_crafting_stats table (progression)
    await queryInterface.createTable('player_crafting_stats', {
      user_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      
      // XP & Level
      crafting_xp: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      crafting_level: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      
      // Statistics
      total_crafts_completed: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      total_crafts_cancelled: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      
      // Resources consumed lifetime
      resources_t1_consumed: {
        type: Sequelize.JSONB,
        defaultValue: {},
        comment: 'Lifetime T1 resources consumed'
      },
      resources_t2_consumed: {
        type: Sequelize.JSONB,
        defaultValue: {},
        comment: 'Lifetime T2 resources consumed'
      },
      
      // Achievements timestamps
      first_craft_at: {
        type: Sequelize.DATE
      },
      first_rare_craft_at: {
        type: Sequelize.DATE
      },
      first_epic_craft_at: {
        type: Sequelize.DATE
      },
      first_legendary_craft_at: {
        type: Sequelize.DATE
      },
      
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // 5. Seed initial blueprints (10 recipes covering all rarities)
    await queryInterface.bulkInsert('blueprints', [
      // COMMON (2 recipes)
      {
        name: 'Shield Booster (1h)',
        category: 'consumable',
        rarity: 'common',
        crafting_station_level_min: 1,
        unlock_requirements: JSON.stringify({ research: 'basic_defense' }),
        inputs: JSON.stringify({
          resources_t1: { energie: 5000, carburant: 2000 },
          resources_t2: { plasma: 5 }
        }),
        outputs: JSON.stringify({
          item: { type: 'shield_booster_1h', quantity: 1 }
        }),
        duration_seconds: 1800, // 30min
        experience_reward: 10,
        description: 'Temporary shield that increases city defense by 50% for 1 hour',
        is_active: true,
        is_tradeable: true,
        is_alliance_craft: false,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Production Accelerator (6h)',
        category: 'consumable',
        rarity: 'common',
        crafting_station_level_min: 1,
        unlock_requirements: JSON.stringify({}),
        inputs: JSON.stringify({
          resources_t1: { metal: 3000, energie: 5000 },
          resources_t2: { titanium: 10 }
        }),
        outputs: JSON.stringify({
          item: { type: 'production_accelerator_6h', quantity: 1 }
        }),
        duration_seconds: 1200, // 20min
        experience_reward: 15,
        description: 'Boosts all resource production by 100% for 6 hours',
        is_active: true,
        is_tradeable: true,
        is_alliance_craft: false,
        created_at: new Date(),
        updated_at: new Date()
      },

      // RARE (3 recipes)
      {
        name: 'Elite Infantry Squad',
        category: 'unit',
        rarity: 'rare',
        crafting_station_level_min: 5,
        unlock_requirements: JSON.stringify({ 
          research: 'advanced_training',
          building: { type: 'barracks', level: 8 }
        }),
        inputs: JSON.stringify({
          resources_t1: { metal: 5000, carburant: 3000 },
          resources_t2: { titanium: 50, plasma: 10 },
          units: [{ type: 'Infantry', quantity: 10 }]
        }),
        outputs: JSON.stringify({
          unit: { type: 'Elite_Infantry', quantity: 5 }
        }),
        duration_seconds: 3600, // 1h
        experience_reward: 100,
        description: 'Elite infantry with 2x attack and defense compared to standard infantry',
        is_active: true,
        is_tradeable: true,
        is_alliance_craft: false,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Super Tank Mk2',
        category: 'unit',
        rarity: 'rare',
        crafting_station_level_min: 5,
        unlock_requirements: JSON.stringify({ 
          research: 'advanced_armor',
          building: { type: 'barracks', level: 10 }
        }),
        inputs: JSON.stringify({
          resources_t1: { metal: 8000, carburant: 3000 },
          resources_t2: { titanium: 100, plasma: 20 },
          units: [{ type: 'Tank', quantity: 5 }]
        }),
        outputs: JSON.stringify({
          unit: { type: 'Super_Tank_Mk2', quantity: 1 }
        }),
        duration_seconds: 7200, // 2h
        experience_reward: 150,
        description: 'Heavy tank with armor penetration ability and 80% more firepower',
        is_active: true,
        is_tradeable: true,
        is_alliance_craft: false,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Tactical Scanner',
        category: 'equipment',
        rarity: 'rare',
        crafting_station_level_min: 5,
        unlock_requirements: JSON.stringify({ research: 'reconnaissance' }),
        inputs: JSON.stringify({
          resources_t1: { metal: 10000, energie: 15000 },
          resources_t2: { plasma: 50, nanotubes: 10 }
        }),
        outputs: JSON.stringify({
          item: { type: 'tactical_scanner', quantity: 1 }
        }),
        duration_seconds: 5400, // 1h30
        experience_reward: 120,
        description: 'Reveals enemy troop movements within 10 tiles for 24 hours',
        is_active: true,
        is_tradeable: true,
        is_alliance_craft: false,
        created_at: new Date(),
        updated_at: new Date()
      },

      // EPIC (3 recipes)
      {
        name: 'Orbital Defense System',
        category: 'building',
        rarity: 'epic',
        crafting_station_level_min: 10,
        unlock_requirements: JSON.stringify({ 
          research: 'orbital_mechanics',
          building: { type: 'research_lab', level: 15 }
        }),
        inputs: JSON.stringify({
          resources_t1: { metal: 50000, energie: 100000, carburant: 20000 },
          resources_t2: { titanium: 500, plasma: 300, nanotubes: 100 }
        }),
        outputs: JSON.stringify({
          building: { type: 'orbital_defense_system', level: 1 }
        }),
        duration_seconds: 86400, // 24h
        experience_reward: 1000,
        description: 'Automated defense system that doubles city defense and fires on attackers',
        is_active: true,
        is_tradeable: true,
        is_alliance_craft: false,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Mega Refinery',
        category: 'building',
        rarity: 'epic',
        crafting_station_level_min: 10,
        unlock_requirements: JSON.stringify({ 
          research: 'industrial_revolution',
          building: { type: 'mine_metal', level: 15 }
        }),
        inputs: JSON.stringify({
          resources_t1: { metal: 80000, energie: 50000, carburant: 30000 },
          resources_t2: { titanium: 400, plasma: 200, nanotubes: 80 }
        }),
        outputs: JSON.stringify({
          building: { type: 'mega_refinery', level: 1 }
        }),
        duration_seconds: 43200, // 12h
        experience_reward: 800,
        description: 'Advanced refinery that triples T2 resource production rates',
        is_active: true,
        is_tradeable: true,
        is_alliance_craft: false,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Commander Battle Armor',
        category: 'equipment',
        rarity: 'epic',
        crafting_station_level_min: 10,
        unlock_requirements: JSON.stringify({ research: 'exosuit_technology' }),
        inputs: JSON.stringify({
          resources_t1: { metal: 30000, energie: 40000, carburant: 15000 },
          resources_t2: { titanium: 300, plasma: 150, nanotubes: 50 }
        }),
        outputs: JSON.stringify({
          item: { type: 'commander_battle_armor', quantity: 1 }
        }),
        duration_seconds: 28800, // 8h
        experience_reward: 700,
        description: 'Elite armor that grants +30% attack and defense to all armies',
        is_active: true,
        is_tradeable: true,
        is_alliance_craft: false,
        created_at: new Date(),
        updated_at: new Date()
      },

      // LEGENDARY (2 recipes)
      {
        name: 'Titan Mech Walker',
        category: 'unit',
        rarity: 'legendary',
        crafting_station_level_min: 15,
        unlock_requirements: JSON.stringify({ 
          research: 'mech_warfare',
          building: { type: 'barracks', level: 20 }
        }),
        inputs: JSON.stringify({
          resources_t1: { metal: 100000, energie: 200000, carburant: 50000 },
          resources_t2: { titanium: 1000, plasma: 500, nanotubes: 200 },
          units: [{ type: 'Super_Tank_Mk2', quantity: 10 }]
        }),
        outputs: JSON.stringify({
          unit: { type: 'Titan_Mech_Walker', quantity: 1 }
        }),
        duration_seconds: 259200, // 72h
        experience_reward: 5000,
        description: 'Legendary mech with devastating firepower, equivalent to 50 tanks',
        is_active: true,
        is_tradeable: true,
        is_alliance_craft: false,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Neon City Skin Pack',
        category: 'cosmetic',
        rarity: 'legendary',
        crafting_station_level_min: 15,
        unlock_requirements: JSON.stringify({ achievement: 'master_builder' }),
        inputs: JSON.stringify({
          resources_t1: { metal: 50000, energie: 100000 },
          resources_t2: { plasma: 500, nanotubes: 200 },
          premium_currency: 200
        }),
        outputs: JSON.stringify({
          cosmetic: { type: 'city_skin_neon', permanent: true }
        }),
        duration_seconds: 86400, // 24h
        experience_reward: 2000,
        description: 'Exclusive neon-themed city skin with animated lights and glow effects',
        is_active: true,
        is_tradeable: false,
        is_alliance_craft: false,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);

    console.log('✅ Crafting system migration completed successfully');
    console.log('   - 4 tables created: blueprints, player_blueprints, crafting_queue, player_crafting_stats');
    console.log('   - 10 blueprints seeded: 2 Common, 3 Rare, 3 Epic, 2 Legendary');
    console.log('   - Indexes added for performance optimization');
  },

  async down(queryInterface, Sequelize) {
    // Drop tables in reverse order (respecting foreign keys)
    await queryInterface.dropTable('player_crafting_stats');
    await queryInterface.dropTable('crafting_queue');
    await queryInterface.dropTable('player_blueprints');
    await queryInterface.dropTable('blueprints');
    
    console.log('✅ Crafting system migration rolled back');
  }
};
