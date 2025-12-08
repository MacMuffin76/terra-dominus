// backend/utils/balancing.js
//
// Centralisation des formules d'équilibrage (coûts déjà gérés en SQL).
// Ici on gère :
//  - les productions par seconde des bâtiments de ressource
//  - les durées de construction (build_duration) en secondes
//
// Objectifs de rythme (approximatifs) :
//  - Niveaux 1 → 5   : ~15 minutes au total
//  - Niveaux 5 → 10  : ~2 heures au total
//  - Niveaux 10 → 20 : plusieurs jours au total
//  - Niveaux 20 → 30 : plusieurs mois au total
//  - Niveaux 30 → 50 : plusieurs mois, limite ~1 an
//
// ⚠ Important :
//  - On réduit fortement les productions pour éviter les +5000/s au niveau 3.
//  - L'ÉNERGIE n'est plus produite par seconde : elle sera gérée comme une valeur
//    fixe par niveau de centrale (pas d'incrément automatique ici).

/**
 * Production par seconde d'un bâtiment de ressource en fonction de son niveau.
 *
 * IMPORTANT : Cette fonction utilise des formules de base mais les vrais taux
 * devraient être chargés depuis la table `resource_production`.
 * Pour des calculs précis, utilisez ProductionCalculatorService.
 *
 * Mine de métal  : ressource principale, la plus rentable
 * Mine d'or      : moins de volume que le métal, plus rare
 * Extracteur     : carburant, encore plus lent
 *
 * NB : La Centrale électrique NE produit PAS d'énergie par seconde ici.
 *      L'énergie sera calculée séparément (valeur fixe par niveau).
 */
function getProductionPerSecond(buildingName, level) {
  const lvl = Number(level) || 0;
  if (lvl <= 0) return 0;

  // Formules progressives basées sur le niveau
  // Base production (level 1) * facteur de croissance
  const growthFactor = Math.pow(1.15, lvl - 1); // Croissance de 15% par niveau

  switch (buildingName) {
    case 'Mine de métal':
      // Production de base : 200/h au niveau 1
      // Conversion en production par seconde : 200 / 3600 ≈ 0.0555
      return (200 / 3600) * growthFactor;

    case "Mine d'or":
      // Production de base : 100/h au niveau 1
      return (100 / 3600) * growthFactor;

    case 'Extracteur':
      // Production de base : 50/h au niveau 1
      return (50 / 3600) * growthFactor;

    case 'Centrale électrique':
      // Pas de production par seconde
      return 0;

    default:
      return 0;
  }
}

/**
 * Durée de construction (en secondes) pour passer au niveau `nextLevel`.
 *
 * On utilise une fonction en "paliers" pour coller à tes objectifs :
 *  - 1 → 5   : ~15 minutes au total
 *  - 5 → 10  : ~2 heures au total
 *  - 10 → 20 : plusieurs jours au total
 *  - 20 → 30 : plusieurs mois au total
 *  - 30 → 50 : plusieurs mois, limite 1 an
 */
function getBuildDurationSeconds(nextLevel) {
  const lvl = Number(nextLevel) || 0;

  if (lvl <= 1) {
    // Niveau 1 -> 2 : ~2 minutes
    return 2 * 60;
  }

  // 2 → 5 : on veut ~15 minutes au total sur 4 upgrades
  // Durées approximatives : 2, 3, 4, 6 minutes
  if (lvl <= 5) {
    const idx = lvl - 2; // 0..3
    const patternMinutes = [2, 3, 4, 6];
    return patternMinutes[idx] * 60;
  }

  // 6 → 10 : ~2h au total → ~10, 15, 20, 30, 45 minutes
  if (lvl <= 10) {
    const idx = lvl - 6; // 0..4
    const patternMinutes = [10, 15, 20, 30, 45];
    return patternMinutes[idx] * 60;
  }

  // 11 → 20 : “plusieurs jours” pour la tranche (~3–5 jours)
  // Exemple : 2h, 3h, 4h, 6h, 8h, 10h, 12h, 16h, 18h, 20h
  if (lvl <= 20) {
    const idx = lvl - 11; // 0..9
    const patternHours = [2, 3, 4, 6, 8, 10, 12, 16, 18, 20];
    return patternHours[idx] * 3600;
  }

  // 21 → 30 : “plusieurs mois” (en jours)
  // Exemple : 1j, 2j, 3j, 4j, 6j, 8j, 10j, 12j, 15j, 18j
  if (lvl <= 30) {
    const idx = lvl - 21; // 0..9
    const patternDays = [1, 2, 3, 4, 6, 8, 10, 12, 15, 18];
    return patternDays[idx] * 24 * 3600;
  }

  // 31 → 50 : “plusieurs mois, limite 1 an”.
  // On parle en jours/semaines.
  const idx = Math.min(lvl, 50) - 31; // 0..19
  const patternDays = [
    20, 25, 30, 35, 40,
    45, 50, 55, 60, 70,
    80, 90, 100, 110, 120,
    130, 140, 150, 160, 180,
  ];

  return patternDays[idx] * 24 * 3600;
}

/**
 * Durée de recherche (en secondes) pour un niveau donné.
 * Utilise la durée de base de la définition et augmente linéairement selon le niveau.
 * Permet d'appliquer un multiplicateur de vitesse (ex: spécialisation de ville ou bonus d'installation).
 */
function getResearchDurationSeconds(baseTime, level = 1, speedMultiplier = 1) {
  const base = Number(baseTime) || 0;
  const lvl = Number(level) || 1;
  const multiplier = Number(speedMultiplier) || 1;

  const rawDuration = base * lvl;
  const adjusted = multiplier > 0 ? rawDuration / multiplier : rawDuration;

  return Math.max(1, Math.floor(adjusted));
}

module.exports = {
  getProductionPerSecond,
  getBuildDurationSeconds,
  getResearchDurationSeconds,
};