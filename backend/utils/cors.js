const getAllowedOrigins = () => {
  const rawOrigins = process.env.CORS_ORIGINS;
  return rawOrigins
    ? rawOrigins.split(',').map((origin) => origin.trim()).filter(Boolean)
    : ['http://localhost:3000'];
};

const buildCorsOptions = () => {
  const allowedOrigins = getAllowedOrigins();

  return {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      const error = new Error('Not allowed by CORS');
      error.status = 403;
      error.expose = true;
      return callback(error);
    },
    credentials: true,
  };
};

module.exports = { getAllowedOrigins, buildCorsOptions };