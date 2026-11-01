// Règles de validation de la vérification d'un paiement.
const { body } = require('express-validator');
const validation = require('./validation');

// Corps attendu : { "session_id": "cs_test_..." }
const validerVerification = [
  body('session_id').isString().matches(/^cs_(test|live)_[A-Za-z0-9]+$/).withMessage('Identifiant de session invalide'),
  validation,
];

module.exports = { validerVerification };
