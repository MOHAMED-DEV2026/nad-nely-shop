// Contrôleur « catégories » de l'administration : lit la requête, appelle le service, choisit le code HTTP.
const service = require('../services/adminCategorie.service');

function repondreErreur(res, r) {
  switch (r.error) {
    case 'CATEGORIE_INTROUVABLE': return res.status(404).json({ message: 'Catégorie introuvable' });
    case 'NOM_DEJA_UTILISE': return res.status(409).json({ message: 'Ce nom de catégorie existe déjà' });
    case 'CATEGORIE_UTILISEE':
      return res.status(409).json({ message: 'Suppression impossible : des produits sont rattachés à cette catégorie' });
    default: return null;
  }
}

async function lister(req, res, next) {
  try { res.json((await service.lister()).data); } catch (e) { next(e); }
}

async function creer(req, res, next) {
  try {
    const r = await service.creer(req.body, req.file);
    if (!r.success) return repondreErreur(res, r);
    res.status(201).json({ id_categorie: r.data.id_categorie, message: 'Catégorie ajoutée' });
  } catch (e) { next(e); }
}

async function modifier(req, res, next) {
  try {
    const r = await service.modifier(req.idValide, req.body, req.file);
    if (!r.success) return repondreErreur(res, r);
    res.json({ message: 'Catégorie modifiée' });
  } catch (e) { next(e); }
}

async function supprimer(req, res, next) {
  try {
    const r = await service.supprimer(req.idValide);
    if (!r.success) return repondreErreur(res, r);
    res.json({ message: 'Catégorie supprimée' });
  } catch (e) { next(e); }
}

module.exports = { lister, creer, modifier, supprimer };
