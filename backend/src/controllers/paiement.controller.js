// Contrôleur « paiement » : lit la requête, appelle le service, choisit le code HTTP.
const paiementService = require('../services/paiement.service');

async function verifier(req, res, next) {
  try {
    const r = await paiementService.verifier(req.user.id, req.body.session_id);
    if (r.success) return res.json(r.data);

    switch (r.error) {
      case 'SESSION_INTROUVABLE': return res.status(404).json({ message: 'Session de paiement introuvable' });
      case 'COMMANDE_INTROUVABLE': return res.status(404).json({ message: 'Commande introuvable' });
      case 'ACCES_REFUSE': return res.status(403).json({ message: 'Accès refusé' });
      case 'PAIEMENT_NON_ABOUTI':
        return res.status(409).json({ message: 'Le paiement n’a pas abouti', statut: r.data.statut });
      case 'MONTANT_INCORRECT':
        return res.status(409).json({ message: 'Le montant payé ne correspond pas à la commande' });
      case 'STOCK_DEVENU_INSUFFISANT':
        return res.status(409).json({
          message: 'Stock devenu insuffisant : la commande est annulée. Le remboursement se fait manuellement depuis Stripe.',
          id_commande: r.data.id_commande,
          statut: r.data.statut,
        });
      default: return next(new Error(`Erreur de paiement inattendue : ${r.error}`));
    }
  } catch (e) { next(e); }
}

module.exports = { verifier };
