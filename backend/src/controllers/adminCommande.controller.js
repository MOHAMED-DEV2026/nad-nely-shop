// Contrôleur « commandes » de l'administration : lit la requête, appelle le service, choisit le code HTTP.
const service = require('../services/adminCommande.service');
const { LIBELLES } = require('../utils/statuts');

async function lister(req, res, next) {
  try { res.json((await service.lister(req.query)).data); } catch (e) { next(e); }
}

async function obtenir(req, res, next) {
  try {
    const r = await service.obtenir(req.idValide);
    if (!r.success) return res.status(404).json({ message: 'Commande introuvable' });
    res.json(r.data);
  } catch (e) { next(e); }
}

async function changerStatut(req, res, next) {
  try {
    const r = await service.changerStatut(req.idValide, req.body.action);
    if (!r.success) {
      switch (r.error) {
        case 'COMMANDE_INTROUVABLE': return res.status(404).json({ message: 'Commande introuvable' });
        case 'AVANCE_IMPOSSIBLE':
          return res.status(409).json({ message: `Cette commande ne peut pas avancer (statut : ${LIBELLES[r.data.statut]})` });
        case 'ANNULATION_IMPOSSIBLE':
          return res.status(409).json({ message: `Cette commande ne peut plus être annulée (statut : ${LIBELLES[r.data.statut]})` });
        default: return next(new Error(r.error));
      }
    }
    if (r.data.annule) {
      return res.json({
        message: 'Commande annulée. Le remboursement éventuel se fait manuellement depuis Stripe.',
        statut: 'annulee',
      });
    }
    res.json({ message: 'Statut mis à jour', statut: r.data.statut });
  } catch (e) { next(e); }
}

module.exports = { lister, obtenir, changerStatut };
