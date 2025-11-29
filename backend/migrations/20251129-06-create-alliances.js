'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Table alliances
    await queryInterface.createTable('alliances', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      tag: {
        type: Sequelize.STRING(10),
        allowNull: false,
        unique: true,
        comment: 'Abr\u00e9viation de l\'alliance (3-10 caract\u00e8res)'
      },
      leader_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      is_recruiting: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        comment: 'Alliance accepte de nouveaux membres'
      },
      min_level_required: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        comment: 'Niveau minimum requis pour rejoindre'
      },
      member_count: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        comment: 'Nombre de membres (d\u00e9normalis\u00e9 pour perfs)'
      },
      total_power: {
        type: Sequelize.BIGINT,
        defaultValue: 0,
        comment: 'Puissance totale de l\'alliance'
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

    // Table alliance_members (relation users <-> alliances)
    await queryInterface.createTable('alliance_members', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      alliance_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'alliances',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
      role: {
        type: Sequelize.ENUM('leader', 'officer', 'member'),
        defaultValue: 'member',
        allowNull: false
      },
      joined_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      contribution: {
        type: Sequelize.BIGINT,
        defaultValue: 0,
        comment: 'Contribution totale du membre (ressources, combat, etc.)'
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

    // Table alliance_invitations
    await queryInterface.createTable('alliance_invitations', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      alliance_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'alliances',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      inviter_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Membre qui envoie l\'invitation'
      },
      invitee_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Joueur invit\u00e9'
      },
      status: {
        type: Sequelize.ENUM('pending', 'accepted', 'declined', 'expired'),
        defaultValue: 'pending',
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Message d\'invitation personnalis\u00e9'
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'Date d\'expiration de l\'invitation (7 jours)'
      },
      responded_at: {
        type: Sequelize.DATE,
        allowNull: true
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

    // Table alliance_join_requests (demandes d'adhésion)
    await queryInterface.createTable('alliance_join_requests', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      alliance_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'alliances',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected', 'cancelled'),
        defaultValue: 'pending',
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Message de candidature'
      },
      reviewed_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      reviewed_at: {
        type: Sequelize.DATE,
        allowNull: true
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

    // Table alliance_diplomacy (relations entre alliances)
    await queryInterface.createTable('alliance_diplomacy', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      alliance_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'alliances',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      target_alliance_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'alliances',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      relation_type: {
        type: Sequelize.ENUM('neutral', 'ally', 'nap', 'war'),
        defaultValue: 'neutral',
        allowNull: false,
        comment: 'neutral=neutre, ally=alli\u00e9, nap=non-agression, war=guerre'
      },
      status: {
        type: Sequelize.ENUM('pending', 'active', 'rejected', 'cancelled'),
        defaultValue: 'pending',
        allowNull: false
      },
      proposed_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      accepted_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      starts_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Date de d\u00e9but du trait\u00e9'
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Date d\'expiration (optionnel)'
      },
      terms: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Termes du trait\u00e9 (tributs, restrictions, etc.)'
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

    // Indexes pour performances
    await queryInterface.addIndex('alliance_members', ['alliance_id']);
    await queryInterface.addIndex('alliance_members', ['user_id'], { unique: true });
    await queryInterface.addIndex('alliance_invitations', ['alliance_id', 'status']);
    await queryInterface.addIndex('alliance_invitations', ['invitee_id', 'status']);
    await queryInterface.addIndex('alliance_join_requests', ['alliance_id', 'status']);
    await queryInterface.addIndex('alliance_join_requests', ['user_id']);
    await queryInterface.addIndex('alliance_diplomacy', ['alliance_id', 'target_alliance_id'], { unique: true });
    await queryInterface.addIndex('alliances', ['total_power']);
    await queryInterface.addIndex('alliances', ['is_recruiting']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('alliance_diplomacy');
    await queryInterface.dropTable('alliance_join_requests');
    await queryInterface.dropTable('alliance_invitations');
    await queryInterface.dropTable('alliance_members');
    await queryInterface.dropTable('alliances');
  }
};
