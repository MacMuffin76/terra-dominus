/**
 * Script de test du système de messagerie
 */

const container = require('./container')();

async function testMessageSystem() {
  const messageService = container.resolve('messageService');
  const userId = 95; // Votre user ID

  console.log('\n📬 === TEST SYSTEME DE MESSAGERIE ===\n');

  // 1. Créer différents types de messages
  console.log('1️⃣ Création de messages de test...');
  
  await messageService.createAttackIncomingMessage(userId, {
    attackerUsername: 'Ennemi',
    defenderCityName: 'Ma Capitale',
    arrivalTime: new Date(Date.now() + 3600000)
  });
  console.log('  ✅ Message attaque imminente créé');

  await messageService.createAttackResultMessage(userId, {
    outcome: 'attacker_victory',
    defenderCityName: 'Ville Ennemie',
    loot: { gold: 500, metal: 2000, fuel: 100 }
  });
  console.log('  ✅ Message résultat combat créé');

  await messageService.createSpyReportMessage(userId, {
    targetCityName: 'Ville espionnée',
    successRate: 85
  });
  console.log('  ✅ Message rapport espionnage créé');

  await messageService.createAdminMessage(
    userId,
    'Mise à jour du jeu',
    'Une nouvelle version est disponible avec de nouvelles fonctionnalités !',
    'normal'
  );
  console.log('  ✅ Message admin créé');

  // 2. Récupérer tous les messages
  console.log('\n2️⃣ Récupération des messages...');
  const allMessages = await messageService.getUserMessages(userId);
  console.log(`  📬 Total: ${allMessages.length} messages`);
  allMessages.forEach(msg => {
    console.log(`    - ${msg.title} | ${msg.is_read ? 'Lu' : 'NON LU'} | Priorité: ${msg.priority}`);
  });

  // 3. Compter les non lus
  console.log('\n3️⃣ Comptage des messages non lus...');
  const unreadCount = await messageService.getUnreadCount(userId);
  console.log(`  🔔 Messages non lus: ${unreadCount}`);

  // 4. Marquer un message comme lu
  if (allMessages.length > 0) {
    console.log('\n4️⃣ Marquage du premier message comme lu...');
    const firstMsg = allMessages[0];
    await messageService.markAsRead(firstMsg.id, userId);
    console.log(`  ✅ Message ${firstMsg.id} marqué comme lu`);
    
    const newUnreadCount = await messageService.getUnreadCount(userId);
    console.log(`  🔔 Messages non lus restants: ${newUnreadCount}`);
  }

  // 5. Filtrer par type
  console.log('\n5️⃣ Filtrage par type de message...');
  const combatMessages = await messageService.getUserMessages(userId, { type: 'attack_result' });
  console.log(`  ⚔️  Messages de combat: ${combatMessages.length}`);
  
  const spyMessages = await messageService.getUserMessages(userId, { type: 'spy_report' });
  console.log(`  🕵️  Rapports d'espionnage: ${spyMessages.length}`);

  // 6. Tester l'expiration
  console.log('\n6️⃣ Test de message avec expiration...');
  const expiringMsg = await messageService.createMessage({
    userId,
    type: 'system_message',
    title: '⏰ Message temporaire',
    content: 'Ce message expirera dans 1 minute',
    priority: 'low',
    expiresAt: new Date(Date.now() + 60000) // Expire dans 1 minute
  });
  console.log(`  ✅ Message temporaire créé (ID: ${expiringMsg.id})`);

  console.log('\n✅ === TESTS TERMINES AVEC SUCCES ===\n');
  console.log('Vous pouvez maintenant:');
  console.log('  - Lancer une nouvelle attaque');
  console.log('  - Les messages seront automatiquement créés');
  console.log('  - Accéder à /api/v1/messages pour voir votre boîte aux lettres');
  console.log('\n');
}

testMessageSystem()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  });
