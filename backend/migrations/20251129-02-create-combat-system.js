'use strict';

/**
 * Migration: Système de combat territorial
 * 
 * Tables créées :
 * 1. attacks - Attaques entre villes
 * 2. attack_waves - Vagues d'unités envoyées
 * 3. defense_reports - Rapports de défense détaillés
 * 4. spy_missions - Missions d'espionnage
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    // Table: attacks - Attaques planifiées/en cours
    await queryInterface.createTable('attacks', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      attacker_user_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      attacker_city_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      defender_user_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      defender_city_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      attack_type: {
        type: Sequelize.ENUM('raid', 'conquest', 'siege'),
        allowNull: false,
        defaultValue: 'raid',
        comment: 'raid=pillage rapide, conquest=conquête totale, siege=siège prolongé'
      },
      status: {
        type: Sequelize.ENUM('traveling', 'arrived', 'completed', 'failed', 'cancelled'),
        allowNull: false,
        defaultValue: 'traveling'
      },
      departure_time: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      arrival_time: {
        type: Sequelize.DATE,
        allowNull: false
      },
      distance: {
        type: Sequelize.FLOAT,
        allowNull: false,
        comment: 'Distance en tiles'
      },
      outcome: {
        type: Sequelize.ENUM('attacker_victory', 'defender_victory', 'draw'),
        allowNull: true,
        comment: 'Résultat du combat (rempli après bataille)'
      },
      // Butin pillé
      loot_gold: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      loot_metal: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      loot_fuel: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      // Pertes
      attacker_losses: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'JSON { unit_type_id: quantity_lost }'
      },
      defender_losses: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'JSON { unit_type_id: quantity_lost }'
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

    await queryInterface.addIndex('attacks', ['attacker_user_id', 'status']);
    await queryInterface.addIndex('attacks', ['defender_user_id', 'status']);
    await queryInterface.addIndex('attacks', ['arrival_time']);
    await queryInterface.addIndex('attacks', ['status']);

    // Table: attack_waves - Composition des vagues d'attaque
    await queryInterface.createTable('attack_waves', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      attack_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'attacks',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      unit_entity_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 1
        }
      },
      survivors: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Nombre de survivants après combat'
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

    await queryInterface.addIndex('attack_waves', ['attack_id']);
    await queryInterface.addIndex('attack_waves', ['unit_entity_id']);

    // Table: defense_reports - Rapports de défense
    await queryInterface.createTable('defense_reports', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      attack_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      combat_rounds: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: 'Nombre de rounds de combat'
      },
      combat_log: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Log détaillé des rounds de combat'
      },
      initial_attacker_strength: {
        type: Sequelize.FLOAT,
        allowNull: false,
        comment: 'Force initiale attaquant'
      },
      initial_defender_strength: {
        type: Sequelize.FLOAT,
        allowNull: false,
        comment: 'Force initiale défenseur'
      },
      final_attacker_strength: {
        type: Sequelize.FLOAT,
        allowNull: false,
        comment: 'Force finale attaquant'
      },
      final_defender_strength: {
        type: Sequelize.FLOAT,
        allowNull: false,
        comment: 'Force finale défenseur'
      },
      defender_walls_bonus: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
        comment: 'Bonus défensif des murailles'
      },
      attacker_tech_bonus: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
        comment: 'Bonus technologiques attaquant'
      },
      defender_tech_bonus: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
        comment: 'Bonus technologiques défenseur'
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

    await queryInterface.addIndex('defense_reports', ['attack_id'], { unique: true });

    // Table: spy_missions - Missions d'espionnage
    await queryInterface.createTable('spy_missions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      spy_user_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      spy_city_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      target_user_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      target_city_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      spy_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 1
        },
        comment: 'Nombre d\'espions envoyés'
      },
      mission_type: {
        type: Sequelize.ENUM('reconnaissance', 'military_intel', 'sabotage'),
        allowNull: false,
        defaultValue: 'reconnaissance',
        comment: 'reconnaissance=infos basiques, military_intel=détails militaires, sabotage=destruction'
      },
      status: {
        type: Sequelize.ENUM('traveling', 'completed', 'failed', 'detected', 'cancelled'),
        allowNull: false,
        defaultValue: 'traveling'
      },
      departure_time: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      arrival_time: {
        type: Sequelize.DATE,
        allowNull: false
      },
      distance: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      // Résultats espionnage
      success_rate: {
        type: Sequelize.FLOAT,
        allowNull: true,
        comment: 'Taux de succès 0-1'
      },
      intel_data: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Données récoltées (ressources, unités, défenses, etc.)'
      },
      spies_lost: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Espions capturés/tués'
      },
      detected: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Mission détectée par la cible'
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

    await queryInterface.addIndex('spy_missions', ['spy_user_id', 'status']);
    await queryInterface.addIndex('spy_missions', ['target_user_id', 'detected']);
    await queryInterface.addIndex('spy_missions', ['arrival_time']);
    await queryInterface.addIndex('spy_missions', ['status']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('spy_missions');
    await queryInterface.dropTable('defense_reports');
    await queryInterface.dropTable('attack_waves');
    await queryInterface.dropTable('attacks');
  }
};
