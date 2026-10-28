// Vérifie que :id dans l'adresse est un entier positif, puis le place dans req.idValide.
function validateId(req, res, next) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'Identifiant invalide' });
  }
  req.idValide = id;
  next();
}

module.exports = validateId;
