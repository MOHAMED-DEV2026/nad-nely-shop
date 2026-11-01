// Modèle « commandes » de l'administration : les requêtes SQL de lecture (liste, détail)
// et la remise en stock lors d'une annulation. Pour verrouiller une commande ou changer son statut,
// on utilise commande.model.js (verrouillerStatut, changerStatut).
const db = require('../config/db');

// Une page de commandes, avec le nombre total de résultats. « f » contient des filtres déjà nettoyés.
async function chercher(f, page, parPage) {
  const conditions = ['1 = 1'];
  const valeurs = [];
  if (f.statut) { conditions.push('c.statut = ?'); valeurs.push(f.statut); }
  if (f.du) { conditions.push('DATE(c.date_commande) >= ?'); valeurs.push(f.du); }
  if (f.au) { conditions.push('DATE(c.date_commande) <= ?'); valeurs.push(f.au); }
  if (f.client) {
    conditions.push('(u.nom LIKE ? OR u.prenom LIKE ? OR u.email LIKE ?)');
    const m = `%${f.client}%`;
    valeurs.push(m, m, m);
  }
  const where = conditions.join(' AND ');

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total FROM commande c JOIN utilisateur u ON u.id_utilisateur = c.id_utilisateur WHERE ${where}`,
    valeurs
  );
  const [rows] = await db.query(
    `SELECT c.id_commande, c.date_commande, c.mode_reception, c.commune_livraison, c.montant_total,
            c.statut, u.nom, u.prenom, u.email
     FROM commande c JOIN utilisateur u ON u.id_utilisateur = c.id_utilisateur
     WHERE ${where}
     ORDER BY c.date_commande DESC, c.id_commande DESC
     LIMIT ? OFFSET ?`,
    [...valeurs, parPage, (page - 1) * parPage]
  );
  return { total, commandes: rows };
}

// Une commande avec les coordonnées du client, ou null
async function trouverDetail(id) {
  const [rows] = await db.query(
    `SELECT c.*, u.nom, u.prenom, u.email, u.telephone
     FROM commande c JOIN utilisateur u ON u.id_utilisateur = c.id_utilisateur
     WHERE c.id_commande = ?`,
    [id]
  );
  return rows[0] ?? null;
}

async function listerLignes(id) {
  const [rows] = await db.query(
    `SELECT l.id_produit, p.nom AS produit, l.quantite, l.prix_unitaire,
            (l.quantite * l.prix_unitaire) AS sous_total
     FROM ligne_commande l JOIN produit p ON p.id_produit = l.id_produit
     WHERE l.id_commande = ?`,
    [id]
  );
  return rows;
}

async function trouverPaiement(id) {
  const [rows] = await db.query(
    'SELECT statut, moyen, reference_transaction, date_paiement FROM paiement WHERE id_commande = ?', [id]
  );
  return rows[0] ?? null;
}

// Remet en stock les quantités d'une commande annulée (dans une transaction, avec la connexion « cx »)
async function remettreStock(cx, id) {
  await cx.query(
    `UPDATE produit p JOIN ligne_commande l ON l.id_produit = p.id_produit
     SET p.stock = p.stock + l.quantite WHERE l.id_commande = ?`,
    [id]
  );
}

module.exports = { chercher, trouverDetail, listerLignes, trouverPaiement, remettreStock };
