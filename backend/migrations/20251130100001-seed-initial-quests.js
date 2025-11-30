'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    
    // Quêtes journalières initiales
    await queryInterface.bulkInsert('quests', [
      // QUÊTES ÉCONOMIE - FACILE
      {
        key: 'daily_collect_gold',
        type: 'daily',
        category: 'economy',
        title: 'Collecteur d\'or',
        description: 'Collectez 1000 pièces d\'or',
        objective_type: 'collect_resources',
        objective_target: 1000,
        objective_data: JSON.stringify({ resource: 'or' }),
        reward_or: 500,
        reward_metal: 0,
        reward_carburant: 0,
        reward_xp: 50,
        reward_items: null,
        difficulty: 'easy',
        min_level: 1,
        is_active: true,
        icon: '💰',
        createdAt: now,
        updatedAt: now
      },
      {
        key: 'daily_collect_metal',
        type: 'daily',
        category: 'economy',
        title: 'Mineur de métal',
        description: 'Collectez 800 unités de métal',
        objective_type: 'collect_resources',
        objective_target: 800,
        objective_data: JSON.stringify({ resource: 'metal' }),
        reward_or: 0,
        reward_metal: 400,
        reward_carburant: 0,
        reward_xp: 50,
        reward_items: null,
        difficulty: 'easy',
        min_level: 1,
        is_active: true,
        icon: '🔩',
        createdAt: now,
        updatedAt: now
      },
      {
        key: 'daily_collect_fuel',
        type: 'daily',
        category: 'economy',
        title: 'Raffineur de carburant',
        description: 'Collectez 500 litres de carburant',
        objective_type: 'collect_resources',
        objective_target: 500,
        objective_data: JSON.stringify({ resource: 'carburant' }),
        reward_or: 0,
        reward_metal: 0,
        reward_carburant: 250,
        reward_xp: 50,
        reward_items: null,
        difficulty: 'easy',
        min_level: 3,
        is_active: true,
        icon: '⛽',
        createdAt: now,
        updatedAt: now
      },

      // QUÊTES COMBAT - MOYEN
      {
        key: 'daily_train_units',
        type: 'daily',
        category: 'combat',
        title: 'Entraînement militaire',
        description: 'Entraînez 10 unités militaires',
        objective_type: 'train_units',
        objective_target: 10,
        objective_data: null,
        reward_or: 800,
        reward_metal: 0,
        reward_carburant: 0,
        reward_xp: 100,
        reward_items: null,
        difficulty: 'medium',
        min_level: 2,
        is_active: true,
        icon: '⚔️',
        createdAt: now,
        updatedAt: now
      },
      {
        key: 'daily_win_battles',
        type: 'daily',
        category: 'combat',
        title: 'Conquérant',
        description: 'Remportez 3 combats',
        objective_type: 'win_battles',
        objective_target: 3,
        objective_data: null,
        reward_or: 1500,
        reward_metal: 0,
        reward_carburant: 0,
        reward_xp: 150,
        reward_items: JSON.stringify({ units: [{ type: 'Infantry', quantity: 5 }] }),
        difficulty: 'medium',
        min_level: 5,
        is_active: true,
        icon: '🏆',
        createdAt: now,
        updatedAt: now
      },

      // QUÊTES BÂTIMENTS - FACILE À MOYEN
      {
        key: 'daily_upgrade_building',
        type: 'daily',
        category: 'buildings',
        title: 'Urbaniste',
        description: 'Améliorez un bâtiment',
        objective_type: 'upgrade_building',
        objective_target: 1,
        objective_data: null,
        reward_or: 600,
        reward_metal: 300,
        reward_carburant: 0,
        reward_xp: 80,
        reward_items: null,
        difficulty: 'medium',
        min_level: 2,
        is_active: true,
        icon: '🏭️',
        createdAt: now,
        updatedAt: now
      },

      // QUÊTES RECHERCHE - MOYEN
      {
        key: 'daily_research',
        type: 'daily',
        category: 'research',
        title: 'Chercheur',
        description: 'Complétez une recherche',
        objective_type: 'complete_research',
        objective_target: 1,
        objective_data: null,
        reward_or: 1000,
        reward_metal: 0,
        reward_carburant: 0,
        reward_xp: 120,
        reward_items: null,
        difficulty: 'medium',
        min_level: 4,
        is_active: true,
        icon: '🔬',
        createdAt: now,
        updatedAt: now
      },

      // QUÊTES SOCIAL - FACILE
      {
        key: 'daily_trade',
        type: 'daily',
        category: 'social',
        title: 'Commerçant',
        description: 'Effectuez 2 échanges commerciaux',
        objective_type: 'complete_trades',
        objective_target: 2,
        objective_data: null,
        reward_or: 700,
        reward_metal: 0,
        reward_carburant: 0,
        reward_xp: 70,
        reward_items: null,
        difficulty: 'easy',
        min_level: 6,
        is_active: true,
        icon: '🤝',
        createdAt: now,
        updatedAt: now
      },

      // QUÊTES HEBDOMADAIRES - DIFFICILE
      {
        key: 'weekly_grand_collector',
        type: 'weekly',
        category: 'economy',
        title: 'Grand Collecteur',
        description: 'Collectez 50000 pièces d\'or en une semaine',
        objective_type: 'collect_resources',
        objective_target: 50000,
        objective_data: JSON.stringify({ resource: 'or' }),
        reward_or: 10000,
        reward_metal: 5000,
        reward_carburant: 3000,
        reward_xp: 500,
        reward_items: null,
        difficulty: 'hard',
        min_level: 5,
        is_active: true,
        icon: '👑',
        createdAt: now,
        updatedAt: now
      },
      {
        key: 'weekly_warlord',
        type: 'weekly',
        category: 'combat',
        title: 'Seigneur de Guerre',
        description: 'Remportez 20 combats en une semaine',
        objective_type: 'win_battles',
        objective_target: 20,
        objective_data: null,
        reward_or: 15000,
        reward_metal: 0,
        reward_carburant: 0,
        reward_xp: 800,
        reward_items: JSON.stringify({ 
          units: [
            { type: 'Infantry', quantity: 20 },
            { type: 'Tank', quantity: 5 }
          ] 
        }),
        difficulty: 'epic',
        min_level: 8,
        is_active: true,
        icon: '⚡',
        createdAt: now,
        updatedAt: now
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('quests', null, {});
  }
};
