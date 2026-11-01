// Service « produits » de l'administration : ajout, modification, suppression (BF09 à BF11).
// Il ne connaît ni req ni res. Chaque fonction renvoie { success, error, data }.
const produitModel = require('../models/produit.model');
const { supprimerImage, empreinte } = require('../utils/fichiers');

async function lister() {
  return { success: true, data: await produitModel.listerTous() };
}

// BF10 : un produit, pour pré-remplir le formulaire de modification
async function obtenir(id) {
  const produit = await produitModel.trouverParId(id);
  if (!produit) return { success: false, error: 'PRODUIT_INTROUVABLE' };
  return { success: true, data: produit };
}

function datesIncoherentes(b) {
  return b.date_fabrication && b.date_expiration && b.date_fabrication >= b.date_expiration;
}

// Transforme le corps du formulaire en données prêtes pour le modèle
function preparer(b, fichier) {
  return {
    nom: b.nom,
    description: b.description,
    prix: b.prix,
    stock: b.stock,
    image: fichier ? fichier.filename : null,
    idCategorie: b.id_categorie,
    dateFabrication: b.date_fabrication || null,
    dateExpiration: b.date_expiration || null,
    marque: b.marque || null,
    origine: b.origine || null,
  };
}

// Doublon = la même photo est déjà utilisée par un autre produit (on compare le contenu des images).
// Deux produits peuvent avoir le même nom, le même prix ou la même origine, mais pas la même photo.
// « sauf » = produit à ignorer (cas de la modification).
async function photoDejaUtilisee(fichier, sauf = 0) {
  if (!fichier) return false;
  const nouvelle = empreinte(fichier.filename);
  if (!nouvelle) return false;
  const produits = await produitModel.listerTous();
  return produits.some((p) => p.id_produit !== sauf && p.image && empreinte(p.image) === nouvelle);
}

// Refus : l'image déjà enregistrée par l'envoi est supprimée, pour ne pas laisser de fichier orphelin
function refuser(fichier, erreur) {
  if (fichier) supprimerImage(fichier.filename);
  return { success: false, error: erreur };
}

// BF09 : ajout, avec image facultative
async function creer(b, fichier) {
  if (datesIncoherentes(b)) return refuser(fichier, 'DATES_INCOHERENTES');
  if (await photoDejaUtilisee(fichier)) return refuser(fichier, 'PRODUIT_EXISTE');
  try {
    const id = await produitModel.creer({ ...preparer(b, fichier), publicCible: b.public_cible || 'mixte' });
    return { success: true, data: { id_produit: id } };
  } catch (e) {
    if (e.code === 'ER_NO_REFERENCED_ROW_2') return { success: false, error: 'CATEGORIE_INCONNUE' };
    throw e;
  }
}

// BF10 : modification (l'image n'est remplacée que si une nouvelle est envoyée)
async function modifier(id, b, fichier) {
  if (datesIncoherentes(b)) return refuser(fichier, 'DATES_INCOHERENTES');
  if (await photoDejaUtilisee(fichier, Number(id))) return refuser(fichier, 'PRODUIT_EXISTE');
  try {
    const touchees = await produitModel.modifier(id, {
      ...preparer(b, fichier),
      publicCible: b.public_cible || null,
      actif: b.actif === undefined ? null : b.actif,
    });
    if (touchees === 0) return { success: false, error: 'PRODUIT_INTROUVABLE' };
    return { success: true };
  } catch (e) {
    if (e.code === 'ER_NO_REFERENCED_ROW_2') return { success: false, error: 'CATEGORIE_INCONNUE' };
    throw e;
  }
}

// BF11, RG13 : un produit déjà commandé n'est jamais supprimé, il est désactivé
async function supprimer(id) {
  if (await produitModel.estCommande(id)) {
    await produitModel.desactiver(id);
    return { success: true, data: { desactive: true } };
  }
  const produit = await produitModel.trouverParId(id);
  const touchees = await produitModel.supprimer(id);
  if (touchees === 0) return { success: false, error: 'PRODUIT_INTROUVABLE' };
  if (produit) supprimerImage(produit.image);
  return { success: true, data: { desactive: false } };
}

module.exports = { lister, obtenir, creer, modifier, supprimer };
