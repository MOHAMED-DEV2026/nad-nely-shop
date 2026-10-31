// Règles de validation de la création d'une commande.
const { body } = require('express-validator');
const validation = require('./validation');

const COMMUNES = ['Acoua', 'Bandraboua', 'Bandrélé', 'Bouéni', 'Chiconi', 'Chirongui', 'Dembéni',
  'Dzaoudzi', 'Kani-Kéli', 'Koungou', 'Mamoudzou', 'Mtsamboro', "M'Tsangamouji", 'Ouangani',
  'Pamandzi', 'Sada', 'Tsingoni'];

// Corps attendu :
// { "lignes": [ { "id_produit": 3, "quantite": 1 } ], "mode_reception": "livraison" | "retrait",
//   "adresse_livraison": "...", "commune_livraison": "...", "telephone_contact": "..." }
const validerCommande = [
  body('mode_reception').isIn(['livraison', 'retrait']).withMessage('Mode de réception invalide'),
  body('adresse_livraison').if(body('mode_reception').equals('livraison')).trim().notEmpty().withMessage('Adresse obligatoire').isLength({ max: 255 }),
  body('commune_livraison').if(body('mode_reception').equals('livraison')).isIn(COMMUNES).withMessage('Commune invalide'),
  body('telephone_contact').trim().matches(/^[0-9+ .()-]{6,20}$/).withMessage('Téléphone de contact invalide'),
  body('lignes').isArray({ min: 1 }).withMessage('Le panier est vide'),
  body('lignes.*.id_produit').isInt({ min: 1 }),
  body('lignes.*.quantite').isInt({ min: 1, max: 99 }),
  validation,
];

module.exports = { validerCommande };
