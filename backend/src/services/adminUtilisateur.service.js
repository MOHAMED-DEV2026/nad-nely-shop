// Service « utilisateurs » de l'administration : liste des clients, en consultation seule (BF24).
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

module.exports = { lister };
