'use strict';

/**
 * Migration: Factions & Territorial Bonuses System
 * 
 * Creates 4 tables:
 * 1. factions - Static faction definitions (3 factions)
 * 2. control_zones - Strategic territorial zones
 * 3. faction_control_points - Points accumulated by factions in zones
 * 4. user_factions - Player faction membership with history
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // ==================== TABLE 1: factions ====================
      await queryInterface.createTable('factions', {
        id: {
          type: Sequelize.STRING(50),
          primaryKey: true,
          comment: 'Faction identifier (TERRAN_FEDERATION, NOMAD_RAIDERS, INDUSTRIAL_SYNDICATE)'
        },
        name: {
          type: Sequelize.STRING(100),
          allowNull: false,
          comment: 'Display name'
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: 'Short description'
        },
        color: {
          type: Sequelize.STRING(7),
          allowNull: true,
          comment: 'Hex color (#0066FF)'
        },
        capital_x: {
          type: Sequelize.INTEGER,
          allowNull: true,
          comment: 'X coordinate of faction capital'
        },
        capital_y: {
          type: Sequelize.INTEGER,
          allowNull: true,
          comment: 'Y coordinate of faction capital'
        },
        bonuses: {
          type: Sequelize.JSONB,
          allowNull: false,
          defaultValue: {},
          comment: 'Faction passive bonuses { defense: 1.15, production: 1.25, ... }'
        },
        unique_unit_type: {
          type: Sequelize.STRING(50),
          allowNull: true,
          comment: 'Unique unit type (Shield_Guardian, Desert_Raider, Corporate_Enforcer)'
        },
        unique_unit_stats: {
          type: Sequelize.JSONB,
          allowNull: true,
          comment: 'Stats for unique unit'
        },
        lore: {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: 'Faction backstory/philosophy'
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      }, { transaction });

      // Seed 3 factions
      await queryInterface.bulkInsert('factions', [
        {
          id: 'TERRAN_FEDERATION',
          name: 'Terran Federation',
          description: 'Defenders of humanity through science and order',
          color: '#0066FF',
          capital_x: 50,
          capital_y: 50,
          bonuses: JSON.stringify({
            defense: 1.15,
            building_speed_research: 1.1,
            shield_regen: 1.2,
            tech_cost_reduction: 0.95
          }),
          unique_unit_type: 'Shield_Guardian',
          unique_unit_stats: JSON.stringify({
            hp: 150,
            attack: 80,
            defense: 120,
            speed: 0.8
          }),
          lore: 'Science and order protect humanity.',
          created_at: new Date()
        },
        {
          id: 'NOMAD_RAIDERS',
          name: 'Nomad Raiders',
          description: 'Desert warriors valuing speed and strength',
          color: '#FF3333',
          capital_x: 150,
          capital_y: 50,
          bonuses: JSON.stringify({
            attack: 1.20,
            movement_speed: 1.15,
            raid_loot: 1.10,
            training_speed_military: 1.1
          }),
          unique_unit_type: 'Desert_Raider',
          unique_unit_stats: JSON.stringify({
            hp: 80,
            attack: 100,
            defense: 60,
            speed: 1.3
          }),
          lore: 'Speed and strength are the only laws.',
          created_at: new Date()
        },
        {
          id: 'INDUSTRIAL_SYNDICATE',
          name: 'Industrial Syndicate',
          description: 'Economic powerhouse controlling trade routes',
          color: '#FFD700',
          capital_x: 100,
          capital_y: 150,
          bonuses: JSON.stringify({
            production: 1.25,
            trade_tax_reduction: 0.5,
            market_fee_reduction: 0.7,
            construction_cost: 0.95
          }),
          unique_unit_type: 'Corporate_Enforcer',
          unique_unit_stats: JSON.stringify({
            hp: 100,
            attack: 90,
            defense: 90,
            speed: 1.0
          }),
          lore: 'Gold builds empires more surely than steel.',
          created_at: new Date()
        }
      ], { transaction });

      console.log('✅ Factions table created and seeded (3 factions)');

      // ==================== TABLE 2: control_zones ====================
      await queryInterface.createTable('control_zones', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        name: {
          type: Sequelize.STRING(100),
          allowNull: false,
          unique: true,
          comment: 'Zone name (Central Highlands, Titanium Crater, etc.)'
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        center_x: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'X coordinate of zone center'
        },
        center_y: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'Y coordinate of zone center'
        },
        radius: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 30,
          comment: 'Zone radius in tiles'
        },
        current_controller: {
          type: Sequelize.STRING(50),
          allowNull: true,
          references: {
            model: 'factions',
            key: 'id'
          },
          onDelete: 'SET NULL',
          comment: 'Faction ID controlling this zone (NULL = neutral)'
        },
        control_threshold: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 1000,
          comment: 'Control points needed to capture zone'
        },
        captured_at: {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'Timestamp when zone was captured'
        },
        bonuses: {
          type: Sequelize.JSONB,
          allowNull: false,
          defaultValue: {},
          comment: 'Bonuses granted by controlling this zone { metal: 1.15, defense: 1.10 }'
        },
        strategic_value: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 3,
          comment: 'Importance rating 1-5'
        },
        status: {
          type: Sequelize.STRING(20),
          allowNull: false,
          defaultValue: 'neutral',
          comment: 'neutral, contested, or controlled'
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
      }, { transaction });

      // Indexes for control_zones
      await queryInterface.addIndex('control_zones', ['current_controller'], {
        name: 'idx_control_zones_controller',
        transaction
      });
      await queryInterface.addIndex('control_zones', ['center_x', 'center_y'], {
        name: 'idx_control_zones_coordinates',
        transaction
      });
      await queryInterface.addIndex('control_zones', ['status'], {
        name: 'idx_control_zones_status',
        transaction
      });

      // Seed 10 strategic zones
      await queryInterface.bulkInsert('control_zones', [
        {
          name: 'Central Highlands',
          description: 'Strategic central position with metal-rich mountains',
          center_x: 100,
          center_y: 100,
          radius: 30,
          control_threshold: 1000,
          bonuses: JSON.stringify({ metal: 1.15, defense: 1.10 }),
          strategic_value: 5,
          status: 'neutral',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: 'Titanium Crater',
          description: 'Rare titanium deposits, highly contested',
          center_x: 150,
          center_y: 80,
          radius: 25,
          control_threshold: 1500,
          bonuses: JSON.stringify({ titanium: 2.0, research_speed: 1.05 }),
          strategic_value: 5,
          status: 'neutral',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: 'Northern Desert',
          description: 'Nomad homeland with fuel reserves',
          center_x: 100,
          center_y: 50,
          radius: 40,
          control_threshold: 750,
          current_controller: 'NOMAD_RAIDERS',
          captured_at: new Date(),
          bonuses: JSON.stringify({ movement_speed: 1.10, carburant: 1.20 }),
          strategic_value: 3,
          status: 'controlled',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: 'Industrial Belt',
          description: 'Manufacturing hub with production facilities',
          center_x: 120,
          center_y: 130,
          radius: 35,
          control_threshold: 800,
          current_controller: 'INDUSTRIAL_SYNDICATE',
          captured_at: new Date(),
          bonuses: JSON.stringify({ production: 1.20, construction_speed: 1.10 }),
          strategic_value: 4,
          status: 'controlled',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: 'Research Valley',
          description: 'Ancient technology ruins with research bonuses',
          center_x: 60,
          center_y: 70,
          radius: 30,
          control_threshold: 900,
          current_controller: 'TERRAN_FEDERATION',
          captured_at: new Date(),
          bonuses: JSON.stringify({ research_speed: 1.25, tech_cost: 0.90 }),
          strategic_value: 4,
          status: 'controlled',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: 'Eastern Trade Route',
          description: 'Major commercial highway',
          center_x: 140,
          center_y: 100,
          radius: 35,
          control_threshold: 700,
          bonuses: JSON.stringify({ trade_income: 1.15, movement_speed: 1.05 }),
          strategic_value: 3,
          status: 'neutral',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: 'Plasma Fields',
          description: 'Energy-rich plasma deposits',
          center_x: 80,
          center_y: 120,
          radius: 28,
          control_threshold: 1200,
          bonuses: JSON.stringify({ plasma: 1.50, energy_production: 1.20 }),
          strategic_value: 4,
          status: 'neutral',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: 'Fortress Ridge',
          description: 'Naturally defensible mountain range',
          center_x: 50,
          center_y: 100,
          radius: 25,
          control_threshold: 1100,
          bonuses: JSON.stringify({ defense: 1.30, hp_regen: 1.15 }),
          strategic_value: 4,
          status: 'neutral',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: 'Southern Outpost',
          description: 'Remote frontier with expansion opportunities',
          center_x: 100,
          center_y: 150,
          radius: 30,
          control_threshold: 600,
          bonuses: JSON.stringify({ expansion_cost: 0.85, scout_range: 1.20 }),
          strategic_value: 2,
          status: 'neutral',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: 'Nanotube Mines',
          description: 'Advanced material extraction site',
          center_x: 130,
          center_y: 60,
          radius: 22,
          control_threshold: 1300,
          bonuses: JSON.stringify({ nanotubes: 1.80, crafting_speed: 1.15 }),
          strategic_value: 5,
          status: 'neutral',
          created_at: new Date(),
          updated_at: new Date()
        }
      ], { transaction });

      console.log('✅ Control zones table created and seeded (10 zones)');

      // ==================== TABLE 3: faction_control_points ====================
      await queryInterface.createTable('faction_control_points', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        zone_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'control_zones',
            key: 'id'
          },
          onDelete: 'CASCADE'
        },
        faction_id: {
          type: Sequelize.STRING(50),
          allowNull: false,
          references: {
            model: 'factions',
            key: 'id'
          },
          onDelete: 'CASCADE'
        },
        control_points: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
          comment: 'Total control points accumulated'
        },
        points_buildings: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
          comment: 'Points from building constructions'
        },
        points_military: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
          comment: 'Points from military presence'
        },
        points_attacks: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
          comment: 'Points from successful attacks'
        },
        points_trade: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
          comment: 'Points from trade activity'
        },
        last_contribution_at: {
          type: Sequelize.DATE,
          allowNull: true
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      }, { transaction });

      // Unique constraint: one entry per zone-faction pair
      await queryInterface.addConstraint('faction_control_points', {
        fields: ['zone_id', 'faction_id'],
        type: 'unique',
        name: 'unique_zone_faction',
        transaction
      });

      // Indexes
      await queryInterface.addIndex('faction_control_points', ['zone_id'], {
        name: 'idx_faction_control_points_zone',
        transaction
      });
      await queryInterface.addIndex('faction_control_points', ['faction_id'], {
        name: 'idx_faction_control_points_faction',
        transaction
      });

      // Seed initial control points for controlled zones
      await queryInterface.bulkInsert('faction_control_points', [
        // Nomad Raiders - Northern Desert (zone_id: 3)
        {
          zone_id: 3,
          faction_id: 'NOMAD_RAIDERS',
          control_points: 800,
          points_buildings: 0,
          points_military: 500,
          points_attacks: 300,
          points_trade: 0,
          last_contribution_at: new Date(),
          updated_at: new Date()
        },
        // Industrial Syndicate - Industrial Belt (zone_id: 4)
        {
          zone_id: 4,
          faction_id: 'INDUSTRIAL_SYNDICATE',
          control_points: 850,
          points_buildings: 600,
          points_military: 0,
          points_attacks: 0,
          points_trade: 250,
          last_contribution_at: new Date(),
          updated_at: new Date()
        },
        // Terran Federation - Research Valley (zone_id: 5)
        {
          zone_id: 5,
          faction_id: 'TERRAN_FEDERATION',
          control_points: 950,
          points_buildings: 700,
          points_military: 250,
          points_attacks: 0,
          points_trade: 0,
          last_contribution_at: new Date(),
          updated_at: new Date()
        }
      ], { transaction });

      console.log('✅ Faction control points table created and seeded');

      // ==================== TABLE 4: user_factions ====================
      await queryInterface.createTable('user_factions', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          },
          onDelete: 'CASCADE'
        },
        faction_id: {
          type: Sequelize.STRING(50),
          allowNull: false,
          references: {
            model: 'factions',
            key: 'id'
          },
          onDelete: 'CASCADE'
        },
        joined_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        left_at: {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'NULL if currently active'
        },
        contribution_points: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
          comment: 'Total points contributed by user'
        },
        can_change_at: {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'Cooldown expiry date for faction change (30 days)'
        },
        is_active: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true
        }
      }, { transaction });

      // Indexes
      await queryInterface.addIndex('user_factions', ['user_id'], {
        name: 'idx_user_factions_user',
        transaction
      });
      await queryInterface.addIndex('user_factions', ['faction_id', 'is_active'], {
        name: 'idx_user_factions_faction_active',
        transaction,
        where: { is_active: true }
      });

      console.log('✅ User factions table created');

      // ==================== ALTER users TABLE ====================
      // Add active_bonuses column to users table for storing calculated faction bonuses
      await queryInterface.addColumn('users', 'active_bonuses', {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
        comment: 'Calculated faction + territorial bonuses { defense: 1.265, metal: 1.15, ... }'
      }, { transaction });

      console.log('✅ Added active_bonuses column to users table');

      await transaction.commit();
      console.log('✅ Factions system migration completed successfully');
      console.log('   - 3 factions created (Terran, Nomad, Syndicate)');
      console.log('   - 10 control zones seeded');
      console.log('   - 3 zones initially controlled by factions');

    } catch (error) {
      await transaction.rollback();
      console.error('❌ Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Drop in reverse order (respect foreign keys)
      await queryInterface.removeColumn('users', 'active_bonuses', { transaction });
      await queryInterface.dropTable('user_factions', { transaction });
      await queryInterface.dropTable('faction_control_points', { transaction });
      await queryInterface.dropTable('control_zones', { transaction });
      await queryInterface.dropTable('factions', { transaction });

      await transaction.commit();
      console.log('✅ Factions system migration rolled back');

    } catch (error) {
      await transaction.rollback();
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }
};
