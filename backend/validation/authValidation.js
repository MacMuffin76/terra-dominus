const registerSchema = {
  username: {
    in: ['body'],
    trim: true,
    notEmpty: { errorMessage: "Le nom d'utilisateur est requis." },
    isLength: {
      options: { min: 3, max: 50 },
      errorMessage: "Le nom d'utilisateur doit contenir entre 3 et 50 caractères.",
    },
  },
  email: {
    in: ['body'],
    trim: true,
    notEmpty: { errorMessage: "L'email est requis." },
    isEmail: { errorMessage: "L'email doit être valide." },
    normalizeEmail: true,
  },
  password: {
    in: ['body'],
    notEmpty: { errorMessage: 'Le mot de passe est requis.' },
    isLength: {
      options: { min: 6 },
      errorMessage: 'Le mot de passe doit contenir au moins 6 caractères.',
    },
  },
};

const loginSchema = {
  username: {
    in: ['body'],
    trim: true,
    notEmpty: { errorMessage: "Le nom d'utilisateur est requis." },
  },
  password: {
    in: ['body'],
    notEmpty: { errorMessage: 'Le mot de passe est requis.' },
  },
};

module.exports = { registerSchema, loginSchema };