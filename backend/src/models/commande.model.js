// Modèle « commande » (côté client) : les requêtes SQL sur commande, ligne_commande et paiement.
// Les fonctions qui reçoivent « cx » s'utilisent dans une transaction (voir transaction.js).
const db = require('../config/db');

// Verrouille et lit les produits demandés (FOR UPDATE : personne d'autre ne les modifie pendant la vérification)
async function verrouillerProduits(cx, ids) {
  const [rows] = await cx.query(
    `SELECT id_produit, nom, prix, stock, actif,
            (date_expiration IS NOT NULL AND date_expiration < CURDATE()) AS expire
     FROM produit WHERE id_produit IN (?) FOR UPDATE`,
    [ids]
  );
  return rows;
}

// Crée la commande et renvoie son identifiant
async function inserer(cx, c) {
  const [r] = await cx.query(
    `INSERT INTO commande (id_utilisateur, mode_reception, adresse_livraison, commune_livraison,
                           telephone_contact, montant_total)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [c.idUtilisateur, c.modeReception, c.adresseLivraison, c.communeLivraison, c.telephoneContact, c.montantTotal]
  );
  return r.insertId;
}

// Le prix est figé au moment de l'achat
async function insererLigne(cx, idCommande, idProduit, quantite, prixUnitaire) {
  await cx.query(
    'INSERT INTO ligne_commande (id_commande, id_produit, quantite, prix_unitaire) VALUES (?, ?, ?, ?)',
    [idCommande, idProduit, quantite, prixUnitaire]
  );
}

async function insererPaiement(cx, idCommande, montant) {
  await cx.query('INSERT INTO paiement (id_commande, montant) VALUES (?, ?)', [idCommande, montant]);
}

// Les commandes d'un client, de la plus récente à la plus ancienne
async function listerParUtilisateur(idUtilisateur) {
  const [rows] = await db.query(
    `SELECT id_commande, date_commande, mode_reception, montant_total, statut
     FROM commande WHERE id_utilisateur = ? ORDER BY date_commande DESC, id_commande DESC`,
    [idUtilisateur]
  );
  return rows;
}

async function trouverParId(id) {
  const [rows] = await db.query('SELECT * FROM commande WHERE id_commande = ?', [id]);
  return rows[0] ?? null;
}

async function listerLignes(idCommande) {
  const [rows] = await db.query(
    `SELECT l.id_produit, p.nom, l.quantite, l.prix_unitaire,
            (l.quantite * l.prix_unitaire) AS sous_total
     FROM ligne_commande l JOIN produit p ON p.id_produit = l.id_produit
     WHERE l.id_commande = ?`,
    [idCommande]
  );
  return rows;
}

async function trouverPaiement(idCommande) {
  const [rows] = await db.query('SELECT statut, date_paiement FROM paiement WHERE id_commande = ?', [idCommande]);
  return rows[0] ?? null;
}

// Verrouille une commande (FOR UPDATE) et renvoie son statut, ou null si elle n'existe pas
async function verrouillerStatut(cx, id) {
  const [rows] = await cx.query('SELECT statut FROM commande WHERE id_commande = ? FOR UPDATE', [id]);
  return rows[0]?.statut ?? null;
}

// Verrouille les produits d'une commande, avec leur stock actuel (RG39)
async function verrouillerLignesAvecStock(cx, idCommande) {
  const [rows] = await cx.query(
    `SELECT lc.id_produit, lc.quantite, p.stock
       FROM ligne_commande lc JOIN produit p ON p.id_produit = lc.id_produit
      WHERE lc.id_commande = ? FOR UPDATE`,
    [idCommande]
  );
  return rows;
}

async function changerStatut(cx, id, statut) {
  await cx.query('UPDATE commande SET statut = ? WHERE id_commande = ?', [statut, id]);
}

module.exports = {
  verrouillerStatut, verrouillerLignesAvecStock, changerStatut,
  verrouillerProduits, inserer, insererLigne, insererPaiement,
  listerParUtilisateur, trouverParId, listerLignes, trouverPaiement,
};
