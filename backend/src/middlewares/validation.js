const { validationResult } = require('express-validator');

// À placer après les règles express-validator : renvoie 400 avec la liste des erreurs, sinon continue.
function validation(req, res, next) {
  const erreurs = validationResult(req);
  if (!erreurs.isEmpty()) return res.status(400).json({ erreurs: erreurs.array() });
  next();
}

module.exports = validation;
