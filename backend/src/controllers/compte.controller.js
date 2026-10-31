// Contrôleur « compte » : lit la requête, appelle le service, choisit le code HTTP.
const compteService = require('../services/compte.service');

async function lire(req, res, next) {
  try {
    const r = await compteService.lire(req.user.id);
    if (!r.success) return res.status(404).json({ message: 'Compte introuvable' });
    res.json(r.data);
  } catch (e) { next(e); }
}

async function modifier(req, res, next) {
  try {
    const r = await compteService.modifier(req.user.id, req.body);
    res.json({ message: 'Informations mises à jour', ...r.data });
  } catch (e) { next(e); }
}

async function changerMotDePasse(req, res, next) {
  try {
    const r = await compteService.changerMotDePasse(req.user.id, req.body);
    if (r.error === 'COMPTE_INTROUVABLE') return res.status(404).json({ message: 'Compte introuvable' });
    if (r.error === 'MOT_DE_PASSE_INCORRECT') return res.status(400).json({ message: 'Le mot de passe actuel est incorrect' });
    res.json({ message: 'Mot de passe modifié' });
  } catch (e) { next(e); }
}

module.exports = { lire, modifier, changerMotDePasse };
