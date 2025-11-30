const sequelize = require('./db');
const { QueryInterface, Sequelize } = require('sequelize');

const queryInterface = sequelize.getQueryInterface();

async function createBattlesTable() {
  try {
    console.log('Creating alliance_war_battles table...');
    
    await queryInterface.createTable('alliance_war_battles', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      war_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'alliance_wars',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      battle_report_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Link to individual combat battle report (if exists)'
      },
      attacker_user_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      defender_user_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      outcome: {
        type: Sequelize.ENUM('attacker_victory', 'defender_victory', 'draw'),
        allowNull: false
      },
      points_awarded: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'War points awarded to winner'
      },
      resources_pillaged: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {}
      },
      territory_captured: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Territory ID if territory changed hands'
      },
      occurred_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    console.log('✅ Table alliance_war_battles created');

    // Index for war battles
    await queryInterface.addIndex('alliance_war_battles', ['war_id', 'occurred_at'], {
      name: 'idx_war_battles_war_date'
    });

    console.log('✅ Index idx_war_battles_war_date created');

    // Mark migration as executed
    await sequelize.query(
      "INSERT INTO \"SequelizeMeta\" (name) VALUES ('20251130000005-create-alliance-wars.js')"
    );

    console.log('✅ Migration marked as executed in SequelizeMeta');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

createBattlesTable();
