// Service « utilisateurs » de l'administration : liste des clients (BF24) et suppression d'un client sans commande.
const utilisateurModel = require('../models/utilisateur.model');

const PAR_PAGE = 20;

// « query » : recherche (nom, prénom ou e-mail) et page, tous deux facultatifs
async function lister(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const recherche = (query.recherche || '').trim();
  const { total, clients } = await utilisateurModel.chercherClients(recherche, page, PAR_PAGE);
  return {
    success: true,
    data: {
      total: Number(total),
      page,
      par_page: PAR_PAGE,
      utilisateurs: clients.map((c) => ({ ...c, nb_commandes: Number(c.nb_commandes) })),
    },
  };
}

// Un client ne peut être supprimé que s'il n'a passé aucune commande :
// ses commandes et paiements doivent rester dans l'historique. Un administrateur n'est jamais supprimé ici.
async function supprimer(id) {
  const compte = await utilisateurModel.trouverAvecNbCommandes(id);
  if (!compte || compte.role !== 'client') return { success: false, error: 'CLIENT_INTROUVABLE' };
  if (Number(compte.nb_commandes) > 0) return { success: false, error: 'CLIENT_AVEC_COMMANDES' };
  try {
    const nb = await utilisateurModel.supprimerClient(id);
    if (nb === 0) return { success: false, error: 'CLIENT_INTROUVABLE' };
  } catch (e) {
    // Une commande a pu être créée entre la vérification et la suppression : la clé étrangère bloque
    if (e.code === 'ER_ROW_IS_REFERENCED_2') return { success: false, error: 'CLIENT_AVEC_COMMANDES' };
    throw e;
  }
  return { success: true };
}

module.exports = { lister, supprimer };
