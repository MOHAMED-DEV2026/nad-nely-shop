// Routes de l'administration : toutes réservées à l'administrateur connecté.
const router = require('express').Router();
const { exigerConnexion, exigerAdmin } = require('../middlewares/auth');
const validateId = require('../middlewares/validateId');
const envoyerImage = require('../middlewares/uploadImage');
const { validerProduit, validerCategorie, validerAction } = require('../middlewares/validateAdmin');
const produits = require('../controllers/adminProduit.controller');
const categories = require('../controllers/adminCategorie.controller');
const commandes = require('../controllers/adminCommande.controller');
const utilisateurs = require('../controllers/adminUtilisateur.controller');
const tableauDeBord = require('../controllers/adminTableauDeBord.controller');

router.use(exigerConnexion, exigerAdmin);

// Produits (BF09 à BF11)
router.get('/produits', produits.lister);
router.get('/produits/:id', validateId, produits.obtenir);
router.post('/produits', envoyerImage, validerProduit, produits.creer);
router.put('/produits/:id', validateId, envoyerImage, validerProduit, produits.modifier);
router.delete('/produits/:id', validateId, produits.supprimer);

// Catégories (BF12)
router.get('/categories', categories.lister);
router.post('/categories', validerCategorie, categories.creer);
router.put('/categories/:id', validateId, validerCategorie, categories.modifier);
router.delete('/categories/:id', validateId, categories.supprimer);

// Commandes (BF21 à BF23)
router.get('/commandes', commandes.lister);
router.get('/commandes/:id', validateId, commandes.obtenir);
router.patch('/commandes/:id/statut', validateId, validerAction, commandes.changerStatut);

// Clients inscrits, en consultation seule (BF24)
router.get('/utilisateurs', utilisateurs.lister);

// Tableau de bord (BF25)
router.get('/tableau-de-bord', tableauDeBord.indicateurs);

module.exports = router;
