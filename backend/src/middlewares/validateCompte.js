// Règles de validation des formulaires du compte client.
const { body } = require('express-validator');
const validation = require('./validation');
const { POLITIQUE_MDP, MESSAGE_MDP } = require('../utils/regles');

const validerProfil = [
  body('nom').trim().notEmpty().withMessage('Le nom est obligatoire').isLength({ max: 50 }),
  body('prenom').trim().notEmpty().withMessage('Le prénom est obligatoire').isLength({ max: 50 }),
  body('telephone').optional({ values: 'falsy' }).trim().isLength({ max: 20 }),
  validation,
];

const validerChangementMotDePasse = [
  body('ancien_mot_de_passe').notEmpty().withMessage('Saisis ton mot de passe actuel'),
  body('nouveau_mot_de_passe').matches(POLITIQUE_MDP).withMessage(MESSAGE_MDP),
  validation,
];

module.exports = { validerProfil, validerChangementMotDePasse };
