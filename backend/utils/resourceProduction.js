// backend/utils/resourceProduction.js

// Formule de production de ressources (hors énergie)
function calculateResourceProduction(level) {
  // exemple : 1 * 1.1^level, arrondi vers le bas
  return Math.floor(1 * Math.pow(1.1, level));
}

// Formule de production d'énergie
function calculateEnergyProduction(level) {
  if (level === 0) return 0;
  // 50 * 1.1^(level-1)
  return Math.floor(50 * Math.pow(1.1, level - 1));
}

module.exports = {
  calculateResourceProduction,
  calculateEnergyProduction
};
