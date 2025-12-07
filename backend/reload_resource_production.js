const sequelize = require('./db');
const { getProductionPerSecond } = require('./utils/balancing');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion DB OK\n');

    console.log('📊 Génération des taux de production pour 50 niveaux...\n');

    const productionData = [];

    // Pour chaque bâtiment, générer 50 niveaux
    const buildingNames = ['Mine de métal', "Mine d'or", 'Extracteur', 'Centrale électrique'];
    
    for (const buildingName of buildingNames) {
      for (let level = 1; level <= 50; level++) {
        let productionRate;
        
        if (buildingName === 'Centrale électrique') {
          // Centrale = capacité fixe d'énergie (pas de production/s)
          productionRate = level * 50;
        } else {
          // Pour les mines : production par seconde * 3600 = production par heure
          const perSecond = getProductionPerSecond(buildingName, level);
          productionRate = Math.round(perSecond * 3600 * 100) / 100; // Arrondi à 2 décimales
        }

        productionData.push({
          building_id: 1,
          building_name: buildingName,
          resource_type_id: 1,
          amount: 0,
          level: level,
          production_rate: productionRate,
          last_updated: new Date(),
        });

        if (level === 1 || level === 10 || level === 20 || level === 30 || level === 50) {
          console.log(`  ${buildingName} niv.${level}: ${productionRate}/h`);
        }
      }
      console.log('');
    }

    // Vider la table
    console.log('🗑️  Suppression des anciennes données...\n');
    await sequelize.query('DELETE FROM resource_production');

    // Désactiver les triggers
    await sequelize.query('ALTER TABLE resource_production DISABLE TRIGGER ALL;');

    // Insérer les nouvelles données
    console.log('💾 Insertion des nouvelles données...\n');
    for (const row of productionData) {
      await sequelize.query(
        `INSERT INTO resource_production 
         (building_id, building_name, resource_type_id, amount, level, production_rate, last_updated)
         VALUES (:building_id, :building_name, :resource_type_id, :amount, :level, :production_rate, :last_updated)`,
        { replacements: row }
      );
    }

    // Réactiver les triggers
    await sequelize.query('ALTER TABLE resource_production ENABLE TRIGGER ALL;');

    console.log(`✅ ${productionData.length} entrées créées avec succès!\n`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();
