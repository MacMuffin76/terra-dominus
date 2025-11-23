const upgradeBuildingSchema = {
  id: {
    in: ['params'],
    notEmpty: { errorMessage: "L'identifiant du bâtiment est requis." },
    isInt: {
      options: { min: 1 },
      errorMessage: "L'identifiant du bâtiment doit être un entier positif.",
    },
    toInt: true,
  },
};

const saveUserResourcesSchema = {
  resources: {
    in: ['body'],
    isArray: {
      errorMessage: 'Le format des ressources est invalide (tableau attendu).',
    },
  },
  'resources.*.type': {
    in: ['body'],
    notEmpty: { errorMessage: 'Chaque ressource doit avoir un type.' },
    isString: { errorMessage: 'Le type de ressource doit être une chaîne de caractères.' },
    trim: true,
  },
  'resources.*.amount': {
    in: ['body'],
    optional: true,
    isNumeric: { errorMessage: 'Le montant de la ressource doit être numérique.' },
    toFloat: true,
  },
};

module.exports = {
  upgradeBuildingSchema,
  saveUserResourcesSchema,
};