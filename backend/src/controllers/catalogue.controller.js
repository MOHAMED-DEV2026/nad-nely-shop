// Contrôleur « catalogue » : lit la requête, appelle le service, choisit le code HTTP de la réponse.
const catalogueService = require('../services/catalogue.service');

async function listerCategories(req, res, next) {
  try {
    const resultat = await catalogueService.listerCategories();
    res.json(resultat.data);
  } catch (e) { next(e); }
}

async function listerProduits(req, res, next) {
  try {
    const resultat = await catalogueService.listerProduits(req.query);
    res.json(resultat.data);
  } catch (e) { next(e); }
}

async function listerFiltres(req, res, next) {
  try {
    const resultat = await catalogueService.listerFiltres();
    res.json(resultat.data);
  } catch (e) { next(e); }
}

async function obtenirProduit(req, res, next) {
  try {
    const resultat = await catalogueService.obtenirProduit(req.idValide);
    if (!resultat.success) return res.status(404).json({ message: 'Produit introuvable' });
    res.json(resultat.data);
  } catch (e) { next(e); }
}

module.exports = { listerCategories, listerProduits, listerFiltres, obtenirProduit };
