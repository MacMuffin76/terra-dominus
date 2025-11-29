'use strict';

/**
 * Migration: Système de commerce inter-villes
 * 
 * Tables créées :
 * 1. trade_routes - Routes commerciales établies
 * 2. trade_convoys - Convois de marchandises en transit
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    // Table: trade_routes - Routes commerciales permanentes entre villes
    await queryInterface.createTable('trade_routes', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      owner_user_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      origin_city_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'cities',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      destination_city_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'cities',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      route_type: {
        type: Sequelize.ENUM('internal', 'external'),
        allowNull: false,
        defaultValue: 'internal',
        comment: 'internal=entre villes du même joueur, external=commerce avec autres joueurs'
      },
      status: {
        type: Sequelize.ENUM('active', 'suspended', 'broken'),
        allowNull: false,
        defaultValue: 'active'
      },
      distance: {
        type: Sequelize.FLOAT,
        allowNull: false,
        comment: 'Distance en tiles'
      },
      // Configuration transferts automatiques (routes internes)
      auto_transfer_gold: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Quantité d\'or transférée automatiquement par convoi'
      },
      auto_transfer_metal: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      auto_transfer_fuel: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      transfer_frequency: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 3600,
        comment: 'Fréquence transferts auto en secondes (default 1h)'
      },
      // Commerce externe (routes avec autres joueurs)
      trade_offer_gold: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Offre de vente pour routes externes'
      },
      trade_offer_metal: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      trade_offer_fuel: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      trade_request_gold: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Demande d\'achat pour routes externes'
      },
      trade_request_metal: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      trade_request_fuel: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      // Statistiques
      total_convoys: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Nombre total de convois envoyés'
      },
      total_gold_traded: {
        type: Sequelize.BIGINT,
        allowNull: false,
        defaultValue: 0
      },
      total_metal_traded: {
        type: Sequelize.BIGINT,
        allowNull: false,
        defaultValue: 0
      },
      total_fuel_traded: {
        type: Sequelize.BIGINT,
        allowNull: false,
        defaultValue: 0
      },
      last_convoy_time: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Date du dernier convoi'
      },
      established_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
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

    await queryInterface.addIndex('trade_routes', ['owner_user_id', 'status']);
    await queryInterface.addIndex('trade_routes', ['origin_city_id']);
    await queryInterface.addIndex('trade_routes', ['destination_city_id']);
    await queryInterface.addIndex('trade_routes', ['status']);
    await queryInterface.addIndex('trade_routes', ['route_type']);

    // Table: trade_convoys - Convois en transit
    await queryInterface.createTable('trade_convoys', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      trade_route_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      origin_city_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      destination_city_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('traveling', 'arrived', 'intercepted', 'cancelled'),
        allowNull: false,
        defaultValue: 'traveling'
      },
      // Marchandises transportées
      cargo_gold: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      cargo_metal: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      cargo_fuel: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      // Protection
      escort_units: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'JSON { unit_entity_id: quantity } - unités d\'escorte'
      },
      // Timing
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
      // Incidents
      intercepted_by_attack_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'attacks',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'ID de l\'attaque si le convoi est intercepté'
      },
      cargo_lost_gold: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Cargaison perdue en cas d\'interception'
      },
      cargo_lost_metal: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      cargo_lost_fuel: {
        type: Sequelize.INTEGER,
        allowNull: false,
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

    await queryInterface.addIndex('trade_convoys', ['trade_route_id']);
    await queryInterface.addIndex('trade_convoys', ['status']);
    await queryInterface.addIndex('trade_convoys', ['arrival_time']);
    await queryInterface.addIndex('trade_convoys', ['origin_city_id']);
    await queryInterface.addIndex('trade_convoys', ['destination_city_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('trade_convoys');
    await queryInterface.dropTable('trade_routes');
  }
};
