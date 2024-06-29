export const calculateEnergyProduction = (level) => {
  // Exemple de formule de production d'énergie : ajustez selon vos besoins
  return Math.floor(20 * Math.pow(0, level));
};

// Fonction générique pour calculer la production des autres ressources
export const calculateResourceProduction = (level) => {
  return Math.floor(1 * Math.pow(1.1, level));
};
