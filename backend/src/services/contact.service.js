// Service « contact » : transmet le message d'un visiteur à la boutique par e-mail.
// Il ne connaît ni req ni res. Chaque fonction renvoie { success, error }.
const utilisateurModel = require('../models/utilisateur.model');
const notifications = require('./notification.service');

async function envoyerMessage({ nom, email, sujet, message, site_web }) {
  // Champ piège rempli : c'est un robot. On fait comme si tout allait bien, sans rien envoyer.
  if (site_web) return { success: true };

  const compte = Boolean(await utilisateurModel.trouverParEmail(email));
  const envoye = await notifications.messageContact({ nom, email, sujet, message, compte });
  if (!envoye) return { success: false, error: 'ENVOI_IMPOSSIBLE' };
  return { success: true };
}

module.exports = { envoyerMessage };
