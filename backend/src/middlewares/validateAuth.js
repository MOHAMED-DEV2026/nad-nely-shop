// Règles de validation des formulaires d'inscription, de connexion et de mot de passe oublié.
// Chaque export est une liste de règles suivie du middleware validation (réponse 400 si une règle échoue).
const { body, validationResult } = require('express-validator');
const validation = require('./validation');
const { POLITIQUE_MDP, MESSAGE_MDP } = require('../utils/regles');

const validerInscription = [
  body('nom').trim().notEmpty().withMessage('Le nom est obligatoire').isLength({ max: 50 }),
  body('prenom').trim().notEmpty().withMessage('Le prénom est obligatoire').isLength({ max: 50 }),
  body('email').trim().isEmail().withMessage('Adresse e-mail invalide').isLength({ max: 100 }),
  body('telephone').optional({ values: 'falsy' }).trim().isLength({ max: 20 }),
  body('mot_de_passe').matches(POLITIQUE_MDP).withMessage(MESSAGE_MDP),
  validation,
];

// La connexion renvoie un message unique, sans détail sur le champ en cause
const validerConnexion = [
  body('email').trim().isEmail(),
  body('mot_de_passe').notEmpty(),
  body('se_souvenir').optional().isBoolean({ strict: true }).toBoolean(),
  (req, res, next) => {
    if (!validationResult(req).isEmpty()) return res.status(400).json({ message: 'E-mail ou mot de passe invalide' });
    next();
  },
];

const validerMotDePasseOublie = [
  body('email').trim().isEmail().withMessage('Adresse e-mail invalide'),
  validation,
];

const validerReinitialisation = [
  body('email').trim().isEmail().withMessage('Adresse e-mail invalide'),
  body('code').trim().matches(/^\d{6}$/).withMessage('Le code doit contenir 6 chiffres'),
  body('nouveau_mot_de_passe').matches(POLITIQUE_MDP).withMessage(MESSAGE_MDP),
  body('confirmation').custom((valeur, { req }) => valeur === req.body.nouveau_mot_de_passe)
    .withMessage('La confirmation est différente du mot de passe'),
  validation,
];

module.exports = { validerInscription, validerConnexion, validerMotDePasseOublie, validerReinitialisation };
