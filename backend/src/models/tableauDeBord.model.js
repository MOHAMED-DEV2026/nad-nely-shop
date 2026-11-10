// Modèle « tableau de bord » de l'administration : une seule requête qui calcule les 6 indicateurs (BF25).
const db = require('../config/db');

async function lireIndicateurs() {
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
  return stats;
}

module.exports = { lireIndicateurs };
