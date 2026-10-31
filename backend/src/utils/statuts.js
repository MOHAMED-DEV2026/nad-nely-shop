// Libellés des statuts de commande, et règle RG34 sur l'affichage pour un retrait.
const LIBELLES = {
  en_attente: 'En attente', confirmee: 'Confirmée', expediee: 'Expédiée', livree: 'Livrée', annulee: 'Annulée',
};

// RG34 : pour un retrait, « expédiée » s'affiche « Prête à retirer » et « livrée » s'affiche « Retirée »
function statutAffiche(commande) {
  if (commande.mode_reception === 'retrait') {
    if (commande.statut === 'expediee') return 'Prête à retirer';
    if (commande.statut === 'livree') return 'Retirée';
  }
  return LIBELLES[commande.statut];
}

module.exports = { LIBELLES, statutAffiche };
