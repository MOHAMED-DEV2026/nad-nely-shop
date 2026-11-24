// Contrôleur « utilisateurs » de l'administration : lit la requête, appelle le service, choisit le code HTTP.
const service = require('../services/adminUtilisateur.service');

function repondreErreur(res, r) {
  switch (r.error) {
    case 'CLIENT_INTROUVABLE': return res.status(404).json({ message: 'Client introuvable' });
    case 'CLIENT_AVEC_COMMANDES':
      return res.status(409).json({ message: 'Suppression impossible : ce client a déjà passé des commandes' });
    default: return null;
  }
}

async function lister(req, res, next) {
  try { res.json((await service.lister(req.query)).data); } catch (e) { next(e); }
}

async function supprimer(req, res, next) {
  try {
    const r = await service.supprimer(req.idValide);
    if (!r.success) return repondreErreur(res, r);
    res.json({ message: 'Client supprimé' });
  } catch (e) { next(e); }
}

module.exports = { lister, supprimer };
