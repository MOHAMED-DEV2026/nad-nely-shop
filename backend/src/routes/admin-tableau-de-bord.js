const router = require('express').Router();
const db = require('../config/db');
const { exigerConnexion, exigerAdmin } = require('../middleware/auth');

router.use(exigerConnexion, exigerAdmin);

// GET /api/admin/tableau-de-bord : les 6 indicateurs de la page d'accueil de l'administration (BF25)
router.get('/', async (req, res, next) => {
  try {
    const [[stats]] = await db.query(
      `SELECT
         (SELECT COUNT(*) FROM commande WHERE statut = 'confirmee') AS a_traiter,
         (SELECT COUNT(*) FROM commande
            WHERE statut IN ('confirmee', 'expediee', 'livree')
              AND date_commande >= DATE_FORMAT(CURDATE(), '%Y-%m-01')) AS commandes_mois,
         (SELECT COALESCE(SUM(montant_total), 0) FROM commande
            WHERE statut IN ('confirmee', 'expediee', 'livree')
              AND date_commande >= DATE_FORMAT(CURDATE(), '%Y-%m-01')) AS ca_mois,
         (SELECT COUNT(*) FROM produit WHERE actif = TRUE AND stock = 0) AS ruptures,
         (SELECT COUNT(*) FROM produit WHERE actif = TRUE
            AND date_expiration BETWEEN CURDATE() AND CURDATE() + INTERVAL 30 DAY) AS bientot_expires,
         (SELECT COUNT(*) FROM utilisateur WHERE role = 'client') AS clients`
    );
    res.json({
      a_traiter: Number(stats.a_traiter),
      commandes_mois: Number(stats.commandes_mois),
      ca_mois: Number(stats.ca_mois),
      ruptures: Number(stats.ruptures),
      bientot_expires: Number(stats.bientot_expires),
      clients: Number(stats.clients),
    });
  } catch (e) { next(e); }
});

module.exports = router;
