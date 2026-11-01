// Contrôleur « produits » de l'administration : lit la requête, appelle le service, choisit le code HTTP.
const service = require('../services/adminProduit.service');

// Réponses d'erreur du service, communes à l'ajout et à la modification
function repondreErreur(res, r) {
  switch (r.error) {
    case 'PRODUIT_INTROUVABLE': return res.status(404).json({ message: 'Produit introuvable' });
    case 'CATEGORIE_INCONNUE': return res.status(400).json({ message: 'Catégorie inconnue' });
    case 'PRODUIT_EXISTE':
      return res.status(409).json({ message: 'Ce produit existe déjà : cette photo est déjà utilisée par un autre produit' });
    case 'DATES_INCOHERENTES':
      return res.status(400).json({ message: 'La date d’expiration doit suivre la date de fabrication' });
    default: return null;
  }
}

async function lister(req, res, next) {
  try { res.json((await service.lister()).data); } catch (e) { next(e); }
}

async function obtenir(req, res, next) {
  try {
    const r = await service.obtenir(req.idValide);
    if (!r.success) return repondreErreur(res, r);
    res.json(r.data);
  } catch (e) { next(e); }
}

async function creer(req, res, next) {
  try {
    const r = await service.creer(req.body, req.file);
    if (!r.success) return repondreErreur(res, r);
    res.status(201).json({ id_produit: r.data.id_produit, message: 'Produit ajouté' });
  } catch (e) { next(e); }
}

async function modifier(req, res, next) {
  try {
    const r = await service.modifier(req.idValide, req.body, req.file);
    if (!r.success) return repondreErreur(res, r);
    res.json({ message: 'Produit modifié' });
  } catch (e) { next(e); }
}

async function supprimer(req, res, next) {
  try {
    const r = await service.supprimer(req.idValide);
    if (!r.success) return repondreErreur(res, r);
    res.json({
      message: r.data.desactive
        ? 'Produit déjà commandé : il a été désactivé et non supprimé'
        : 'Produit supprimé',
    });
  } catch (e) { next(e); }
}

module.exports = { lister, obtenir, creer, modifier, supprimer };
