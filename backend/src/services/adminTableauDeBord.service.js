// Service « tableau de bord » de l'administration : les 6 indicateurs de la page d'accueil (BF25).
const tableauModel = require('../models/tableauDeBord.model');

async function indicateurs() {
  const s = await tableauModel.lireIndicateurs();
  return {
    success: true,
    data: {
      a_traiter: Number(s.a_traiter),
      commandes_mois: Number(s.commandes_mois),
      ca_mois: Number(s.ca_mois),
      ruptures: Number(s.ruptures),
      bientot_expires: Number(s.bientot_expires),
      clients: Number(s.clients),
    },
  };
}

module.exports = { indicateurs };
