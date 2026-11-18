// Service « catégories » de l'administration (BF12), avec la photo affichée sur la page d'accueil.
// Il ne connaît ni req ni res. Chaque fonction renvoie { success, error, data }.
const categorieModel = require('../models/categorie.model');
const { supprimerImage } = require('../utils/fichiers');

// Refus : la photo déjà enregistrée par l'envoi est supprimée, pour ne pas laisser de fichier orphelin
function refuser(fichier, erreur) {
  if (fichier) supprimerImage(fichier.filename);
  return { success: false, error: erreur };
}

async function lister() {
  return { success: true, data: await categorieModel.listerAvecNbProduits() };
}

// Photo facultative
async function creer({ nom, description }, fichier) {
  try {
    const id = await categorieModel.creer(nom, description, fichier ? fichier.filename : null);
    return { success: true, data: { id_categorie: id } };
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return refuser(fichier, 'NOM_DEJA_UTILISE');
    if (fichier) supprimerImage(fichier.filename);
    throw e;
  }
}

// La photo n'est remplacée que si une nouvelle est envoyée ; « retirer_image » enlève la photo actuelle
async function modifier(id, { nom, description, retirer_image }, fichier) {
  const ancienne = await categorieModel.trouverParId(id);
  if (!ancienne) return refuser(fichier, 'CATEGORIE_INTROUVABLE');

  let image; // undefined = on garde la photo actuelle
  if (fichier) image = fichier.filename;
  else if (retirer_image === '1' || retirer_image === 'true') image = null;

  try {
    const touchees = await categorieModel.modifier(id, nom, description, image);
    if (touchees === 0) return refuser(fichier, 'CATEGORIE_INTROUVABLE');
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return refuser(fichier, 'NOM_DEJA_UTILISE');
    if (fichier) supprimerImage(fichier.filename);
    throw e;
  }
  // L'ancienne photo, remplacée ou retirée, est supprimée du disque
  if (image !== undefined && ancienne.image) supprimerImage(ancienne.image);
  return { success: true };
}

// Seulement si aucun produit (actif ou non) n'est rattaché à la catégorie
async function supprimer(id) {
  if (await categorieModel.aDesProduits(id)) return { success: false, error: 'CATEGORIE_UTILISEE' };
  const categorie = await categorieModel.trouverParId(id);
  const touchees = await categorieModel.supprimer(id);
  if (touchees === 0) return { success: false, error: 'CATEGORIE_INTROUVABLE' };
  if (categorie && categorie.image) supprimerImage(categorie.image);
  return { success: true };
}

module.exports = { lister, creer, modifier, supprimer };
