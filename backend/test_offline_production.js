/**
 * Script de test pour vérifier le calcul de production offline
 * 
 * Usage:
 * 1. Se connecter avec un utilisateur
 * 2. Noter les ressources actuelles
 * 3. Se déconnecter
 * 4. Attendre quelques secondes
 * 5. Se reconnecter
 * 6. Vérifier que les ressources ont augmenté
 */

require('dotenv').config();
const { User, Resource, City } = require('./models');
const userService = require('./services/userService');

async function testOfflineProduction() {
  try {
    console.log('\n=== Test de production offline ===\n');

    // 1. Trouver un utilisateur de test
    const testUsername = process.argv[2] || 'testuser';
    const testPassword = process.argv[3] || 'password';

    console.log(`1. Recherche de l'utilisateur: ${testUsername}`);
    const user = await User.findOne({ where: { username: testUsername } });
    
    if (!user) {
      console.error(`❌ Utilisateur "${testUsername}" non trouvé`);
      console.log('Usage: node test_offline_production.js <username> <password>');
      process.exit(1);
    }

    // 2. Récupérer la ville et les ressources
    const city = await City.findOne({ where: { user_id: user.id, is_capital: true } });
    if (!city) {
      console.error('❌ Aucune ville trouvée pour cet utilisateur');
      process.exit(1);
    }

    const resourcesBefore = await Resource.findAll({ where: { city_id: city.id } });
    console.log('\n2. Ressources AVANT simulation de déconnexion:');
    resourcesBefore.forEach(r => {
      console.log(`   - ${r.type}: ${r.amount} (last_update: ${r.last_update})`);
    });

    // 3. Simuler une déconnexion (mettre à jour last_logout)
    const logoutTime = new Date();
    user.last_logout = logoutTime;
    await user.save();
    console.log(`\n3. Déconnexion simulée à: ${logoutTime.toISOString()}`);

    // 4. Attendre quelques secondes
    const waitSeconds = 5;
    console.log(`\n4. Attente de ${waitSeconds} secondes...`);
    await new Promise(resolve => setTimeout(resolve, waitSeconds * 1000));

    // 5. Simuler une reconnexion (appeler loginUser)
    console.log('\n5. Reconnexion...');
    const loginResult = await userService.loginUser({ 
      username: testUsername, 
      password: testPassword 
    });

    if (!loginResult.token) {
      console.error('❌ Échec de la connexion');
      process.exit(1);
    }

    console.log('   ✅ Connexion réussie');

    // 6. Vérifier les ressources après
    const resourcesAfter = await Resource.findAll({ where: { city_id: city.id } });
    console.log('\n6. Ressources APRÈS reconnexion:');
    
    let hasProduced = false;
    resourcesAfter.forEach(r => {
      const before = resourcesBefore.find(rb => rb.type === r.type);
      const diff = r.amount - (before?.amount || 0);
      console.log(`   - ${r.type}: ${r.amount} (${diff >= 0 ? '+' : ''}${diff}) [last_update: ${r.last_update}]`);
      if (diff > 0) hasProduced = true;
    });

    console.log('\n=== Résultat du test ===');
    if (hasProduced) {
      console.log('✅ SUCCÈS: Les ressources ont été produites pendant la phase offline');
    } else {
      console.log('❌ ÉCHEC: Aucune production offline détectée');
    }

    process.exit(hasProduced ? 0 : 1);

  } catch (error) {
    console.error('\n❌ Erreur lors du test:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Exécuter le test
testOfflineProduction();
