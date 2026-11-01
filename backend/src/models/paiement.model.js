// Modèle « paiement » : les requêtes SQL sur la table paiement.
// RG40 : aucune donnée bancaire n'est stockée, seulement la référence de la session Stripe.

// Le paiement est enregistré comme validé, avec la référence Stripe (sert au remboursement)
async function marquerValide(cx, idCommande, reference) {
  await cx.query(
    "UPDATE paiement SET statut = 'valide', date_paiement = NOW(), reference_transaction = ? WHERE id_commande = ?",
    [reference, idCommande]
  );
}

module.exports = { marquerValide };
