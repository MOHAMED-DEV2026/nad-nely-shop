// Route du formulaire de contact (publique). La limite d'envois est réglée dans app.js.
const router = require('express').Router();
const { validerContact } = require('../middlewares/validateContact');
const contact = require('../controllers/contact.controller');

router.post('/', validerContact, contact.envoyer);

module.exports = router;
