// Routes du catalogue public (accessibles sans connexion).
const router = require('express').Router();
const validateId = require('../middlewares/validateId');
const catalogue = require('../controllers/catalogue.controller');

router.get('/categories', catalogue.listerCategories);
router.get('/produits', catalogue.listerProduits);
router.get('/produits/filtres', catalogue.listerFiltres);   // avant /produits/:id
router.get('/produits/:id', validateId, catalogue.obtenirProduit);

module.exports = router;
