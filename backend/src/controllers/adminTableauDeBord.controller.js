// Contrôleur « tableau de bord » de l'administration.
const service = require('../services/adminTableauDeBord.service');

async function indicateurs(req, res, next) {
  try { res.json((await service.indicateurs()).data); } catch (e) { next(e); }
}

module.exports = { indicateurs };
