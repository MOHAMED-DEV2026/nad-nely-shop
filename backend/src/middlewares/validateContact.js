// Règles de validation du formulaire de contact (réponse 400 si une règle échoue).
const { body } = require('express-validator');
const validation = require('./validation');

const validerContact = [
  body('nom').trim().notEmpty().withMessage('Le nom est obligatoire').isLength({ max: 100 }).withMessage('Nom trop long'),
  body('email').trim().isEmail().withMessage('Adresse e-mail invalide').isLength({ max: 100 }),
  body('sujet').trim().notEmpty().withMessage('Le sujet est obligatoire').isLength({ max: 150 }).withMessage('Sujet trop long (150 caractères maximum)'),
  body('message').trim().isLength({ min: 10 }).withMessage('Le message doit contenir au moins 10 caractères')
    .isLength({ max: 3000 }).withMessage('Message trop long (3 000 caractères maximum)'),
  // Champ caché du formulaire, rempli seulement par les robots (piège anti-spam)
  body('site_web').optional().isString(),
  validation,
];

module.exports = { validerContact };
