// Modèle « catégorie » : les requêtes SQL sur la table categorie. Aucune règle métier ici.
const db = require('../config/db');

// Toutes les catégories, triées par nom (avec leur photo, pour la page d'accueil)
async function trouverToutes() {
  const [rows] = await db.query('SELECT id_categorie, nom, description, image FROM categorie ORDER BY nom');
  return rows;
}

// ----- Partie administration -----

// Une catégorie, ou null
async function trouverParId(id) {
  const [rows] = await db.query('SELECT id_categorie, nom, description, image FROM categorie WHERE id_categorie = ?', [id]);
  return rows[0] ?? null;
}

// Les catégories avec le nombre de produits, actifs ou non (BF12)
async function listerAvecNbProduits() {
  const [rows] = await db.query(
    `SELECT c.id_categorie, c.nom, c.description, c.image, COUNT(p.id_produit) AS nb_produits
     FROM categorie c LEFT JOIN produit p ON p.id_categorie = c.id_categorie
     GROUP BY c.id_categorie ORDER BY c.nom`
  );
  return rows;
}

async function creer(nom, description, image) {
  const [r] = await db.query(
    'INSERT INTO categorie (nom, description, image) VALUES (?, ?, ?)', [nom, description || null, image || null]);
  return r.insertId;
}

// Renvoie le nombre de lignes touchées (0 = introuvable).
// « image » : undefined = ne pas changer la photo, null = retirer la photo, texte = nouvelle photo.
async function modifier(id, nom, description, image) {
  const changerImage = image !== undefined;
  const [r] = await db.query(
    `UPDATE categorie SET nom = ?, description = ?${changerImage ? ', image = ?' : ''} WHERE id_categorie = ?`,
    changerImage ? [nom, description || null, image, id] : [nom, description || null, id]
  );
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

module.exports = { trouverToutes, trouverParId, listerAvecNbProduits, creer, modifier, aDesProduits, supprimer };
