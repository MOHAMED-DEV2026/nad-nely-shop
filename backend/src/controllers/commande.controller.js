// Contrôleur « commande » (côté client) : lit la requête, appelle le service, choisit le code HTTP.
const commandeService = require('../services/commande.service');

// Réponses d'erreur communes aux routes qui cherchent une commande
function repondreErreurCommande(res, r) {
  if (r.error === 'COMMANDE_INTROUVABLE') return res.status(404).json({ message: 'Commande introuvable' });
  if (r.error === 'ACCES_REFUSE') return res.status(403).json({ message: 'Accès refusé' });
  if (r.error === 'DEJA_TRAITEE') {
    return res.status(409).json({ message: 'Cette commande n’est plus en attente de paiement' });
  }
  if (r.error === 'PAIEMENT_INDISPONIBLE') {
    return res.status(503).json({
      message: 'Le paiement est momentanément indisponible. Votre commande est enregistrée : vous pourrez la payer depuis « Mes commandes ».',
    });
  }
  return null;
}

async function creer(req, res, next) {
  try {
    const r = await commandeService.creer(req.user.id, req.body);
    if (r.error === 'PRODUIT_INDISPONIBLE') return res.status(409).json({ message: `Produit indisponible : ${r.nom}` });
    if (r.error === 'STOCK_INSUFFISANT') return res.status(409).json({ message: `Stock insuffisant pour : ${r.nom}` });
    res.status(201).json(r.data);
  } catch (e) { next(e); }
}

async function lister(req, res, next) {
  try {
    const r = await commandeService.lister(req.user.id);
    res.json(r.data);
  } catch (e) { next(e); }
}

async function detail(req, res, next) {
  try {
    const r = await commandeService.detail(req.user.id, req.idValide);
    if (!r.success) return repondreErreurCommande(res, r);
    res.json(r.data);
  } catch (e) { next(e); }
}

async function relancerPaiement(req, res, next) {
  try {
    const r = await commandeService.relancerPaiement(req.user.id, req.idValide);
    if (!r.success) return repondreErreurCommande(res, r);
    res.json(r.data);
  } catch (e) { next(e); }
}

module.exports = { creer, lister, detail, relancerPaiement };
