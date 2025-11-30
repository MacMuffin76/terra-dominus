/**
 * Seed Portal Quest System with initial content
 * Story quests: 15 quests (5 chapters × 3 quests)
 * Daily quests: 20 quests
 * Weekly quests: 5 quests
 */

'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // ============================================
    // STORY QUESTS
    // ============================================
    const storyQuests = [
      // Chapter 1: Grey Portals → Unlock Green
      {
        quest_type: 'story',
        quest_category: 'portal_progression',
        title: 'First Steps into the Unknown',
        description: 'The portals have appeared across your territory. Send your forces to investigate and conquer your first grey portal.',
        chapter: 1,
        order_in_chapter: 1,
        prerequisite_quest_id: null,
        objectives: JSON.stringify([
          { type: 'portal_victories', target: 1, description: 'Complete 1 grey portal', filters: { portal_tier: 'grey' } }
        ]),
        rewards: JSON.stringify({ gold: 1000, experience: 500 }),
        is_active: true,
        required_level: 1,
        required_mastery_tier: null,
        created_at: now,
        updated_at: now,
      },
      {
        quest_type: 'story',
        quest_category: 'portal_progression',
        title: 'Portal Mastery Begins',
        description: 'Prove your combat prowess by defeating multiple grey portals. Learn the tactics of portal warfare.',
        chapter: 1,
        order_in_chapter: 2,
        prerequisite_quest_id: null,
        objectives: JSON.stringify([
          { type: 'portal_victories', target: 3, description: 'Complete 3 grey portals', filters: { portal_tier: 'grey' } }
        ]),
        rewards: JSON.stringify({ gold: 2500, experience: 1000 }),
        is_active: true,
        required_level: 1,
        required_mastery_tier: null,
        created_at: now,
        updated_at: now,
      },
      {
        quest_type: 'story',
        quest_category: 'portal_progression',
        title: 'Gateway to Greater Power',
        description: 'Your mastery of grey portals has proven your worth. The green portals await those brave enough to face them.',
        chapter: 1,
        order_in_chapter: 3,
        prerequisite_quest_id: null,
        objectives: JSON.stringify([
          { type: 'portal_victories', target: 5, description: 'Complete 5 grey portals', filters: { portal_tier: 'grey' } }
        ]),
        rewards: JSON.stringify({
          gold: 5000,
          experience: 2000,
          unlocks: [{ type: 'portal_tier', key: 'portal_tier_green' }]
        }),
        is_active: true,
        required_level: 1,
        required_mastery_tier: null,
        created_at: now,
        updated_at: now,
      },

      // Chapter 2: Green Portals → Unlock Blue
      {
        quest_type: 'story',
        quest_category: 'portal_progression',
        title: 'Into the Emerald Depths',
        description: 'The green portals are more dangerous than anything you have faced before. Prove you can survive their trials.',
        chapter: 2,
        order_in_chapter: 1,
        prerequisite_quest_id: null,
        objectives: JSON.stringify([
          { type: 'portal_victories', target: 3, description: 'Complete 3 green portals', filters: { portal_tier: 'green' } }
        ]),
        rewards: JSON.stringify({ gold: 7500, experience: 3000 }),
        is_active: true,
        required_level: 5,
        required_mastery_tier: null,
        created_at: now,
        updated_at: now,
      },
      {
        quest_type: 'story',
        quest_category: 'portal_progression',
        title: 'Advanced Tactics',
        description: 'Master the art of tactical warfare by achieving perfect victories in green portals.',
        chapter: 2,
        order_in_chapter: 2,
        prerequisite_quest_id: null,
        objectives: JSON.stringify([
          { type: 'perfect_victories', target: 2, description: 'Win 2 battles with no unit losses' }
        ]),
        rewards: JSON.stringify({ gold: 10000, experience: 4000 }),
        is_active: true,
        required_level: 5,
        required_mastery_tier: null,
        created_at: now,
        updated_at: now,
      },
      {
        quest_type: 'story',
        quest_category: 'portal_progression',
        title: 'The Azure Challenge',
        description: 'Your victories have opened the path to the blue portals. Only the strongest commanders can survive their trials.',
        chapter: 2,
        order_in_chapter: 3,
        prerequisite_quest_id: null,
        objectives: JSON.stringify([
          { type: 'portal_victories', target: 8, description: 'Complete 8 green portals', filters: { portal_tier: 'green' } }
        ]),
        rewards: JSON.stringify({
          gold: 15000,
          experience: 5000,
          unlocks: [{ type: 'portal_tier', key: 'portal_tier_blue' }]
        }),
        is_active: true,
        required_level: 5,
        required_mastery_tier: null,
        created_at: now,
        updated_at: now,
      },

      // Chapter 3: Blue Portals + Boss → Unlock Purple
      {
        quest_type: 'story',
        quest_category: 'boss_encounters',
        title: 'The First Guardian',
        description: 'Reports speak of powerful guardians emerging from the portals. Defeat your first portal boss.',
        chapter: 3,
        order_in_chapter: 1,
        prerequisite_quest_id: null,
        objectives: JSON.stringify([
          { type: 'boss_defeats', target: 1, description: 'Defeat 1 portal boss' }
        ]),
        rewards: JSON.stringify({ gold: 20000, experience: 8000 }),
        is_active: true,
        required_level: 10,
        required_mastery_tier: null,
        created_at: now,
        updated_at: now,
      },
      {
        quest_type: 'story',
        quest_category: 'portal_progression',
        title: 'Blue Portal Mastery',
        description: 'The blue portals test your limits. Prove your command by conquering them repeatedly.',
        chapter: 3,
        order_in_chapter: 2,
        prerequisite_quest_id: null,
        objectives: JSON.stringify([
          { type: 'portal_victories', target: 10, description: 'Complete 10 blue portals', filters: { portal_tier: 'blue' } }
        ]),
        rewards: JSON.stringify({ gold: 25000, experience: 10000 }),
        is_active: true,
        required_level: 10,
        required_mastery_tier: null,
        created_at: now,
        updated_at: now,
      },
      {
        quest_type: 'story',
        quest_category: 'portal_progression',
        title: 'The Purple Veil',
        description: 'Legends speak of purple portals containing unimaginable power. Your victories have earned you the right to face them.',
        chapter: 3,
        order_in_chapter: 3,
        prerequisite_quest_id: null,
        objectives: JSON.stringify([
          { type: 'damage_dealt', target: 100000, description: 'Deal 100,000 total damage in portal battles' }
        ]),
        rewards: JSON.stringify({
          gold: 30000,
          experience: 12000,
          unlocks: [{ type: 'portal_tier', key: 'portal_tier_purple' }]
        }),
        is_active: true,
        required_level: 10,
        required_mastery_tier: null,
        created_at: now,
        updated_at: now,
      },

      // Chapter 4: Purple Portals + Titan → Unlock Red
      {
        quest_type: 'story',
        quest_category: 'boss_encounters',
        title: 'The Ancient Titan',
        description: 'An ancient titan has emerged from the depths. Only the bravest commanders dare to challenge it.',
        chapter: 4,
        order_in_chapter: 1,
        prerequisite_quest_id: null,
        objectives: JSON.stringify([
          { type: 'boss_defeats', target: 1, description: 'Defeat the Ancient Titan', filters: { boss_type: 'Ancient Titan' } }
        ]),
        rewards: JSON.stringify({ gold: 40000, experience: 15000 }),
        is_active: true,
        required_level: 15,
        required_mastery_tier: null,
        created_at: now,
        updated_at: now,
      },
      {
        quest_type: 'story',
        quest_category: 'portal_progression',
        title: 'Purple Portal Conquest',
        description: 'The purple portals are the ultimate test of tactical brilliance. Conquer them to prove your mastery.',
        chapter: 4,
        order_in_chapter: 2,
        prerequisite_quest_id: null,
        objectives: JSON.stringify([
          { type: 'portal_victories', target: 15, description: 'Complete 15 purple portals', filters: { portal_tier: 'purple' } }
        ]),
        rewards: JSON.stringify({ gold: 50000, experience: 20000 }),
        is_active: true,
        required_level: 15,
        required_mastery_tier: null,
        created_at: now,
        updated_at: now,
      },
      {
        quest_type: 'story',
        quest_category: 'portal_progression',
        title: 'The Crimson Gateway',
        description: 'The red portals await. Only those who have mastered all that came before may enter.',
        chapter: 4,
        order_in_chapter: 3,
        prerequisite_quest_id: null,
        objectives: JSON.stringify([
          { type: 'boss_phase_reached', target: 3, description: 'Reach phase 3 in a boss battle', filters: { phase: 3 } }
        ]),
        rewards: JSON.stringify({
          gold: 60000,
          experience: 25000,
          unlocks: [{ type: 'portal_tier', key: 'portal_tier_red' }]
        }),
        is_active: true,
        required_level: 15,
        required_mastery_tier: null,
        created_at: now,
        updated_at: now,
      },

      // Chapter 5: Red Portals + Void Reaver → Unlock Golden
      {
        quest_type: 'story',
        quest_category: 'boss_encounters',
        title: 'The Void Reaver',
        description: 'A being of pure destruction has emerged. The Void Reaver threatens to consume everything. You must stop it.',
        chapter: 5,
        order_in_chapter: 1,
        prerequisite_quest_id: null,
        objectives: JSON.stringify([
          { type: 'boss_defeats', target: 1, description: 'Defeat the Void Reaver', filters: { boss_type: 'Void Reaver' } }
        ]),
        rewards: JSON.stringify({ gold: 80000, experience: 30000 }),
        is_active: true,
        required_level: 20,
        required_mastery_tier: null,
        created_at: now,
        updated_at: now,
      },
      {
        quest_type: 'story',
        quest_category: 'boss_encounters',
        title: 'The Cosmic Emperor',
        description: 'The final challenge awaits. The Cosmic Emperor rules all portals. Only a legend can defeat it.',
        chapter: 5,
        order_in_chapter: 2,
        prerequisite_quest_id: null,
        objectives: JSON.stringify([
          { type: 'boss_defeats', target: 1, description: 'Defeat the Cosmic Emperor', filters: { boss_type: 'Cosmic Emperor' } }
        ]),
        rewards: JSON.stringify({ gold: 100000, experience: 40000 }),
        is_active: true,
        required_level: 20,
        required_mastery_tier: null,
        created_at: now,
        updated_at: now,
      },
      {
        quest_type: 'story',
        quest_category: 'portal_progression',
        title: 'Legend of the Golden Portals',
        description: 'Your legend is complete. The golden portals, the most powerful of all, are now open to you.',
        chapter: 5,
        order_in_chapter: 3,
        prerequisite_quest_id: null,
        objectives: JSON.stringify([
          { type: 'portal_victories', target: 20, description: 'Complete 20 red portals', filters: { portal_tier: 'red' } }
        ]),
        rewards: JSON.stringify({
          gold: 150000,
          experience: 50000,
          unlocks: [
            { type: 'portal_tier', key: 'portal_tier_golden' },
            { type: 'title', key: 's_rank_commander' }
          ]
        }),
        is_active: true,
        required_level: 20,
        required_mastery_tier: null,
        created_at: now,
        updated_at: now,
      },
    ];

    await queryInterface.bulkInsert('portal_quests', storyQuests);
    console.log('✅ Story quests seeded: 15 quests across 5 chapters');

    // ============================================
    // DAILY QUESTS POOL
    // ============================================
    const dailyQuests = [
      {
        quest_type: 'daily',
        quest_category: 'daily_challenge',
        title: 'Daily Portal Run',
        description: 'Complete portal battles to earn daily rewards.',
        chapter: null,
        order_in_chapter: null,
        prerequisite_quest_id: null,
        objectives: JSON.stringify([
          { type: 'portal_victories', target: 3, description: 'Win 3 portal battles' }
        ]),
        rewards: JSON.stringify({ gold: 2000, experience: 800 }),
        is_active: false,
        required_level: 1,
        required_mastery_tier: null,
        created_at: now,
        updated_at: now,
      },
      {
        quest_type: 'daily',
        quest_category: 'daily_challenge',
        title: 'Boss Hunter',
        description: 'Defeat a portal boss today.',
        chapter: null,
        order_in_chapter: null,
        prerequisite_quest_id: null,
        objectives: JSON.stringify([
          { type: 'boss_defeats', target: 1, description: 'Defeat 1 boss' }
        ]),
        rewards: JSON.stringify({ gold: 5000, experience: 2000 }),
        is_active: false,
        required_level: 5,
        required_mastery_tier: null,
        created_at: now,
        updated_at: now,
      },
      {
        quest_type: 'daily',
        quest_category: 'daily_challenge',
        title: 'Damage Dealer',
        description: 'Deal massive damage in portal battles.',
        chapter: null,
        order_in_chapter: null,
        prerequisite_quest_id: null,
        objectives: JSON.stringify([
          { type: 'damage_dealt', target: 50000, description: 'Deal 50,000 damage' }
        ]),
        rewards: JSON.stringify({ gold: 3000, experience: 1200 }),
        is_active: false,
        required_level: 1,
        required_mastery_tier: null,
        created_at: now,
        updated_at: now,
      },
      {
        quest_type: 'daily',
        quest_category: 'daily_challenge',
        title: 'Perfect Warrior',
        description: 'Win a battle without losing any units.',
        chapter: null,
        order_in_chapter: null,
        prerequisite_quest_id: null,
        objectives: JSON.stringify([
          { type: 'perfect_victories', target: 1, description: 'Win 1 perfect victory' }
        ]),
        rewards: JSON.stringify({ gold: 4000, experience: 1500 }),
        is_active: false,
        required_level: 1,
        required_mastery_tier: null,
        created_at: now,
        updated_at: now,
      },
      {
        quest_type: 'daily',
        quest_category: 'daily_challenge',
        title: 'Portal Marathon',
        description: 'Attempt multiple portals today.',
        chapter: null,
        order_in_chapter: null,
        prerequisite_quest_id: null,
        objectives: JSON.stringify([
          { type: 'portal_attempts', target: 5, description: 'Attempt 5 portals' }
        ]),
        rewards: JSON.stringify({ gold: 2500, experience: 1000 }),
        is_active: false,
        required_level: 1,
        required_mastery_tier: null,
        created_at: now,
        updated_at: now,
      },
      {
        quest_type: 'daily',
        quest_category: 'daily_challenge',
        title: 'Gold Rush',
        description: 'Collect gold from portal victories.',
        chapter: null,
        order_in_chapter: null,
        prerequisite_quest_id: null,
        objectives: JSON.stringify([
          { type: 'gold_collected', target: 10000, description: 'Collect 10,000 gold' }
        ]),
        rewards: JSON.stringify({ gold: 3000, experience: 1000 }),
        is_active: false,
        required_level: 1,
        required_mastery_tier: null,
        created_at: now,
        updated_at: now,
      },
      {
        quest_type: 'daily',
        quest_category: 'daily_challenge',
        title: 'Army Deployment',
        description: 'Send your armies into battle.',
        chapter: null,
        order_in_chapter: null,
        prerequisite_quest_id: null,
        objectives: JSON.stringify([
          { type: 'units_sent', target: 500, description: 'Send 500 units to battle' }
        ]),
        rewards: JSON.stringify({ gold: 2500, experience: 900 }),
        is_active: false,
        required_level: 1,
        required_mastery_tier: null,
        created_at: now,
        updated_at: now,
      },
      {
        quest_type: 'daily',
        quest_category: 'daily_challenge',
        title: 'Tactical Master',
        description: 'Use advanced tactics to win battles.',
        chapter: null,
        order_in_chapter: null,
        prerequisite_quest_id: null,
        objectives: JSON.stringify([
          { type: 'tactic_victories', target: 2, description: 'Win 2 battles using tactics' }
        ]),
        rewards: JSON.stringify({ gold: 3500, experience: 1300 }),
        is_active: false,
        required_level: 3,
        required_mastery_tier: null,
        created_at: now,
        updated_at: now,
      },
      {
        quest_type: 'daily',
        quest_category: 'daily_challenge',
        title: 'Heavy Hitter',
        description: 'Deal extreme damage in a single day.',
        chapter: null,
        order_in_chapter: null,
        prerequisite_quest_id: null,
        objectives: JSON.stringify([
          { type: 'damage_dealt', target: 100000, description: 'Deal 100,000 damage' }
        ]),
        rewards: JSON.stringify({ gold: 5000, experience: 2000 }),
        is_active: false,
        required_level: 5,
        required_mastery_tier: null,
        created_at: now,
        updated_at: now,
      },
      {
        quest_type: 'daily',
        quest_category: 'daily_challenge',
        title: 'Victory Streak',
        description: 'Win multiple portal battles in a row.',
        chapter: null,
        order_in_chapter: null,
        prerequisite_quest_id: null,
        objectives: JSON.stringify([
          { type: 'portal_victories', target: 5, description: 'Win 5 portal battles' }
        ]),
        rewards: JSON.stringify({ gold: 4000, experience: 1600 }),
        is_active: false,
        required_level: 1,
        required_mastery_tier: null,
        created_at: now,
        updated_at: now,
      },
    ];

    await queryInterface.bulkInsert('portal_quests', dailyQuests);
    console.log('✅ Daily quest pool seeded: 10 quests');

    // ============================================
    // WEEKLY QUESTS
    // ============================================
    const weeklyQuests = [
      {
        quest_type: 'weekly',
        quest_category: 'weekly_challenge',
        title: 'Weekly Portal Domination',
        description: 'Conquer many portals this week.',
        chapter: null,
        order_in_chapter: null,
        prerequisite_quest_id: null,
        objectives: JSON.stringify([
          { type: 'portal_victories', target: 20, description: 'Win 20 portal battles' }
        ]),
        rewards: JSON.stringify({ gold: 15000, experience: 5000 }),
        is_active: false,
        required_level: 1,
        required_mastery_tier: null,
        created_at: now,
        updated_at: now,
      },
      {
        quest_type: 'weekly',
        quest_category: 'weekly_challenge',
        title: 'Boss Slayer Weekly',
        description: 'Defeat multiple bosses this week.',
        chapter: null,
        order_in_chapter: null,
        prerequisite_quest_id: null,
        objectives: JSON.stringify([
          { type: 'boss_defeats', target: 5, description: 'Defeat 5 bosses' }
        ]),
        rewards: JSON.stringify({ gold: 25000, experience: 10000 }),
        is_active: false,
        required_level: 5,
        required_mastery_tier: null,
        created_at: now,
        updated_at: now,
      },
      {
        quest_type: 'weekly',
        quest_category: 'weekly_challenge',
        title: 'Destruction Master',
        description: 'Deal massive damage this week.',
        chapter: null,
        order_in_chapter: null,
        prerequisite_quest_id: null,
        objectives: JSON.stringify([
          { type: 'damage_dealt', target: 500000, description: 'Deal 500,000 total damage' }
        ]),
        rewards: JSON.stringify({ gold: 20000, experience: 8000 }),
        is_active: false,
        required_level: 1,
        required_mastery_tier: null,
        created_at: now,
        updated_at: now,
      },
      {
        quest_type: 'weekly',
        quest_category: 'weekly_challenge',
        title: 'Tactical Genius',
        description: 'Achieve perfect victories this week.',
        chapter: null,
        order_in_chapter: null,
        prerequisite_quest_id: null,
        objectives: JSON.stringify([
          { type: 'perfect_victories', target: 5, description: 'Win 5 perfect victories' }
        ]),
        rewards: JSON.stringify({ gold: 30000, experience: 12000 }),
        is_active: false,
        required_level: 5,
        required_mastery_tier: null,
        created_at: now,
        updated_at: now,
      },
      {
        quest_type: 'weekly',
        quest_category: 'weekly_challenge',
        title: 'Weekly Gold Hoarder',
        description: 'Amass wealth from portal conquests.',
        chapter: null,
        order_in_chapter: null,
        prerequisite_quest_id: null,
        objectives: JSON.stringify([
          { type: 'gold_collected', target: 100000, description: 'Collect 100,000 gold' }
        ]),
        rewards: JSON.stringify({ gold: 50000, experience: 15000 }),
        is_active: false,
        required_level: 1,
        required_mastery_tier: null,
        created_at: now,
        updated_at: now,
      },
    ];

    await queryInterface.bulkInsert('portal_quests', weeklyQuests);
    console.log('✅ Weekly quest pool seeded: 5 quests');
    console.log('✅ Portal Quest System fully seeded: 30 total quests (15 story + 10 daily + 5 weekly)');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('portal_quests', null, {});
    console.log('✅ Portal quests removed');
  },
};
