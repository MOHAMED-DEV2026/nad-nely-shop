// Modèle « produit » (partie catalogue public) : les requêtes SQL sur la table produit.
const db = require('../config/db');

// Le tri est choisi dans une liste fixe, jamais recopié depuis la requête (évite l'injection SQL)
const TRIS = {
  nouveautes: 'p.date_ajout DESC, p.id_produit DESC',
  prix_asc: 'p.prix ASC, p.id_produit ASC',
  prix_desc: 'p.prix DESC, p.id_produit ASC',
};

// RG15 : un produit est vendable s'il est actif, si son stock est supérieur à 0 et si sa date d'expiration n'est pas dépassée
const DISPONIBLE = '(p.stock > 0 AND (p.date_expiration IS NULL OR p.date_expiration >= CURDATE()))';

// Construit la partie WHERE à partir de filtres déjà nettoyés par le service
function construireFiltres(f) {
  const conditions = ['p.actif = 1'];
  const valeurs = [];
  if (f.recherche) { conditions.push('p.nom LIKE ?'); valeurs.push(`%${f.recherche}%`); }
  if (f.categorie) { conditions.push('p.id_categorie = ?'); valeurs.push(f.categorie); }
  if (f.prixMin !== null) { conditions.push('p.prix >= ?'); valeurs.push(f.prixMin); }
  if (f.prixMax !== null) { conditions.push('p.prix <= ?'); valeurs.push(f.prixMax); }
  if (f.marque) { conditions.push('p.marque = ?'); valeurs.push(f.marque); }
  if (f.origine) { conditions.push('p.origine = ?'); valeurs.push(f.origine); }
  if (f.public) { conditions.push('p.public_cible IN (?, ?)'); valeurs.push(f.public, 'mixte'); }
  return { where: conditions.join(' AND '), valeurs };
}

// Une page de produits du catalogue, avec le nombre total de résultats
async function chercher(filtres, tri, page, parPage) {
  const { where, valeurs } = construireFiltres(filtres);
  const ordre = TRIS[tri] || TRIS.nouveautes;

  const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM produit p WHERE ${where}`, valeurs);
  const [rows] = await db.query(
    `SELECT p.id_produit, p.nom, p.prix, p.stock, p.image, p.marque, p.origine, p.date_expiration,
            c.nom AS categorie, ${DISPONIBLE} AS disponible
     FROM produit p JOIN categorie c ON c.id_categorie = p.id_categorie
     WHERE ${where}
     ORDER BY ${ordre}
     LIMIT ? OFFSET ?`,
    [...valeurs, parPage, (page - 1) * parPage]
  );
  return { total, produits: rows };
}

// Marques et origines existantes (produits actifs), pour les listes de filtres
async function listerMarques() {
  const [rows] = await db.query(
    'SELECT DISTINCT marque FROM produit WHERE actif = 1 AND marque IS NOT NULL ORDER BY marque');
  return rows.map((r) => r.marque);
}

async function listerOrigines() {
  const [rows] = await db.query(
    'SELECT DISTINCT origine FROM produit WHERE actif = 1 AND origine IS NOT NULL ORDER BY origine');
  return rows.map((r) => r.origine);
}

// Un produit actif par son identifiant, ou null s'il n'existe pas
async function trouverActifParId(id) {
  const [rows] = await db.query(
    `SELECT p.*, c.nom AS categorie, ${DISPONIBLE} AS disponible
     FROM produit p JOIN categorie c ON c.id_categorie = p.id_categorie
     WHERE p.id_produit = ? AND p.actif = 1`,
    [id]
  );
  return rows[0] ?? null;
}

// RG38 : retire du stock la quantité commandée (dans une transaction, avec la connexion « cx »)
async function decrementerStock(cx, idProduit, quantite) {
  await cx.query('UPDATE produit SET stock = stock - ? WHERE id_produit = ?', [quantite, idProduit]);
}

// ----- Partie administration -----

// Tous les produits, actifs ou non (BF09 à BF11)
async function listerTous() {
  const [rows] = await db.query(
    `SELECT p.*, c.nom AS categorie FROM produit p
     JOIN categorie c ON c.id_categorie = p.id_categorie
     ORDER BY p.id_produit DESC`
  );
  return rows;
}

// Un produit (actif ou non), ou null
async function trouverParId(id) {
  const [rows] = await db.query('SELECT * FROM produit WHERE id_produit = ?', [id]);
  return rows[0] ?? null;
}

// Crée un produit et renvoie son identifiant
async function creer(p) {
  const [r] = await db.query(
    `INSERT INTO produit (nom, description, prix, stock, image, id_categorie,
                          date_fabrication, date_expiration, marque, origine, public_cible)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [p.nom, p.description, p.prix, p.stock, p.image, p.idCategorie,
     p.dateFabrication, p.dateExpiration, p.marque, p.origine, p.publicCible]
  );
  return r.insertId;
}

// Modifie un produit et renvoie le nombre de lignes touchées (0 = introuvable).
// Une valeur null pour image, publicCible ou actif veut dire « ne pas changer » (COALESCE).
async function modifier(id, p) {
  const [r] = await db.query(
    `UPDATE produit SET nom = ?, description = ?, prix = ?, stock = ?,
            image = COALESCE(?, image), id_categorie = ?, date_fabrication = ?,
            date_expiration = ?, marque = ?, origine = ?, public_cible = COALESCE(?, public_cible), actif = COALESCE(?, actif)
     WHERE id_produit = ?`,
    [p.nom, p.description, p.prix, p.stock, p.image, p.idCategorie,
     p.dateFabrication, p.dateExpiration, p.marque, p.origine, p.publicCible, p.actif, id]
  );
  return r.affectedRows;
}

// RG13 : un produit déjà commandé ne peut pas être supprimé
async function estCommande(id) {
  const [rows] = await db.query('SELECT 1 FROM ligne_commande WHERE id_produit = ? LIMIT 1', [id]);
  return rows.length > 0;
}

async function desactiver(id) {
  await db.query('UPDATE produit SET actif = 0 WHERE id_produit = ?', [id]);
}

// Supprime un produit et renvoie le nombre de lignes touchées
async function supprimer(id) {
  const [r] = await db.query('DELETE FROM produit WHERE id_produit = ?', [id]);
  return r.affectedRows;
}

module.exports = {
  chercher, listerMarques, listerOrigines, trouverActifParId, decrementerStock,
  listerTous, trouverParId, creer, modifier, estCommande, desactiver, supprimer,
};
