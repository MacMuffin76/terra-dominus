'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Table pour stocker les ressources T2 des joueurs
    await queryInterface.createTable('user_resources_t2', {
      user_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      titanium: {
        type: Sequelize.BIGINT,
        allowNull: false,
        defaultValue: 0,
        comment: 'Titanium quantity'
      },
      plasma: {
        type: Sequelize.BIGINT,
        allowNull: false,
        defaultValue: 0,
        comment: 'Plasma energy quantity'
      },
      nanotubes: {
        type: Sequelize.BIGINT,
        allowNull: false,
        defaultValue: 0,
        comment: 'Carbon nanotubes quantity'
      },
      titanium_storage_max: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Maximum titanium storage capacity'
      },
      plasma_storage_max: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Maximum plasma storage capacity'
      },
      nanotubes_storage_max: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Maximum nanotubes storage capacity'
      },
      last_production_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Last time passive production was calculated'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Index pour requêtes fréquentes
    await queryInterface.addIndex('user_resources_t2', ['user_id'], {
      name: 'idx_user_resources_t2_user'
    });

    // Table pour les conversions de ressources en cours
    await queryInterface.createTable('resource_conversions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      resource_type: {
        type: Sequelize.ENUM('titanium', 'plasma', 'nanotubes'),
        allowNull: false,
        comment: 'Type of T2 resource being produced'
      },
      quantity_target: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Amount of T2 resource to produce'
      },
      input_cost: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
        comment: 'T1 resources consumed for this conversion'
      },
      building_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Building performing the conversion (optional)'
      },
      started_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When conversion will be complete'
      },
      status: {
        type: Sequelize.ENUM('queued', 'in_progress', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'in_progress',
        comment: 'Current status of the conversion'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Indexes pour optimiser les requêtes
    await queryInterface.addIndex('resource_conversions', ['user_id', 'status'], {
      name: 'idx_conversions_user_status'
    });

    await queryInterface.addIndex('resource_conversions', ['status', 'completed_at'], {
      name: 'idx_conversions_completion'
    });

    // Table pour configurer les recettes de conversion
    await queryInterface.createTable('resource_conversion_recipes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      resource_type: {
        type: Sequelize.ENUM('titanium', 'plasma', 'nanotubes'),
        allowNull: false,
        unique: true,
        comment: 'Output T2 resource type'
      },
      input_resources: {
        type: Sequelize.JSONB,
        allowNull: false,
        comment: 'Required T1 resources, e.g., { metal: 10000, carburant: 2000 }'
      },
      output_quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Amount of T2 resource produced'
      },
      duration_seconds: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Time required for conversion'
      },
      building_required: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Building type required, e.g., mine_metal'
      },
      building_level_min: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Minimum building level required'
      },
      research_required: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Research technology required'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Whether this recipe is currently available'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Index pour recherches de recettes
    await queryInterface.addIndex('resource_conversion_recipes', ['resource_type'], {
      name: 'idx_recipes_resource_type'
    });

    // Seed des recettes de base
    await queryInterface.bulkInsert('resource_conversion_recipes', [
      {
        resource_type: 'titanium',
        input_resources: JSON.stringify({ metal: 10000, carburant: 2000 }),
        output_quantity: 5,
        duration_seconds: 3600, // 1 heure
        building_required: 'mine_metal',
        building_level_min: 10,
        research_required: 'extraction_avancee',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        resource_type: 'plasma',
        input_resources: JSON.stringify({ energie: 50000, metal: 5000 }),
        output_quantity: 3,
        duration_seconds: 7200, // 2 heures
        building_required: 'centrale_energie',
        building_level_min: 15,
        research_required: 'reacteur_fusion',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        resource_type: 'nanotubes',
        input_resources: JSON.stringify({ metal: 8000, energie: 20000, carburant: 5000 }),
        output_quantity: 2,
        duration_seconds: 10800, // 3 heures
        building_required: 'labo_recherche',
        building_level_min: 15,
        research_required: 'nanotechnologie',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('resource_conversion_recipes');
    await queryInterface.dropTable('resource_conversions');
    await queryInterface.dropTable('user_resources_t2');
    
    // Drop ENUMs
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_resource_conversions_resource_type";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_resource_conversions_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_resource_conversion_recipes_resource_type";');
  }
};
