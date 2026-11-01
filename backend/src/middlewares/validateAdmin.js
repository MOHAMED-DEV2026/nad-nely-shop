// Règles de validation des formulaires de l'administration (produits et catégories).
const { body } = require('express-validator');
const validation = require('./validation');

// À placer après l'envoi de l'image (multer), car le formulaire produit est envoyé en multipart
const validerProduit = [
  body('nom').trim().notEmpty().withMessage('Le nom est obligatoire').isLength({ max: 100 }),
  body('description').trim().notEmpty().withMessage('La description est obligatoire'),
  body('prix').isFloat({ gt: 0 }).withMessage('Le prix doit être supérieur à 0'),
  body('stock').isInt({ min: 0 }).withMessage('Stock invalide'),
  body('id_categorie').isInt({ min: 1 }).withMessage('Catégorie obligatoire'),
  body('marque').optional({ values: 'falsy' }).trim().isLength({ max: 50 }),
  body('origine').optional({ values: 'falsy' }).trim().isLength({ max: 50 }),
  body('public_cible').optional({ values: 'falsy' }).isIn(['femme', 'homme', 'mixte']),
  body('date_fabrication').optional({ values: 'falsy' }).isISO8601(),
  body('date_expiration').optional({ values: 'falsy' }).isISO8601(),
  validation,
];

const validerCategorie = [
  body('nom').trim().notEmpty().withMessage('Le nom est obligatoire').isLength({ max: 50 }),
  body('description').optional({ values: 'falsy' }).trim().isLength({ max: 255 }),
  validation,
];

module.exports = { validerProduit, validerCategorie };
