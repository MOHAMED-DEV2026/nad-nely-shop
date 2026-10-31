// Modèle « catégorie » : les requêtes SQL sur la table categorie. Aucune règle métier ici.
const db = require('../config/db');

// Toutes les catégories, triées par nom
async function trouverToutes() {
  const [rows] = await db.query('SELECT id_categorie, nom, description FROM categorie ORDER BY nom');
  return rows;
}

module.exports = { trouverToutes };
