// Service « catégories » de l'administration (BF12).
// Il ne connaît ni req ni res. Chaque fonction renvoie { success, error, data }.
const categorieModel = require('../models/categorie.model');

async function lister() {
  return { success: true, data: await categorieModel.listerAvecNbProduits() };
}

async function creer({ nom, description }) {
  try {
    const id = await categorieModel.creer(nom, description);
    return { success: true, data: { id_categorie: id } };
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return { success: false, error: 'NOM_DEJA_UTILISE' };
    throw e;
  }
}

async function modifier(id, { nom, description }) {
  try {
    const touchees = await categorieModel.modifier(id, nom, description);
    if (touchees === 0) return { success: false, error: 'CATEGORIE_INTROUVABLE' };
    return { success: true };
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return { success: false, error: 'NOM_DEJA_UTILISE' };
    throw e;
  }
}

// Seulement si aucun produit (actif ou non) n'est rattaché à la catégorie
async function supprimer(id) {
  if (await categorieModel.aDesProduits(id)) return { success: false, error: 'CATEGORIE_UTILISEE' };
  const touchees = await categorieModel.supprimer(id);
  if (touchees === 0) return { success: false, error: 'CATEGORIE_INTROUVABLE' };
  return { success: true };
}

module.exports = { lister, creer, modifier, supprimer };
