// Erreur inattendue : on l'écrit dans le terminal, mais on ne montre jamais le détail technique au client.
function errorHandler(err, req, res, next) {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(500).json({ message: 'Erreur du serveur' });
}

module.exports = errorHandler;
