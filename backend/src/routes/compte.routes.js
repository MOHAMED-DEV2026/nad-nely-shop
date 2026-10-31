// Routes du compte client : toutes demandent d'être connecté.
const router = require('express').Router();
const { exigerConnexion } = require('../middlewares/auth');
const v = require('../middlewares/validateCompte');
const compte = require('../controllers/compte.controller');

router.use(exigerConnexion);

router.get('/', compte.lire);
router.put('/', v.validerProfil, compte.modifier);
router.put('/mot-de-passe', v.validerChangementMotDePasse, compte.changerMotDePasse);

module.exports = router;
