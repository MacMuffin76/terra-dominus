/**
 * Test d'intégration - Alliance War System
 * Teste la déclaration de guerre, les batailles et les cessez-le-feu
 */

const { AllianceWar, AllianceWarBattle, Alliance, AllianceMember, User, sequelize } = require('./models');

async function testAllianceWarSystem() {
  console.log('\n🔥 Testing Alliance War System 🔥\n');

  try {
    // Préparation : Trouver ou créer deux alliances et leurs leaders
    let alliance1 = await Alliance.findOne({
      where: { name: 'War Alliance 1' },
    });

    let alliance2 = await Alliance.findOne({
      where: { name: 'War Alliance 2' },
    });

    // Trouver des utilisateurs pour les tests
    const users = await User.findAll({ limit: 4 });

    if (users.length < 4) {
      throw new Error('Need at least 4 users in database to run war tests');
    }

    const [user1, user2, user3, user4] = users;

    // Créer les alliances si elles n'existent pas
    if (!alliance1) {
      alliance1 = await Alliance.create({
        name: 'War Alliance 1',
        tag: 'WAR1',
        description: 'Test alliance for wars',
        leaderId: user1.id,
        memberCount: 2,
      });

      await AllianceMember.create({
        userId: user1.id,
        allianceId: alliance1.id,
        role: 'leader',
        contribution: 0,
      });

      await AllianceMember.create({
        userId: user2.id,
        allianceId: alliance1.id,
        role: 'officer',
        contribution: 0,
      });
    }

    if (!alliance2) {
      alliance2 = await Alliance.create({
        name: 'War Alliance 2',
        tag: 'WAR2',
        description: 'Test alliance for wars',
        leaderId: user2.id,
        memberCount: 1,
      });

      await AllianceMember.create({
        userId: user3.id,
        allianceId: alliance2.id,
        role: 'leader',
        contribution: 0,
      });

      await AllianceMember.create({
        userId: user4.id,
        allianceId: alliance2.id,
        role: 'officer',
        contribution: 0,
      });
    }

    console.log('✅ Test alliances prepared');
    console.log(`   Alliance 1: ${alliance1.name} [${alliance1.tag}] - ID ${alliance1.id}`);
    console.log(`   Alliance 2: ${alliance2.name} [${alliance2.tag}] - ID ${alliance2.id}`);
    console.log(`   Leader 1: ${user1.pseudo} (ID ${user1.id})`);
    console.log(`   Leader 2: ${user3.pseudo} (ID ${user3.id})\n`);

    // Test 1: Déclarer la guerre
    console.log('📝 Test 1: Declare war');
    const war = await AllianceWar.create({
      attackerAllianceId: alliance1.id,
      defenderAllianceId: alliance2.id,
      declaredBy: user1.id,
      warGoal: 'Territorial Expansion',
      status: 'active',
      attackerScore: 0,
      defenderScore: 0,
      startedAt: new Date(),
    });

    console.log('✅ War declared successfully');
    console.log(`   War ID: ${war.id}`);
    console.log(`   Attacker: ${alliance1.name} [${alliance1.tag}]`);
    console.log(`   Defender: ${alliance2.name} [${alliance2.tag}]`);
    console.log(`   War Goal: ${war.warGoal}`);
    console.log(`   Status: ${war.status}\n`);

    // Test 2: Enregistrer une bataille (attacker victory)
    console.log('📝 Test 2: Record battle (Attacker victory)');
    const battle1 = await AllianceWarBattle.create({
      warId: war.id,
      attackerUserId: user1.id,
      defenderUserId: user3.id,
      outcome: 'attacker_victory',
      pointsAwarded: 25,
      resourcesPillaged: {
        or: 10000,
        metal: 5000,
        carburant: 3000,
      },
      territoryCaptured: null,
      occurredAt: new Date(),
    });

    // Mettre à jour le score
    war.attackerScore += battle1.pointsAwarded;
    await war.save();

    console.log('✅ Battle recorded successfully');
    console.log(`   Battle ID: ${battle1.id}`);
    console.log(`   Attacker: ${user1.pseudo}`);
    console.log(`   Defender: ${user3.pseudo}`);
    console.log(`   Outcome: ${battle1.outcome}`);
    console.log(`   Points: ${battle1.pointsAwarded}`);
    console.log(`   Resources pillaged: ${JSON.stringify(battle1.resourcesPillaged)}`);
    console.log(`   Updated war score: ${war.attackerScore} - ${war.defenderScore}\n`);

    // Test 3: Enregistrer une autre bataille (defender victory)
    console.log('📝 Test 3: Record battle (Defender victory)');
    const battle2 = await AllianceWarBattle.create({
      warId: war.id,
      attackerUserId: user2.id,
      defenderUserId: user4.id,
      outcome: 'defender_victory',
      pointsAwarded: 10,
      resourcesPillaged: {
        or: 5000,
        metal: 2000,
      },
      occurredAt: new Date(),
    });

    war.defenderScore += battle2.pointsAwarded;
    await war.save();

    console.log('✅ Battle recorded successfully');
    console.log(`   Battle ID: ${battle2.id}`);
    console.log(`   Attacker: ${user2.pseudo}`);
    console.log(`   Defender: ${user4.pseudo}`);
    console.log(`   Outcome: ${battle2.outcome}`);
    console.log(`   Points: ${battle2.pointsAwarded}`);
    console.log(`   Updated war score: ${war.attackerScore} - ${war.defenderScore}\n`);

    // Test 4: Ajouter des casualties
    console.log('📝 Test 4: Add casualties to war');
    war.attackerCasualties = {
      Infantry: 50,
      Tank: 10,
    };
    war.defenderCasualties = {
      Infantry: 80,
      Tank: 5,
      Artillery: 3,
    };
    await war.save();

    console.log('✅ Casualties recorded');
    console.log(`   Attacker casualties: ${JSON.stringify(war.attackerCasualties)}`);
    console.log(`   Defender casualties: ${JSON.stringify(war.defenderCasualties)}\n`);

    // Test 5: Proposer un cessez-le-feu
    console.log('📝 Test 5: Propose ceasefire');
    war.warTerms = {
      ceasefireProposal: {
        proposedBy: alliance1.id,
        proposedAt: new Date(),
        terms: {
          duration: 48,
          conditions: 'No further attacks for 48 hours',
        },
        status: 'pending',
      },
    };
    await war.save();

    console.log('✅ Ceasefire proposed');
    console.log(`   Proposed by: ${alliance1.name}`);
    console.log(`   Terms: ${JSON.stringify(war.warTerms.ceasefireProposal.terms)}`);
    console.log(`   Status: ${war.warTerms.ceasefireProposal.status}\n`);

    // Test 6: Accepter le cessez-le-feu
    console.log('📝 Test 6: Accept ceasefire');
    war.warTerms.ceasefireProposal.status = 'accepted';
    war.warTerms.ceasefireProposal.respondedAt = new Date();
    war.status = 'ceasefire';
    await war.save();

    console.log('✅ Ceasefire accepted');
    console.log(`   War status: ${war.status}`);
    console.log(`   Ceasefire status: ${war.warTerms.ceasefireProposal.status}\n`);

    // Test 7: Reprendre la guerre
    console.log('📝 Test 7: Resume war after ceasefire');
    war.status = 'active';
    await war.save();

    console.log('✅ War resumed');
    console.log(`   War status: ${war.status}\n`);

    // Test 8: Terminer la guerre
    console.log('📝 Test 8: End war');
    const winnerAllianceId = war.attackerScore > war.defenderScore ? alliance1.id : alliance2.id;
    war.status = 'ended';
    war.endedAt = new Date();
    war.winnerAllianceId = winnerAllianceId;
    war.warTerms = {
      ...war.warTerms,
      finalTerms: {
        winner: winnerAllianceId === alliance1.id ? alliance1.name : alliance2.name,
        reparations: {
          or: 50000,
          metal: 25000,
        },
        territoryCeded: [],
      },
    };
    await war.save();

    const winner = winnerAllianceId === alliance1.id ? alliance1 : alliance2;
    console.log('✅ War ended');
    console.log(`   Winner: ${winner.name} [${winner.tag}]`);
    console.log(`   Final Score: ${war.attackerScore} - ${war.defenderScore}`);
    console.log(`   Duration: ${Math.floor((new Date(war.endedAt) - new Date(war.startedAt)) / 1000)} seconds`);
    console.log(`   Status: ${war.status}\n`);

    // Test 9: Récupérer les statistiques de guerre
    console.log('📝 Test 9: Get war statistics');
    const battles = await AllianceWarBattle.findAll({ where: { warId: war.id } });
    const attackerVictories = battles.filter((b) => b.outcome === 'attacker_victory').length;
    const defenderVictories = battles.filter((b) => b.outcome === 'defender_victory').length;

    console.log('✅ War statistics');
    console.log(`   Total battles: ${battles.length}`);
    console.log(`   Attacker victories: ${attackerVictories}`);
    console.log(`   Defender victories: ${defenderVictories}`);
    console.log(`   Attacker score: ${war.attackerScore}`);
    console.log(`   Defender score: ${war.defenderScore}`);
    console.log(`   Winner: ${winner.name}\n`);

    // Test 10: Récupérer toutes les guerres d'une alliance
    console.log('📝 Test 10: Get all wars for alliance 1');
    const alliance1Wars = await AllianceWar.findAll({
      where: {
        [sequelize.Sequelize.Op.or]: [
          { attackerAllianceId: alliance1.id },
          { defenderAllianceId: alliance1.id },
        ],
      },
      include: [
        {
          model: Alliance,
          as: 'attackerAlliance',
          attributes: ['id', 'name', 'tag'],
        },
        {
          model: Alliance,
          as: 'defenderAlliance',
          attributes: ['id', 'name', 'tag'],
        },
      ],
      order: [['started_at', 'DESC']],
    });

    console.log('✅ Alliance wars retrieved');
    console.log(`   ${alliance1.name} has ${alliance1Wars.length} wars in history`);
    alliance1Wars.forEach((w) => {
      console.log(`   - War ${w.id}: ${w.attackerAlliance.name} vs ${w.defenderAlliance.name} (${w.status})`);
    });

    console.log('\n🎉 All tests passed successfully! 🎉\n');
    console.log('Summary:');
    console.log(`✅ War declared between ${alliance1.name} and ${alliance2.name}`);
    console.log(`✅ ${battles.length} battles recorded`);
    console.log(`✅ Ceasefire proposed and accepted`);
    console.log(`✅ War resumed and ended with ${winner.name} as winner`);
    console.log(`✅ Final score: ${war.attackerScore} - ${war.defenderScore}`);
    console.log(`✅ Total casualties: ${Object.values(war.attackerCasualties || {}).reduce((a, b) => a + b, 0) + Object.values(war.defenderCasualties || {}).reduce((a, b) => a + b, 0)} units`);
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Exécuter les tests
testAllianceWarSystem()
  .then(() => {
    console.log('\n✅ Test suite completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  });

