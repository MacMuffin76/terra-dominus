const seq = require('./db');

(async () => {
  const [buildings] = await seq.query('SELECT name, level FROM buildings WHERE city_id = 86');
  console.log('Bâtiments:', buildings);
  
  const mineMetal = buildings.find(b => b.name === 'Mine de métal');
  const mineOr = buildings.find(b => b.name === "Mine d'or");
  const extracteur = buildings.find(b => b.name === 'Extracteur');
  
  const [prodMetal] = await seq.query(`SELECT production_rate FROM resource_production WHERE building_name = 'Mine de métal' AND level = ${mineMetal?.level || 1}`);
  const [prodOr] = await seq.query(`SELECT production_rate FROM resource_production WHERE building_name = 'Mine d''or' AND level = ${mineOr?.level || 1}`);
  const [prodFuel] = await seq.query(`SELECT production_rate FROM resource_production WHERE building_name = 'Extracteur' AND level = ${extracteur?.level || 1}`);
  
  const metalRate = prodMetal[0]?.production_rate || 0;
  const orRate = prodOr[0]?.production_rate || 0;
  const fuelRate = prodFuel[0]?.production_rate || 0;
  
  console.log('\nProduction par seconde:');
  console.log('Métal:', metalRate, '/s');
  console.log('Or:', orRate, '/s');
  console.log('Carburant:', fuelRate, '/s');
  
  const t = 300; // 5 minutes
  console.log('\n📊 Après 5 min (300s):');
  console.log('Métal: 1481 +', Math.floor(metalRate * t), '=', 1481 + Math.floor(metalRate * t));
  console.log('Or: 1139 +', Math.floor(orRate * t), '=', 1139 + Math.floor(orRate * t));
  console.log('Carburant: 5 +', Math.floor(fuelRate * t), '=', 5 + Math.floor(fuelRate * t));
  console.log('Énergie: ~1520 (dépend de consommation/production)');
  
  await seq.close();
})();
