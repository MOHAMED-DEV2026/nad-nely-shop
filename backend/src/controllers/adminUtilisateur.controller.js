// Contrôleur « utilisateurs » de l'administration.
const service = require('../services/adminUtilisateur.service');

async function lister(req, res, next) {
  try { res.json((await service.lister(req.query)).data); } catch (e) { next(e); }
}

module.exports = { lister };
