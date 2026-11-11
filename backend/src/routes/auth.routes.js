// Routes d'authentification (publiques). La limite des tentatives (BNF08) est réglée dans app.js.
const router = require('express').Router();
const v = require('../middlewares/validateAuth');
const auth = require('../controllers/auth.controller');

router.post('/inscription', v.validerInscription, auth.inscription);
router.post('/connexion', v.validerConnexion, auth.connexion);
router.post('/mot-de-passe-oublie', v.validerMotDePasseOublie, auth.motDePasseOublie);
router.post('/reinitialiser-mot-de-passe', v.validerReinitialisation, auth.reinitialiserMotDePasse);

module.exports = router;
