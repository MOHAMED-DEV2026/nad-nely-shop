const router = require('express').Router();
const db = require('../config/db');
const { exigerConnexion, exigerAdmin } = require('../middlewares/auth');

router.use(exigerConnexion, exigerAdmin);

const PAR_PAGE = 20;

// GET /api/admin/utilisateurs : liste des clients inscrits, en consultation seule (BF24)
// Paramètres facultatifs : recherche (nom, prénom ou e-mail), page
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const recherche = (req.query.recherche || '').trim();

    // RG04 : seuls les comptes de rôle « client » apparaissent
    const conditions = ["u.role = 'client'"];
    const valeurs = [];
    if (recherche) {
      conditions.push('(u.nom LIKE ? OR u.prenom LIKE ? OR u.email LIKE ?)');
      const motif = `%${recherche}%`;
      valeurs.push(motif, motif, motif);
    }
    const where = conditions.join(' AND ');

    const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM utilisateur u WHERE ${where}`, valeurs);

    // RG03 : on ne sélectionne jamais le mot de passe ni le code de réinitialisation
    const [clients] = await db.query(
      `SELECT u.id_utilisateur, u.nom, u.prenom, u.email, u.telephone, u.date_inscription,
              COUNT(c.id_commande) AS nb_commandes
       FROM utilisateur u
       LEFT JOIN commande c ON c.id_utilisateur = u.id_utilisateur
       WHERE ${where}
       GROUP BY u.id_utilisateur
       ORDER BY u.date_inscription DESC, u.id_utilisateur DESC
       LIMIT ? OFFSET ?`,
      [...valeurs, PAR_PAGE, (page - 1) * PAR_PAGE]
    );

    res.json({
      total: Number(total),
      page,
      par_page: PAR_PAGE,
      utilisateurs: clients.map((c) => ({ ...c, nb_commandes: Number(c.nb_commandes) })),
    });
  } catch (e) { next(e); }
});

module.exports = router;