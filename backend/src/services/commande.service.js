// Service « commande » (côté client) : création, historique, détail, relance du paiement.
// Il ne connaît ni req ni res. Chaque fonction renvoie { success, error, data }.
const commandeModel = require('../models/commande.model');
const paiementModel = require('../models/paiement.model');
const { enTransaction } = require('../models/transaction');
const { creerSessionPaiement } = require('../config/stripe');
const { statutAffiche } = require('../utils/statuts');

// Ouvre la page de paiement Stripe et garde la référence de la session pour la commande
async function ouvrirPaiement(idCommande, montant) {
  const session = await creerSessionPaiement(idCommande, montant);
  await paiementModel.enregistrerReference(idCommande, session.id);
  return session.url;
}

// BF17 : crée une commande « en attente » avec son paiement « en attente ».
// RG19 : le prix et le total viennent toujours de la base, jamais du navigateur.
async function creer(idUtilisateur, donnees) {
  const { mode_reception, adresse_livraison, commune_livraison, telephone_contact, lignes } = donnees;

  // Si le même produit apparaît deux fois, on additionne les quantités
  const quantites = new Map();
  for (const l of lignes) {
    const id = Number(l.id_produit);
    quantites.set(id, (quantites.get(id) || 0) + Number(l.quantite));
  }

  const resultat = await enTransaction(async (cx) => {
    const produits = await commandeModel.verrouillerProduits(cx, [...quantites.keys()]);
    const parId = new Map(produits.map((p) => [p.id_produit, p]));

    let total = 0;
    for (const [id, quantite] of quantites) {
      const p = parId.get(id);
      // RG15 : vendable = actif, non expiré. RG17 : stock suffisant.
      if (!p || !p.actif || p.expire) {
        return { success: false, error: 'PRODUIT_INDISPONIBLE', nom: p ? p.nom : 'produit inconnu' };
      }
      if (p.stock < quantite) return { success: false, error: 'STOCK_INSUFFISANT', nom: p.nom };
      total += Number(p.prix) * quantite;
    }
    total = Math.round(total * 100) / 100;

    const livraison = mode_reception === 'livraison';
    const idCommande = await commandeModel.inserer(cx, {
      idUtilisateur,
      modeReception: mode_reception,
      adresseLivraison: livraison ? adresse_livraison : null,
      communeLivraison: livraison ? commune_livraison : null,
      telephoneContact: telephone_contact,
      montantTotal: total,
    });
    for (const [id, quantite] of quantites) {
      await commandeModel.insererLigne(cx, idCommande, id, quantite, parId.get(id).prix);
    }
    await commandeModel.insererPaiement(cx, idCommande, total);
    return { success: true, data: { idCommande, total } };
  });
  if (!resultat.success) return resultat;

  // Page de paiement Stripe. Si Stripe est injoignable, la commande reste « en attente »
  // et pourra être payée plus tard (RG41).
  const { idCommande, total } = resultat.data;
  let urlPaiement = null;
  try {
    urlPaiement = await ouvrirPaiement(idCommande, total);
  } catch (erreurStripe) {
    console.error('Session Stripe impossible :', erreurStripe.message);
  }
  return {
    success: true,
    data: { id_commande: idCommande, montant_total: total, statut: 'en_attente', url_paiement: urlPaiement },
  };
}

// BF19 : mes commandes
async function lister(idUtilisateur) {
  const commandes = await commandeModel.listerParUtilisateur(idUtilisateur);
  return { success: true, data: commandes.map((c) => ({ ...c, statut_affiche: statutAffiche(c) })) };
}

// Cherche une commande et vérifie qu'elle appartient bien au client connecté
async function trouverMaCommande(idUtilisateur, id) {
  const commande = await commandeModel.trouverParId(id);
  if (!commande) return { success: false, error: 'COMMANDE_INTROUVABLE' };
  if (commande.id_utilisateur !== idUtilisateur) return { success: false, error: 'ACCES_REFUSE' };
  return { success: true, data: commande };
}

// BF20 : détail d'une de mes commandes
async function detail(idUtilisateur, id) {
  const r = await trouverMaCommande(idUtilisateur, id);
  if (!r.success) return r;
  const lignes = await commandeModel.listerLignes(id);
  const paiement = await commandeModel.trouverPaiement(id);
  return { success: true, data: { ...r.data, statut_affiche: statutAffiche(r.data), lignes, paiement } };
}

// BF20, RG41 : relance le paiement d'une commande « en attente »
async function relancerPaiement(idUtilisateur, id) {
  const r = await trouverMaCommande(idUtilisateur, id);
  if (!r.success) return r;
  if (r.data.statut !== 'en_attente') return { success: false, error: 'DEJA_TRAITEE' };
  try {
    const urlPaiement = await ouvrirPaiement(id, r.data.montant_total);
    return { success: true, data: { id_commande: id, url_paiement: urlPaiement } };
  } catch (erreurStripe) {
    // Stripe injoignable : la commande reste « en attente », le client pourra réessayer plus tard (RG41)
    console.error('Session Stripe impossible :', erreurStripe.message);
    return { success: false, error: 'PAIEMENT_INDISPONIBLE' };
  }
}

module.exports = { creer, lister, detail, relancerPaiement };
