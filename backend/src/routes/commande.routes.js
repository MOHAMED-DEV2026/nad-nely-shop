// Routes des commandes du client : toutes demandent d'être connecté.
const router = require('express').Router();
const { exigerConnexion } = require('../middlewares/auth');
const validateId = require('../middlewares/validateId');
const { validerCommande } = require('../middlewares/validateCommande');
const commande = require('../controllers/commande.controller');

router.use(exigerConnexion);

router.post('/', validerCommande, commande.creer);
router.get('/', commande.lister);
router.get('/:id', validateId, commande.detail);
router.post('/:id/paiement', validateId, commande.relancerPaiement);

module.exports = router;
