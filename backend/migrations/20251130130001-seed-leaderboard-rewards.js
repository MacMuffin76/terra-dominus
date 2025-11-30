'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const rewardData = [];

    // Fonction helper pour créer des récompenses
    const createReward = (category, rankMin, rankMax, rewardType, rewardData, displayName, displayIcon) => ({
      category,
      season_id: null, // Permanent rewards for now
      rank_min: rankMin,
      rank_max: rankMax,
      reward_type: rewardType,
      reward_data: JSON.stringify(rewardData),
      display_name: displayName,
      display_icon: displayIcon,
      created_at: new Date(),
      updated_at: new Date()
    });

    // ==================== TOTAL POWER LEADERBOARD ====================
    rewardData.push(
      createReward('total_power', 1, 1, 'title', { title: 'Empereur Galactique' }, 'Titre: Empereur Galactique', '👑'),
      createReward('total_power', 1, 1, 'premium_currency', { amount: 1000 }, '1000 Crédits Terra', '💎'),
      createReward('total_power', 1, 1, 'cosmetic', { type: 'banner', id: 'emperor_banner' }, 'Bannière Impériale', '🚩'),
      
      createReward('total_power', 2, 3, 'title', { title: 'Seigneur de Guerre' }, 'Titre: Seigneur de Guerre', '⚔️'),
      createReward('total_power', 2, 3, 'premium_currency', { amount: 500 }, '500 Crédits Terra', '💎'),
      
      createReward('total_power', 4, 10, 'title', { title: 'Commandant Suprême' }, 'Titre: Commandant Suprême', '🎖️'),
      createReward('total_power', 4, 10, 'premium_currency', { amount: 250 }, '250 Crédits Terra', '💎'),
      
      createReward('total_power', 11, 25, 'premium_currency', { amount: 100 }, '100 Crédits Terra', '💎'),
      createReward('total_power', 11, 25, 'cosmetic', { type: 'badge', id: 'top25_power' }, 'Badge Top 25 Puissance', '🏅'),
      
      createReward('total_power', 26, 50, 'premium_currency', { amount: 50 }, '50 Crédits Terra', '💎'),
      
      createReward('total_power', 51, 100, 'premium_currency', { amount: 25 }, '25 Crédits Terra', '💎')
    );

    // ==================== ECONOMY LEADERBOARD ====================
    rewardData.push(
      createReward('economy', 1, 1, 'title', { title: 'Titan Industriel' }, 'Titre: Titan Industriel', '🏭'),
      createReward('economy', 1, 1, 'premium_currency', { amount: 800 }, '800 Crédits Terra', '💎'),
      createReward('economy', 1, 1, 'boost', { type: 'trade_tax_reduction', value: 0.5, duration: 2592000 }, 'Réduction Taxe Commerce -50% (30j)', '📉'),
      
      createReward('economy', 2, 3, 'title', { title: 'Magnat Galactique' }, 'Titre: Magnat Galactique', '💰'),
      createReward('economy', 2, 3, 'premium_currency', { amount: 400 }, '400 Crédits Terra', '💎'),
      
      createReward('economy', 4, 10, 'title', { title: 'Maître Marchand' }, 'Titre: Maître Marchand', '🤝'),
      createReward('economy', 4, 10, 'premium_currency', { amount: 200 }, '200 Crédits Terra', '💎'),
      
      createReward('economy', 11, 25, 'premium_currency', { amount: 100 }, '100 Crédits Terra', '💎'),
      createReward('economy', 11, 25, 'boost', { type: 'trade_bonus', value: 0.1, duration: 604800 }, 'Bonus Commerce +10% (7j)', '📈'),
      
      createReward('economy', 26, 50, 'premium_currency', { amount: 50 }, '50 Crédits Terra', '💎'),
      
      createReward('economy', 51, 100, 'premium_currency', { amount: 25 }, '25 Crédits Terra', '💎')
    );

    // ==================== COMBAT VICTORIES LEADERBOARD ====================
    rewardData.push(
      createReward('combat_victories', 1, 1, 'title', { title: 'Invincible' }, 'Titre: Invincible', '🛡️'),
      createReward('combat_victories', 1, 1, 'premium_currency', { amount: 1000 }, '1000 Crédits Terra', '💎'),
      createReward('combat_victories', 1, 1, 'cosmetic', { type: 'unit_skin', id: 'champion_skin' }, 'Skin Unité Champion', '🎨'),
      
      createReward('combat_victories', 2, 3, 'title', { title: 'Conquérant' }, 'Titre: Conquérant', '⚔️'),
      createReward('combat_victories', 2, 3, 'premium_currency', { amount: 500 }, '500 Crédits Terra', '💎'),
      
      createReward('combat_victories', 4, 10, 'title', { title: 'Vétéran de Guerre' }, 'Titre: Vétéran de Guerre', '🎖️'),
      createReward('combat_victories', 4, 10, 'premium_currency', { amount: 250 }, '250 Crédits Terra', '💎'),
      
      createReward('combat_victories', 11, 25, 'premium_currency', { amount: 100 }, '100 Crédits Terra', '💎'),
      createReward('combat_victories', 11, 25, 'boost', { type: 'attack_bonus', value: 0.05, duration: 604800 }, 'Bonus Attaque +5% (7j)', '⚡'),
      
      createReward('combat_victories', 26, 50, 'premium_currency', { amount: 50 }, '50 Crédits Terra', '💎'),
      
      createReward('combat_victories', 51, 100, 'premium_currency', { amount: 25 }, '25 Crédits Terra', '💎')
    );

    // ==================== BUILDINGS LEADERBOARD ====================
    rewardData.push(
      createReward('buildings', 1, 1, 'title', { title: 'Architecte Suprême' }, 'Titre: Architecte Suprême', '🏛️'),
      createReward('buildings', 1, 1, 'premium_currency', { amount: 600 }, '600 Crédits Terra', '💎'),
      createReward('buildings', 1, 1, 'building_skin', { type: 'command_center', id: 'gold_palace' }, 'Skin Centre de Commande Doré', '🏰'),
      
      createReward('buildings', 2, 3, 'title', { title: 'Grand Bâtisseur' }, 'Titre: Grand Bâtisseur', '🏗️'),
      createReward('buildings', 2, 3, 'premium_currency', { amount: 300 }, '300 Crédits Terra', '💎'),
      
      createReward('buildings', 4, 10, 'title', { title: 'Ingénieur Elite' }, 'Titre: Ingénieur Elite', '⚙️'),
      createReward('buildings', 4, 10, 'premium_currency', { amount: 150 }, '150 Crédits Terra', '💎'),
      
      createReward('buildings', 11, 25, 'premium_currency', { amount: 75 }, '75 Crédits Terra', '💎'),
      createReward('buildings', 11, 25, 'boost', { type: 'construction_speed', value: 0.1, duration: 604800 }, 'Vitesse Construction +10% (7j)', '⏱️'),
      
      createReward('buildings', 26, 50, 'premium_currency', { amount: 40 }, '40 Crédits Terra', '💎'),
      
      createReward('buildings', 51, 100, 'premium_currency', { amount: 20 }, '20 Crédits Terra', '💎')
    );

    // ==================== RESEARCH LEADERBOARD ====================
    rewardData.push(
      createReward('research', 1, 1, 'title', { title: 'Génie Scientifique' }, 'Titre: Génie Scientifique', '🧪'),
      createReward('research', 1, 1, 'premium_currency', { amount: 700 }, '700 Crédits Terra', '💎'),
      createReward('research', 1, 1, 'boost', { type: 'research_speed', value: 0.2, duration: 2592000 }, 'Vitesse Recherche +20% (30j)', '🔬'),
      
      createReward('research', 2, 3, 'title', { title: 'Savant' }, 'Titre: Savant', '📚'),
      createReward('research', 2, 3, 'premium_currency', { amount: 350 }, '350 Crédits Terra', '💎'),
      
      createReward('research', 4, 10, 'title', { title: 'Chercheur Avancé' }, 'Titre: Chercheur Avancé', '🔭'),
      createReward('research', 4, 10, 'premium_currency', { amount: 175 }, '175 Crédits Terra', '💎'),
      
      createReward('research', 11, 25, 'premium_currency', { amount: 85 }, '85 Crédits Terra', '💎'),
      createReward('research', 11, 25, 'boost', { type: 'research_speed', value: 0.05, duration: 604800 }, 'Vitesse Recherche +5% (7j)', '⚗️'),
      
      createReward('research', 26, 50, 'premium_currency', { amount: 45 }, '45 Crédits Terra', '💎'),
      
      createReward('research', 51, 100, 'premium_currency', { amount: 20 }, '20 Crédits Terra', '💎')
    );

    // ==================== ACHIEVEMENTS LEADERBOARD ====================
    rewardData.push(
      createReward('achievements', 1, 1, 'title', { title: 'Collectionneur Légendaire' }, 'Titre: Collectionneur Légendaire', '🏆'),
      createReward('achievements', 1, 1, 'premium_currency', { amount: 800 }, '800 Crédits Terra', '💎'),
      createReward('achievements', 1, 1, 'cosmetic', { type: 'badge', id: 'achievement_master' }, 'Badge Maître des Succès', '🌟'),
      
      createReward('achievements', 2, 3, 'title', { title: 'Chasseur de Trophées' }, 'Titre: Chasseur de Trophées', '🎯'),
      createReward('achievements', 2, 3, 'premium_currency', { amount: 400 }, '400 Crédits Terra', '💎'),
      
      createReward('achievements', 4, 10, 'title', { title: 'Aventurier' }, 'Titre: Aventurier', '🗺️'),
      createReward('achievements', 4, 10, 'premium_currency', { amount: 200 }, '200 Crédits Terra', '💎'),
      
      createReward('achievements', 11, 25, 'premium_currency', { amount: 100 }, '100 Crédits Terra', '💎'),
      
      createReward('achievements', 26, 50, 'premium_currency', { amount: 50 }, '50 Crédits Terra', '💎'),
      
      createReward('achievements', 51, 100, 'premium_currency', { amount: 25 }, '25 Crédits Terra', '💎')
    );

    // ==================== BATTLE PASS LEADERBOARD ====================
    rewardData.push(
      createReward('battle_pass', 1, 1, 'title', { title: 'Maître de la Saison' }, 'Titre: Maître de la Saison', '👾'),
      createReward('battle_pass', 1, 1, 'premium_currency', { amount: 1000 }, '1000 Crédits Terra', '💎'),
      createReward('battle_pass', 1, 1, 'cosmetic', { type: 'banner', id: 'season_champion' }, 'Bannière Champion de Saison', '🚩'),
      
      createReward('battle_pass', 2, 3, 'title', { title: 'Progresseur Elite' }, 'Titre: Progresseur Elite', '📊'),
      createReward('battle_pass', 2, 3, 'premium_currency', { amount: 500 }, '500 Crédits Terra', '💎'),
      
      createReward('battle_pass', 4, 10, 'title', { title: 'Grimpeur de Tier' }, 'Titre: Grimpeur de Tier', '🪜'),
      createReward('battle_pass', 4, 10, 'premium_currency', { amount: 250 }, '250 Crédits Terra', '💎'),
      
      createReward('battle_pass', 11, 25, 'premium_currency', { amount: 100 }, '100 Crédits Terra', '💎'),
      
      createReward('battle_pass', 26, 50, 'premium_currency', { amount: 50 }, '50 Crédits Terra', '💎'),
      
      createReward('battle_pass', 51, 100, 'premium_currency', { amount: 25 }, '25 Crédits Terra', '💎')
    );

    // Insérer toutes les récompenses
    await queryInterface.bulkInsert('leaderboard_rewards', rewardData);

    console.log(`✓ Inserted ${rewardData.length} leaderboard rewards`);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('leaderboard_rewards', null, {});
    console.log('✓ Leaderboard rewards deleted');
  }
};
