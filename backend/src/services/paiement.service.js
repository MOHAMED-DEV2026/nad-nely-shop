// Service « paiement » : vérifie le paiement auprès de Stripe puis confirme la commande (BF18).
// Le navigateur ne décide de rien : c'est le serveur qui interroge Stripe (RG37).
// Il ne connaît ni req ni res. Chaque fonction renvoie { success, error, data }.
const { stripe } = require('../config/stripe');
const commandeModel = require('../models/commande.model');
const paiementModel = require('../models/paiement.model');
const produitModel = require('../models/produit.model');
const { enTransaction } = require('../models/transaction');

// Confirme la commande dans une transaction qui verrouille la commande et les produits
async function confirmerCommande(idCommande, referenceStripe) {
  const resultat = await enTransaction(async (cx) => {
    // Si la page est rechargée, on ne confirme pas deux fois (stock décrémenté une seule fois)
    const statut = await commandeModel.verrouillerStatut(cx, idCommande);
    if (statut !== 'en_attente') {
      // Commande annulée par l'administrateur pendant le paiement : la trace du paiement est gardée (remboursement manuel)
      if (statut === 'annulee') await paiementModel.marquerValideTardif(cx, idCommande, referenceStripe);
      return { success: true, data: { id_commande: idCommande, statut } };
    }

    // Verrouille les produits et vérifie que le stock suffit encore (RG39)
    const lignes = await commandeModel.verrouillerLignesAvecStock(cx, idCommande);
    const stockSuffisant = lignes.every((l) => l.stock >= l.quantite);

    // Le paiement est enregistré dans tous les cas : la référence Stripe sert au remboursement (RG40)
    await paiementModel.marquerValide(cx, idCommande, referenceStripe);

    if (!stockSuffisant) {
      // RG39 : stock devenu insuffisant, la commande est annulée, remboursement manuel depuis Stripe.
      // On valide quand même la transaction, pour garder la trace du paiement et de l'annulation.
      await commandeModel.changerStatut(cx, idCommande, 'annulee');
      return { success: true, data: { id_commande: idCommande, statut: 'annulee', stockInsuffisant: true } };
    }

    // RG38 : le stock est décrémenté au moment de la confirmation
    for (const l of lignes) await produitModel.decrementerStock(cx, l.id_produit, l.quantite);
    await commandeModel.changerStatut(cx, idCommande, 'confirmee');
    return { success: true, data: { id_commande: idCommande, statut: 'confirmee', message: 'Paiement confirmé' } };
  });

  if (resultat.data.stockInsuffisant) {
    return { success: false, error: 'STOCK_DEVENU_INSUFFISANT', data: { id_commande: idCommande, statut: 'annulee' } };
  }
  return resultat;
}

async function verifier(idUtilisateur, sessionId) {
  // 1. On demande à Stripe l'état réel de la session de paiement
  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch (erreurStripe) {
    return { success: false, error: 'SESSION_INTROUVABLE' };
  }

  const idCommande = Number(session.metadata && session.metadata.id_commande);
  if (!idCommande) return { success: false, error: 'SESSION_INTROUVABLE' };

  const commande = await commandeModel.trouverParId(idCommande);
  if (!commande) return { success: false, error: 'COMMANDE_INTROUVABLE' };
  // La commande doit appartenir au client connecté
  if (commande.id_utilisateur !== idUtilisateur) return { success: false, error: 'ACCES_REFUSE' };

  // 2. Le paiement doit être réussi, et le montant doit être exact (RG36, RG37)
  if (session.payment_status !== 'paid') {
    return { success: false, error: 'PAIEMENT_NON_ABOUTI', data: { statut: commande.statut } };
  }
  const montantAttendu = Math.round(Number(commande.montant_total) * 100);
  if (session.amount_total !== montantAttendu || session.currency !== 'eur') {
    return { success: false, error: 'MONTANT_INCORRECT' };
  }

  // 3. Confirmation
  return confirmerCommande(idCommande, session.id);
}

module.exports = { verifier };
