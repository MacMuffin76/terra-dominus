// middleware/errorHandler.js

function errorHandler(err, req, res, next) {
    console.error(err.stack); // Log l'erreur dans la console pour le suivi
    res.status(500).json({ error: 'Erreur interne du serveur' }); // Répond avec une erreur 500 et un message JSON
  }
  
  module.exports = errorHandler;
  