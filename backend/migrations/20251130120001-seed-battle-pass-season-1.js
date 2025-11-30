'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create Season 1: "Conquête Galactique"
    const [season] = await queryInterface.sequelize.query(
      `INSERT INTO battle_pass_seasons 
       (season_number, name, description, start_date, end_date, is_active, max_tier, xp_per_tier, premium_price, created_at, updated_at)
       VALUES (1, 'Conquête Galactique', 'La première saison de Terra Dominus - Dominez la galaxie!', 
               NOW(), NOW() + INTERVAL '90 days', true, 100, 1000, 5000, NOW(), NOW())
       RETURNING id`
    );
    const seasonId = season[0].id;

    // Define rewards for all 100 tiers
    const rewards = [];

    // Helper function to create reward
    const createReward = (tier, track, type, data, displayName, icon, highlight = false) => {
      return {
        season_id: seasonId,
        tier,
        track,
        reward_type: type,
        reward_data: JSON.stringify(data),
        display_name: displayName,
        display_icon: icon,
        is_highlight: highlight,
        created_at: new Date(),
        updated_at: new Date()
      };
    };

    // Tier 1-10: Early rewards
    rewards.push(
      createReward(1, 'free', 'resources', { or: 5000, metal: 2000, carburant: 1000 }, 'Pack de Démarrage', '📦'),
      createReward(1, 'premium', 'resources', { or: 10000, metal: 5000, carburant: 3000 }, 'Pack Premium Démarrage', '🎁'),
      
      createReward(2, 'free', 'xp', { amount: 500 }, 'Bonus XP', '⭐'),
      createReward(2, 'premium', 'boost', { type: 'production', multiplier: 1.25, duration: 3600 }, 'Boost Production 1h', '⚡'),
      
      createReward(3, 'free', 'resources', { metal: 3000 }, 'Métal', '⚙️'),
      createReward(3, 'premium', 'resources', { metal: 10000, carburant: 5000 }, 'Pack Ressources', '📦'),
      
      createReward(4, 'free', 'cosmetic', { type: 'avatar', id: 'avatar_warrior' }, 'Avatar Guerrier', '🎭'),
      createReward(4, 'premium', 'units', { type: 'soldier', quantity: 50 }, '50 Soldats', '⚔️'),
      
      createReward(5, 'free', 'resources', { or: 7500 }, 'Or', '🪙', true),
      createReward(5, 'premium', 'cosmetic', { type: 'title', title: 'Commandant Élite' }, 'Titre: Commandant Élite', '🎖️', true),
      
      createReward(6, 'free', 'xp', { amount: 750 }, 'Bonus XP', '⭐'),
      createReward(6, 'premium', 'boost', { type: 'training', multiplier: 1.5, duration: 7200 }, 'Boost Entraînement 2h', '⚡'),
      
      createReward(7, 'free', 'resources', { carburant: 4000 }, 'Carburant', '⛽'),
      createReward(7, 'premium', 'blueprint', { type: 'facility', id: 'advanced_lab' }, 'Plan: Labo Avancé', '📐'),
      
      createReward(8, 'free', 'item', { type: 'shield', duration: 28800 }, 'Bouclier 8h', '🛡️'),
      createReward(8, 'premium', 'resources', { or: 15000, metal: 10000 }, 'Pack Ressources Avancé', '📦'),
      
      createReward(9, 'free', 'resources', { or: 10000, metal: 5000 }, 'Pack Ressources', '📦'),
      createReward(9, 'premium', 'units', { type: 'tank', quantity: 10 }, '10 Tanks', '🚛'),
      
      createReward(10, 'free', 'cosmetic', { type: 'badge', id: 'badge_novice' }, 'Badge Novice', '🏅', true),
      createReward(10, 'premium', 'gems', { amount: 500 }, '500 Gemmes', '💎', true)
    );

    // Tier 11-25: Mid-early rewards
    for (let tier = 11; tier <= 25; tier++) {
      if (tier % 5 === 0) {
        // Every 5 tiers: special rewards
        rewards.push(
          createReward(tier, 'free', 'resources', { or: 10000 * (tier / 5), metal: 5000 * (tier / 5) }, 'Pack Ressources Majeur', '📦', true),
          createReward(tier, 'premium', 'boost', { type: 'all', multiplier: 2, duration: 3600 * (tier / 5) }, `Boost Total ${tier/5}h`, '🌟', true)
        );
      } else {
        // Regular rewards
        const rewardTypes = ['resources', 'xp', 'units', 'cosmetic'];
        const rewardType = rewardTypes[tier % 4];
        
        if (rewardType === 'resources') {
          rewards.push(
            createReward(tier, 'free', 'resources', { or: 5000 + tier * 100, metal: 2000 + tier * 50 }, 'Ressources', '📦'),
            createReward(tier, 'premium', 'resources', { or: 10000 + tier * 200, metal: 5000 + tier * 100, carburant: tier * 50 }, 'Pack Premium', '🎁')
          );
        } else if (rewardType === 'xp') {
          rewards.push(
            createReward(tier, 'free', 'xp', { amount: 500 + tier * 25 }, 'Bonus XP', '⭐'),
            createReward(tier, 'premium', 'xp', { amount: 1000 + tier * 50 }, 'Bonus XP Premium', '🌟')
          );
        } else if (rewardType === 'units') {
          rewards.push(
            createReward(tier, 'free', 'units', { type: 'soldier', quantity: 10 + tier }, 'Soldats', '⚔️'),
            createReward(tier, 'premium', 'units', { type: 'tank', quantity: 5 + Math.floor(tier / 2) }, 'Tanks', '🚛')
          );
        } else {
          rewards.push(
            createReward(tier, 'free', 'cosmetic', { type: 'avatar', id: `avatar_tier_${tier}` }, `Avatar Niveau ${tier}`, '🎭'),
            createReward(tier, 'premium', 'cosmetic', { type: 'badge', id: `badge_tier_${tier}` }, `Badge Niveau ${tier}`, '🏅')
          );
        }
      }
    }

    // Tier 26-50: Mid rewards
    for (let tier = 26; tier <= 50; tier++) {
      if (tier === 50) {
        // Tier 50: Major milestone
        rewards.push(
          createReward(50, 'free', 'cosmetic', { type: 'title', title: 'Vétéran Chevronné' }, 'Titre: Vétéran Chevronné', '🎖️', true),
          createReward(50, 'premium', 'gems', { amount: 2000 }, '2000 Gemmes', '💎', true)
        );
      } else if (tier % 5 === 0) {
        rewards.push(
          createReward(tier, 'free', 'resources', { or: 15000 + tier * 500, metal: 10000 + tier * 250 }, 'Pack Ressources Élite', '🎁', true),
          createReward(tier, 'premium', 'blueprint', { type: 'building', id: `advanced_building_${tier}` }, 'Plan Bâtiment Avancé', '🏗️', true)
        );
      } else {
        rewards.push(
          createReward(tier, 'free', 'resources', { or: 8000 + tier * 200, metal: 4000 + tier * 100, carburant: tier * 50 }, 'Ressources', '📦'),
          createReward(tier, 'premium', 'boost', { type: 'production', multiplier: 1.5, duration: 7200 }, 'Boost Production 2h', '⚡')
        );
      }
    }

    // Tier 51-75: Late rewards
    for (let tier = 51; tier <= 75; tier++) {
      if (tier === 75) {
        // Tier 75: Major milestone
        rewards.push(
          createReward(75, 'free', 'item', { type: 'mega_shield', duration: 86400 }, 'Méga-Bouclier 24h', '🛡️', true),
          createReward(75, 'premium', 'cosmetic', { type: 'title', title: 'Conquérant Galactique' }, 'Titre: Conquérant Galactique', '👑', true)
        );
      } else if (tier % 5 === 0) {
        rewards.push(
          createReward(tier, 'free', 'resources', { or: 25000 + tier * 500, metal: 15000 + tier * 300 }, 'Pack Ressources Légendaire', '💰', true),
          createReward(tier, 'premium', 'units', { type: 'elite_force', quantity: tier / 5 }, 'Forces Élites', '⭐', true)
        );
      } else {
        rewards.push(
          createReward(tier, 'free', 'xp', { amount: 1500 + tier * 50 }, 'Bonus XP Majeur', '⭐'),
          createReward(tier, 'premium', 'resources', { or: 20000 + tier * 300, metal: 12000 + tier * 200, carburant: tier * 100 }, 'Pack Premium Élite', '🎁')
        );
      }
    }

    // Tier 76-99: End-game rewards
    for (let tier = 76; tier <= 99; tier++) {
      if (tier % 5 === 0) {
        rewards.push(
          createReward(tier, 'free', 'cosmetic', { type: 'badge', id: `legendary_badge_${tier}` }, `Badge Légendaire ${tier}`, '🏆', true),
          createReward(tier, 'premium', 'gems', { amount: 1000 + (tier - 75) * 100 }, `${1000 + (tier - 75) * 100} Gemmes`, '💎', true)
        );
      } else {
        rewards.push(
          createReward(tier, 'free', 'resources', { or: 30000 + tier * 500, metal: 20000 + tier * 300, carburant: tier * 150 }, 'Pack Ultime', '💰'),
          createReward(tier, 'premium', 'boost', { type: 'all', multiplier: 3, duration: 14400 }, 'Boost Total 4h', '🌟')
        );
      }
    }

    // Tier 100: Ultimate reward
    rewards.push(
      createReward(100, 'free', 'cosmetic', { type: 'title', title: 'Maître de la Galaxie' }, 'Titre: Maître de la Galaxie', '👑', true),
      createReward(100, 'premium', 'item', { type: 'ultimate_pack', contents: { or: 100000, metal: 75000, carburant: 50000, gems: 5000 } }, 'Pack Ultime Suprême', '🎆', true)
    );

    // Insert all rewards
    await queryInterface.bulkInsert('battle_pass_rewards', rewards);

    console.log(`✓ Battle Pass Season 1 created with ${rewards.length} rewards`);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      `DELETE FROM battle_pass_rewards WHERE season_id IN (SELECT id FROM battle_pass_seasons WHERE season_number = 1)`
    );
    await queryInterface.sequelize.query(
      `DELETE FROM battle_pass_seasons WHERE season_number = 1`
    );
  }
};
