// Service « notifications » : envoie les e-mails du site (clients et administrateur).
// Un e-mail qui ne part pas ne doit jamais faire échouer l'action du client (inscription, paiement...) :
// chaque fonction attrape l'erreur, l'écrit dans le journal du serveur et continue.
// Les services peuvent donc l'appeler sans « await » quand ils ne veulent pas attendre l'envoi.
const { envoyer, EMAIL_ADMIN } = require('../config/mailer');
const messages = require('../emails/messages');
const commandeModel = require('../models/commande.model');
const adminCommandeModel = require('../models/adminCommande.model');

// En dessous (ou à égalité) de ce stock, l'administrateur reçoit une alerte après une commande
const SEUIL_STOCK_BAS = Number(process.env.SEUIL_STOCK_BAS) || 3;

async function sansErreur(nom, envoi) {
  try {
    await envoi();
  } catch (erreur) {
    console.error(`E-mail « ${nom} » non envoyé :`, erreur.message);
  }
}

// Commande avec les coordonnées du client, et ses articles
async function chargerCommande(idCommande) {
  const commande = await adminCommandeModel.trouverDetail(idCommande);
  const lignes = await commandeModel.listerLignes(idCommande);
  return { commande, lignes };
}

// ---------- Compte ----------

const codeVerification = (email, prenom, code) =>
  sansErreur('code de vérification', () => envoyer(email, messages.codeVerification(prenom, code)));

const codeReinitialisation = (email, prenom, code) =>
  sansErreur('code de réinitialisation', () => envoyer(email, messages.codeReinitialisation(prenom, code)));

const bienvenue = (email, prenom) =>
  sansErreur('bienvenue', () => envoyer(email, messages.bienvenue(prenom)));

const motDePasseModifie = (email, prenom) =>
  sansErreur('mot de passe modifié', () => envoyer(email, messages.motDePasseModifie(prenom)));

const profilModifie = (email, profil) =>
  sansErreur('profil modifié', () => envoyer(email, messages.profilModifie(profil)));

// ---------- Commandes ----------

// Paiement validé : confirmation au client, alerte « nouvelle commande » à la boutique,
// et alerte « stock bas » si des produits passent sous le seuil.
// « stocksRestants » : [{ nom, stock }] après la décrémentation.
function commandePayee(idCommande, stocksRestants = []) {
  return sansErreur('commande payée', async () => {
    const { commande, lignes } = await chargerCommande(idCommande);
    await sansErreur('confirmation client', () => envoyer(commande.email, messages.commandeConfirmee(commande, lignes)));
    await sansErreur('nouvelle commande (boutique)', () => envoyer(EMAIL_ADMIN, messages.nouvelleCommande(commande, lignes)));

    const bas = stocksRestants.filter((p) => p.stock <= SEUIL_STOCK_BAS);
    if (bas.length) await envoyer(EMAIL_ADMIN, messages.stockBas(bas, SEUIL_STOCK_BAS));
  });
}

// RG39 : stock devenu insuffisant pendant le paiement, la commande est annulée
function commandeAnnuleeStock(idCommande, referenceStripe) {
  return sansErreur('commande annulée (stock)', async () => {
    const { commande, lignes } = await chargerCommande(idCommande);
    await sansErreur('annulation client', () => envoyer(commande.email, messages.commandeAnnuleeStock(commande, lignes)));
    await envoyer(EMAIL_ADMIN, messages.remboursementAFaire(
      commande, 'Un article est devenu indisponible pendant le paiement : la commande a été annulée automatiquement.', referenceStripe,
    ));
  });
}

// Le client a payé une commande que l'administrateur avait annulée entre-temps
function paiementSurCommandeAnnulee(idCommande, referenceStripe) {
  return sansErreur('paiement sur commande annulée', async () => {
    const { commande } = await chargerCommande(idCommande);
    await envoyer(EMAIL_ADMIN, messages.remboursementAFaire(
      commande, 'Un paiement est arrivé sur une commande déjà annulée.', referenceStripe,
    ));
  });
}

// L'administrateur a fait avancer ou annulé une commande : le client est prévenu
function statutCommande(idCommande) {
  return sansErreur('changement de statut', async () => {
    const { commande, lignes } = await chargerCommande(idCommande);
    if (!['expediee', 'livree', 'annulee'].includes(commande.statut)) return;
    const paiement = await adminCommandeModel.trouverPaiement(idCommande);
    const paiementValide = Boolean(paiement && paiement.statut === 'valide');
    await envoyer(commande.email, messages.commandeStatut(commande, lignes, paiementValide));
  });
}

// ---------- Formulaire de contact ----------

// Contrairement aux autres, celle-ci renvoie true / false : le visiteur doit savoir si son message est parti
async function messageContact(donnees) {
  try {
    await envoyer(EMAIL_ADMIN, messages.messageContact(donnees), donnees.email);
    return true;
  } catch (erreur) {
    console.error('Message de contact non envoyé :', erreur.message);
    return false;
  }
}

module.exports = {
  codeVerification, codeReinitialisation, bienvenue, motDePasseModifie, profilModifie,
  commandePayee, commandeAnnuleeStock, paiementSurCommandeAnnulee, statutCommande, messageContact,
};
