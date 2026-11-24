// Contrôleur « contact » : lit la requête, appelle le service, choisit le code HTTP.
const contactService = require('../services/contact.service');

async function envoyer(req, res, next) {
  try {
    const r = await contactService.envoyerMessage(req.body);
    if (!r.success) {
      return res.status(503).json({ message: 'Votre message n’a pas pu être envoyé. Réessayez dans quelques minutes.' });
    }
    res.json({ message: 'Merci ! Votre message a bien été envoyé, nous vous répondrons par e-mail.' });
  } catch (e) { next(e); }
}

module.exports = { envoyer };
