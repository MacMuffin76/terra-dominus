function errorHandler(err, req, res, next) {
  // eslint-disable-next-line no-console
  console.error(err.stack || err.message || err);

  const status = err.status || 500;
  const payload = err.expose
    ? { message: err.message }
    : { error: 'Erreur interne du serveur' };

  res.status(status).json(payload);
}

module.exports = errorHandler;