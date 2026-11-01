// Routes du paiement : demandent d'être connecté.
const router = require('express').Router();
const { exigerConnexion } = require('../middlewares/auth');
const { validerVerification } = require('../middlewares/validatePaiement');
const paiement = require('../controllers/paiement.controller');

router.post('/verification', exigerConnexion, validerVerification, paiement.verifier);

module.exports = router;
