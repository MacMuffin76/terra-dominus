// backend/utils/resourceProduction.js

// Formule de production de ressources (hors énergie)
function calculateResourceProduction(level) {
  // exemple : 1 * 1.1^level, arrondi vers le bas
  return Math.floor(1 * Math.pow(1.1, level));
}

// Formule de production d'énergie
function calculateEnergyProduction(level) {
  // exemple : 20 * 1.05^level, arrondi vers le bas
  return Math.floor(1 * Math.pow(1.05, level));
}

module.exports = {
  calculateResourceProduction,
  calculateEnergyProduction
};
