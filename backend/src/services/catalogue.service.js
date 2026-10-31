// Service « catalogue » : la logique métier. Il ne connaît ni req ni res (c'est le travail du contrôleur).
// Chaque fonction renvoie { success, error, data }.
const categorieModel = require('../models/categorie.model');
const produitModel = require('../models/produit.model');

const PAR_PAGE = 6;

// Transforme une valeur de la requête en nombre, ou null si elle est vide ou invalide
function enNombre(valeur) {
  if (valeur === undefined || valeur === '' || isNaN(valeur)) return null;
  return Number(valeur);
}

async function listerCategories() {
  const categories = await categorieModel.trouverToutes();
  return { success: true, data: categories };
}

// BF06, BF07 : recherche, filtres, tri et pagination
async function listerProduits(q) {
  const categorie = Number(q.categorie);
  const filtres = {
    recherche: q.recherche || '',
    categorie: categorie > 0 ? categorie : null,
    prixMin: enNombre(q.prixMin),
    prixMax: enNombre(q.prixMax),
    marque: q.marque || '',
    origine: q.origine || '',
    public: q.public === 'femme' || q.public === 'homme' ? q.public : null,
  };
  const page = Math.max(1, parseInt(q.page, 10) || 1);

  const { total, produits } = await produitModel.chercher(filtres, q.tri, page, PAR_PAGE);
  return {
    success: true,
    data: {
      total,
      page,
      par_page: PAR_PAGE,
      produits: produits.map((p) => ({ ...p, disponible: Boolean(p.disponible) })),
    },
  };
}

// BF07 : valeurs possibles pour les listes de filtres
async function listerFiltres() {
  const marques = await produitModel.listerMarques();
  const origines = await produitModel.listerOrigines();
  return { success: true, data: { marques, origines } };
}

// BF08 : fiche d'un produit actif
async function obtenirProduit(id) {
  const produit = await produitModel.trouverActifParId(id);
  if (!produit) return { success: false, error: 'PRODUIT_INTROUVABLE' };
  return { success: true, data: { ...produit, disponible: Boolean(produit.disponible) } };
}

module.exports = { listerCategories, listerProduits, listerFiltres, obtenirProduit };
