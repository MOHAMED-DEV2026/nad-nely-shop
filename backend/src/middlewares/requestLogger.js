// Affiche dans le terminal chaque requête reçue : méthode, adresse, code de réponse et durée.
function requestLogger(req, res, next) {
  const debut = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - debut} ms)`);
  });
  next();
}

module.exports = requestLogger;
