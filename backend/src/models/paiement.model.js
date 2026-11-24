// Modèle « paiement » : les requêtes SQL sur la table paiement.
// RG40 : aucune donnée bancaire n'est stockée, seulement la référence de la session Stripe.
const db = require('../config/db');

// Le paiement est enregistré comme validé, avec la référence Stripe (sert au remboursement)
async function marquerValide(cx, idCommande, reference) {
  await cx.query(
    "UPDATE paiement SET statut = 'valide', date_paiement = NOW(), reference_transaction = ? WHERE id_commande = ?",
    [reference, idCommande]
  );
}

// RG35 : un seul paiement par commande, la référence de la session Stripe est mise à jour à chaque tentative
async function enregistrerReference(idCommande, reference) {
  await db.query('UPDATE paiement SET reference_transaction = ? WHERE id_commande = ?', [reference, idCommande]);
}

// Paiement arrivé après l'annulation de la commande par l'administrateur : on garde la trace
// pour pouvoir rembourser le client (sans toucher à un paiement déjà validé).
// Renvoie true si le paiement vient d'être enregistré, false s'il l'était déjà.
async function marquerValideTardif(cx, idCommande, reference) {
  const [r] = await cx.query(
    "UPDATE paiement SET statut = 'valide', date_paiement = NOW(), reference_transaction = ? WHERE id_commande = ? AND statut <> 'valide'",
    [reference, idCommande]
  );
  return r.affectedRows > 0;
}

module.exports = { marquerValide, enregistrerReference, marquerValideTardif };
