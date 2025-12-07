const FacilityUnlockService = require('./backend/modules/facilities/application/FacilityUnlockService');
const { User, Facility, City } = require('./backend/models');
const sequelize = require('./backend/db');

/**
 * Script de test pour le système de déverrouillage des installations
 * Usage: node test_facility_unlock.js [userId]
 */

async function testFacilityUnlock(userId = 4) {
  try {
    console.log('\n🔓 TEST SYSTÈME DE DÉVERROUILLAGE DES INSTALLATIONS\n');
    console.log('='.repeat(60));

    const facilityUnlockService = new FacilityUnlockService({
      User,
      Facility,
      City,
      sequelize
    });

    // 1. Récupérer le niveau du Centre de Commandement
    console.log('\n📊 1. NIVEAU DU CENTRE DE COMMANDEMENT');
    console.log('-'.repeat(60));
    const ccLevel = await facilityUnlockService.getCommandCenterLevel(userId);
    console.log(`✅ Centre de Commandement: Niveau ${ccLevel}`);

    // 2. Vérifier toutes les installations disponibles
    console.log('\n🏢 2. INSTALLATIONS DISPONIBLES');
    console.log('-'.repeat(60));
    const availableData = await facilityUnlockService.getAvailableFacilities(userId);
    
    console.log(`\nCentre de Commandement: Niveau ${availableData.commandCenterLevel}`);
    console.log(`Total installations: ${availableData.facilities.length}\n`);

    availableData.facilities.forEach(facility => {
      const status = facility.isLocked ? '🔒 VERROUILLÉ' : '✅ DISPONIBLE';
      const levelInfo = `Niv ${facility.currentLevel}/${facility.maxLevel}`;
      
      console.log(`${status} ${facility.name} (${levelInfo})`);
      
      if (facility.isLocked) {
        console.log(`   └─ ${facility.lockReason}`);
      } else if (!facility.canUpgrade && facility.currentLevel < facility.maxLevel) {
        console.log(`   └─ Upgrade bloqué: CC niveau ${facility.requiredCommandCenterLevel} requis`);
      }
    });

    // 3. Vérifier les installations verrouillées
    console.log('\n🔐 3. INSTALLATIONS VERROUILLÉES');
    console.log('-'.repeat(60));
    const locked = availableData.facilities.filter(f => f.isLocked);
    
    if (locked.length === 0) {
      console.log('✨ Aucune installation verrouillée !');
    } else {
      locked.forEach(facility => {
        console.log(`🔒 ${facility.name}`);
        console.log(`   └─ Requis: CC niveau ${facility.requiredCommandCenterLevel}`);
      });
    }

    // 4. Résumé de progression
    console.log('\n📈 4. RÉSUMÉ DE PROGRESSION');
    console.log('-'.repeat(60));
    const progress = await facilityUnlockService.getUnlockProgressSummary(userId);
    
    console.log(`Total installations: ${progress.totalFacilities}`);
    console.log(`Débloquées: ${progress.unlocked} ✅`);
    console.log(`Upgrades bloqués: ${progress.upgradeLocked} 🔐`);
    console.log(`Verrouillées: ${progress.locked} 🔒`);
    
    if (progress.nextUnlock) {
      console.log(`\n🎯 Prochain déverrouillage:`);
      console.log(`   ${progress.nextUnlock.name}`);
      console.log(`   Requis: CC niveau ${progress.nextUnlock.requiredCommandCenterLevel}`);
    }

    // 5. Test de vérification spécifique
    console.log('\n🧪 5. TESTS DE VÉRIFICATION SPÉCIFIQUES');
    console.log('-'.repeat(60));

    const testsToRun = [
      { key: 'TRAINING_CENTER', level: 5 },
      { key: 'RESEARCH_LAB', level: 1 },
      { key: 'FORGE', level: 1 },
      { key: 'COMMAND_CENTER', level: 10 }
    ];

    for (const test of testsToRun) {
      const check = await facilityUnlockService.checkFacilityUnlock(
        userId,
        test.key,
        test.level
      );

      const statusIcon = check.canBuild ? '✅' : '❌';
      console.log(`${statusIcon} ${test.key} niveau ${test.level}`);
      console.log(`   └─ ${check.reason}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Tests terminés avec succès !\n');

  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Exécution
const userId = process.argv[2] ? parseInt(process.argv[2]) : 4;
testFacilityUnlock(userId);
