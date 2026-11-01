// Service « commandes » de l'administration : liste, détail, changement de statut (BF21 à BF23).
// Il ne connaît ni req ni res. Chaque fonction renvoie { success, error, data }.
const adminModel = require('../models/adminCommande.model');
const commandeModel = require('../models/commande.model');
const { enTransaction } = require('../models/transaction');
const { LIBELLES, statutAffiche } = require('../utils/statuts');

const PAR_PAGE = 20;
// RG31 : étape suivante possible pour chaque statut (« livrée » et « annulée » sont définitifs, RG30)
const SUIVANT = { confirmee: 'expediee', expediee: 'livree' };
// RG32 : on peut annuler tant que la commande n'est pas livrée
const ANNULABLES = ['en_attente', 'confirmee', 'expediee'];
// RG33 : statuts pour lesquels le stock a déjà été décrémenté (après paiement validé)
const STOCK_DECREMENTE = ['confirmee', 'expediee'];

// BF21 : liste filtrée (statut, dates, client), 20 commandes par page
async function lister(query) {
  const filtres = {
    statut: query.statut && LIBELLES[query.statut] ? query.statut : null,
    du: query.du || null,
    au: query.au || null,
    client: query.client || null,
  };
  const page = Math.max(1, Number(query.page) || 1);
  const { total, commandes } = await adminModel.chercher(filtres, page, PAR_PAGE);
  return {
    success: true,
    data: {
      total, page, par_page: PAR_PAGE,
      commandes: commandes.map((c) => ({ ...c, statut_affiche: statutAffiche(c) })),
    },
  };
}

// BF22 : détail complet d'une commande
async function obtenir(id) {
  const commande = await adminModel.trouverDetail(id);
  if (!commande) return { success: false, error: 'COMMANDE_INTROUVABLE' };
  const lignes = await adminModel.listerLignes(id);
  const paiement = await adminModel.trouverPaiement(id);
  return {
    success: true,
    data: {
      ...commande,
      statut_affiche: statutAffiche(commande),
      etape_suivante: SUIVANT[commande.statut] || null,
      annulable: ANNULABLES.includes(commande.statut),
      lignes,
      paiement,
    },
  };
}

// BF23 : faire avancer ou annuler une commande, dans une transaction
async function changerStatut(id, action) {
  return enTransaction(async (cx) => {
    const statut = await commandeModel.verrouillerStatut(cx, id);
    if (!statut) return { success: false, error: 'COMMANDE_INTROUVABLE' };

    if (action === 'avancer') {
      const suivant = SUIVANT[statut];
      if (!suivant) return { success: false, error: 'AVANCE_IMPOSSIBLE', data: { statut } };
      await commandeModel.changerStatut(cx, id, suivant);
      return { success: true, data: { statut: suivant, annule: false } };
    }

    // Annulation (RG32)
    if (!ANNULABLES.includes(statut)) return { success: false, error: 'ANNULATION_IMPOSSIBLE', data: { statut } };
    // RG33 : le stock avait été retiré au paiement, on le remet
    if (STOCK_DECREMENTE.includes(statut)) await adminModel.remettreStock(cx, id);
    await commandeModel.changerStatut(cx, id, 'annulee');
    return { success: true, data: { statut: 'annulee', annule: true } };
  });
}

module.exports = { lister, obtenir, changerStatut };
