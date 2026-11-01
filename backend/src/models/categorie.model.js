// Modèle « catégorie » : les requêtes SQL sur la table categorie. Aucune règle métier ici.
const db = require('../config/db');

// Toutes les catégories, triées par nom
async function trouverToutes() {
  const [rows] = await db.query('SELECT id_categorie, nom, description FROM categorie ORDER BY nom');
  return rows;
}

// ----- Partie administration -----

// Les catégories avec le nombre de produits, actifs ou non (BF12)
async function listerAvecNbProduits() {
  const [rows] = await db.query(
    `SELECT c.id_categorie, c.nom, c.description, COUNT(p.id_produit) AS nb_produits
     FROM categorie c LEFT JOIN produit p ON p.id_categorie = c.id_categorie
     GROUP BY c.id_categorie ORDER BY c.nom`
  );
  return rows;
}

async function creer(nom, description) {
  const [r] = await db.query('INSERT INTO categorie (nom, description) VALUES (?, ?)', [nom, description || null]);
  return r.insertId;
}

// Renvoie le nombre de lignes touchées (0 = introuvable)
async function modifier(id, nom, description) {
  const [r] = await db.query(
    'UPDATE categorie SET nom = ?, description = ? WHERE id_categorie = ?', [nom, description || null, id]);
  return r.affectedRows;
}

// Vrai si au moins un produit (actif ou non) est rattaché à la catégorie
async function aDesProduits(id) {
  const [rows] = await db.query('SELECT 1 FROM produit WHERE id_categorie = ? LIMIT 1', [id]);
  return rows.length > 0;
}

async function supprimer(id) {
  const [r] = await db.query('DELETE FROM categorie WHERE id_categorie = ?', [id]);
  return r.affectedRows;
}

module.exports = { trouverToutes, listerAvecNbProduits, creer, modifier, aDesProduits, supprimer };
