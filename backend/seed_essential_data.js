#!/usr/bin/env node
/**
 * Essential Data Seeder
 * Seeds only the static game configuration data required for Terra Dominus:
 * - Factions (3 playable factions)
 * - Battle Pass Season (initial season)
 * 
 * Note: Entities are auto-seeded by Sequelize when the schema is created.
 * Resources and cities are created dynamically when users register.
 */

const sequelize = require('./db');
const { logger } = require('./utils/logger');

async function seedEssentialData() {
  try {
    logger.info('Starting essential data seeding...');
    
    // Load all models (this ensures they're registered with sequelize)
    const models = require('./models');
    
    // Ensure tables exist
    await sequelize.sync({ alter: false });
    logger.info('Database tables synchronized');

    // Get models
    const { Faction, BattlePassSeason } = models;

    // 1. Seed Factions (if they don't exist)
    const factionCount = await Faction.count();
    if (factionCount === 0) {
      logger.info('Seeding factions...');
      
      const factions = [
        {
          id: 'TERRAN_FEDERATION',
          name: 'Terran Federation',
          description: 'Defenders of humanity through science and order',
          color: '#0066FF',
          capital_x: 50,
          capital_y: 50,
          bonuses: {
            defense: 1.15,
            shield_regen: 1.2,
            tech_cost_reduction: 0.95,
            building_speed_research: 1.1
          },
          unique_unit_type: 'Shield_Guardian',
          unique_unit_stats: {
            hp: 150,
            speed: 0.8,
            attack: 80,
            defense: 120
          },
          lore: 'Science and order protect humanity.'
        },
        {
          id: 'NOMAD_RAIDERS',
          name: 'Nomad Raiders',
          description: 'Desert warriors valuing speed and strength',
          color: '#FF3333',
          capital_x: 150,
          capital_y: 50,
          bonuses: {
            attack: 1.2,
            raid_loot: 1.1,
            movement_speed: 1.15,
            training_speed_military: 1.1
          },
          unique_unit_type: 'Desert_Raider',
          unique_unit_stats: {
            hp: 80,
            speed: 1.3,
            attack: 100,
            defense: 60
          },
          lore: 'Speed and strength are the only laws.'
        },
        {
          id: 'INDUSTRIAL_SYNDICATE',
          name: 'Industrial Syndicate',
          description: 'Economic powerhouse controlling trade routes',
          color: '#FFD700',
          capital_x: 100,
          capital_y: 150,
          bonuses: {
            production: 1.25,
            construction_cost: 0.95,
            trade_tax_reduction: 0.5,
            market_fee_reduction: 0.7
          },
          unique_unit_type: 'Corporate_Enforcer',
          unique_unit_stats: {
            hp: 100,
            speed: 1,
            attack: 90,
            defense: 90
          },
          lore: 'Gold builds empires more surely than steel.'
        }
      ];

      await Faction.bulkCreate(factions);
      logger.info(`✅ Seeded ${factions.length} factions`);
    } else {
      logger.info(`Factions already exist (${factionCount} found), skipping...`);
    }

    // 2. Seed Battle Pass Season (if none exists)
    const seasonCount = await BattlePassSeason.count();
    if (seasonCount === 0) {
      logger.info('Seeding initial Battle Pass season...');
      
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 3); // 3-month season

      await BattlePassSeason.create({
        season_number: 1,
        name: 'Conquête Galactique',
        description: 'La première saison de Terra Dominus - Dominez la galaxie!',
        start_date: startDate,
        end_date: endDate,
        is_active: true,
        max_tier: 100,
        xp_per_tier: 1000,
        premium_price: 5000
      });

      logger.info('✅ Seeded Battle Pass Season 1');
    } else {
      logger.info(`Battle Pass seasons already exist (${seasonCount} found), skipping...`);
    }

    logger.info('✅ Essential data seeding completed successfully');
    process.exit(0);

  } catch (error) {
    logger.error({ err: error }, 'Error seeding essential data');
    console.error('Error details:', error);
    process.exit(1);
  }
}

// Run seeder
seedEssentialData();
