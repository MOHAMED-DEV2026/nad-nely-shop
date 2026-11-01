// Routes de l'administration : toutes réservées à l'administrateur connecté.
const router = require('express').Router();
const { exigerConnexion, exigerAdmin } = require('../middlewares/auth');
const validateId = require('../middlewares/validateId');
const envoyerImage = require('../middlewares/uploadImage');
const { validerProduit, validerCategorie } = require('../middlewares/validateAdmin');
const produits = require('../controllers/adminProduit.controller');
const categories = require('../controllers/adminCategorie.controller');

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

module.exports = router;
