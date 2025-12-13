/**
 * Migration: Création de la table user_messages pour la boîte aux lettres
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_messages', {
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
      type: {
        type: Sequelize.ENUM(
          'attack_incoming',
          'attack_launched', 
          'attack_result',
          'defense_report',
          'spy_report',
          'spy_detected',
          'trade_arrival',
          'trade_cancelled',
          'colonization_complete',
          'alliance_invite',
          'alliance_message',
          'admin_message',
          'system_message',
          'resource_full',
          'construction_complete',
          'research_complete'
        ),
        allowNull: false
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      data: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Données structurées associées au message (ex: détails attaque, rapport espionnage)'
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      priority: {
        type: Sequelize.ENUM('low', 'normal', 'high', 'urgent'),
        allowNull: false,
        defaultValue: 'normal'
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Date d\'expiration du message (null = ne pas expirer)'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      read_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Index pour performances
    await queryInterface.addIndex('user_messages', ['user_id', 'is_read']);
    await queryInterface.addIndex('user_messages', ['user_id', 'created_at']);
    await queryInterface.addIndex('user_messages', ['type']);
    await queryInterface.addIndex('user_messages', ['expires_at']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('user_messages');
  }
};
