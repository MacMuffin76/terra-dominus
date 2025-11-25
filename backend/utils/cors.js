// backend/utils/cors.js

const getAllowedOrigins = () => {
  const rawOrigins = process.env.CORS_ORIGINS;

  // Si rien n'est défini, on autorise par défaut le front classique en dev
  const defaultOrigins = ['http://localhost:3000'];

  if (!rawOrigins || !rawOrigins.trim()) {
    return defaultOrigins;
  }

  return rawOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const buildCorsOptions = () => {
  const allowedOrigins = getAllowedOrigins();

  // Si on met "*" dans CORS_ORIGINS, on autorise tout
  const allowAllOrigins = allowedOrigins.includes('*');

  return {
    origin: (origin, callback) => {
      // En dev, certaines requêtes n'ont pas d'origin (Postman, curl…) → on autorise
      if (allowAllOrigins || !origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Petit log utile pour debug (si tu as un logger, tu peux l'utiliser ici)
      console.warn(
        `[CORS] Origin non autorisé : ${origin}. Origins autorisés : ${allowedOrigins.join(
          ', '
        )}`
      );

      const error = new Error('Not allowed by CORS');
      error.status = 403;
      error.expose = true;
      return callback(error);
    },
    credentials: true,
  };
};

module.exports = { getAllowedOrigins, buildCorsOptions };
