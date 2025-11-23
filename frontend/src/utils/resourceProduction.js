// frontend/src/utils/resourceProduction.js

// ÉNERGIE : valeur FIXE par niveau de la centrale
// Niveau 0 = 0, niveau 1 = 100, niveau 2 = 200, etc.
export const calculateEnergyProduction = (level) => {
  const lvl = Number(level) || 0;
  if (lvl <= 0) return 0;
  return lvl * 100;
};

// AUTRES RESSOURCES (or, métal, carburant) : production par seconde
// (tu pourras ajuster la formule si tu veux une progression différente)
export const calculateResourceProduction = (level) => {
  const lvl = Number(level) || 0;
  if (lvl <= 0) return 0;

  return Math.floor(5 * Math.pow(1.1, lvl - 1));
};
