const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/db');
const { exigerConnexion, exigerAdmin } = require('../middleware/auth');

router.use(exigerConnexion, exigerAdmin);

const PAR_PAGE = 20;
const LIBELLES = {
  en_attente: 'En attente', confirmee: 'Confirmée', expediee: 'Expédiée', livree: 'Livrée', annulee: 'Annulée',
};
// Étape suivante possible pour chaque statut (« livrée » et « annulée » sont définitifs)
const SUIVANT = { confirmee: 'expediee', expediee: 'livree' };
// Statuts depuis lesquels on peut annuler
const ANNULABLES = ['en_attente', 'confirmee', 'expediee'];
// Statuts pour lesquels le stock a déjà été décrémenté (après paiement validé)
const STOCK_DECREMENTE = ['confirmee', 'expediee'];

// RG34 : pour un retrait, « expédiée » s'affiche « Prête à retirer » et « livrée » s'affiche « Retirée »
function statutAffiche(c) {
  if (c.mode_reception === 'retrait') {
    if (c.statut_commande === 'expediee') return 'Prête à retirer';
    if (c.statut_commande === 'livree') return 'Retirée';
  }
  return LIBELLES[c.statut_commande];
}

// GET /api/admin/commandes?statut=&du=&au=&client=&page=
router.get('/', async (req, res, next) => {
  try {
    const conditions = ['1 = 1'];
    const valeurs = [];

    if (req.query.statut && LIBELLES[req.query.statut]) {
      conditions.push('c.statut_commande = ?');
      valeurs.push(req.query.statut);
    }
    if (req.query.du) { conditions.push('DATE(c.date_commande) >= ?'); valeurs.push(req.query.du); }
    if (req.query.au) { conditions.push('DATE(c.date_commande) <= ?'); valeurs.push(req.query.au); }
    if (req.query.client) {
      conditions.push('(u.nom LIKE ? OR u.prenom LIKE ? OR u.email LIKE ?)');
      const m = `%${req.query.client}%`;
      valeurs.push(m, m, m);
    }

    const page = Math.max(1, Number(req.query.page) || 1);
    const where = conditions.join(' AND ');

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM COMMANDE c JOIN UTILISATEUR u ON u.id_utilisateur = c.id_utilisateur WHERE ${where}`,
      valeurs
    );
    const [rows] = await db.query(
      `SELECT c.id_commande, c.date_commande, c.mode_reception, c.commune_livraison, c.montant_total,
              c.statut_commande, u.nom, u.prenom, u.email
       FROM COMMANDE c JOIN UTILISATEUR u ON u.id_utilisateur = c.id_utilisateur
       WHERE ${where}
       ORDER BY c.date_commande DESC, c.id_commande DESC
       LIMIT ? OFFSET ?`,
      [...valeurs, PAR_PAGE, (page - 1) * PAR_PAGE]
    );
    res.json({
      total, page, par_page: PAR_PAGE,
      commandes: rows.map((c) => ({ ...c, statut_affiche: statutAffiche(c) })),
    });
  } catch (e) { next(e); }
});

// GET /api/admin/commandes/:id : détail complet
router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [rows] = await db.query(
      `SELECT c.*, u.nom, u.prenom, u.email, u.telephone
       FROM COMMANDE c JOIN UTILISATEUR u ON u.id_utilisateur = c.id_utilisateur
       WHERE c.id_commande = ?`,
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Commande introuvable' });
    const c = rows[0];

    const [lignes] = await db.query(
      `SELECT l.id_produit, p.nom_produit, l.quantite, l.prix_unitaire,
              (l.quantite * l.prix_unitaire) AS sous_total
       FROM LIGNE_COMMANDE l JOIN PRODUIT p ON p.id_produit = l.id_produit
       WHERE l.id_commande = ?`,
      [id]
    );
    const [paiements] = await db.query(
      'SELECT statut_paiement, reference_transaction, date_paiement FROM PAIEMENT WHERE id_commande = ?', [id]
    );
    res.json({
      ...c,
      statut_affiche: statutAffiche(c),
      etape_suivante: SUIVANT[c.statut_commande] || null,
      annulable: ANNULABLES.includes(c.statut_commande),
      lignes,
      paiement: paiements[0] || null,
    });
  } catch (e) { next(e); }
});

// PATCH /api/admin/commandes/:id/statut   corps : { "action": "avancer" } ou { "action": "annuler" }
router.patch('/:id/statut', body('action').isIn(['avancer', 'annuler']), async (req, res, next) => {
  if (!validationResult(req).isEmpty()) return res.status(400).json({ message: 'Action invalide' });

  const connexion = await db.getConnection();
  try {
    await connexion.beginTransaction();
    const id = Number(req.params.id);

    const [rows] = await connexion.query('SELECT * FROM COMMANDE WHERE id_commande = ? FOR UPDATE', [id]);
    if (rows.length === 0) {
      await connexion.rollback();
      return res.status(404).json({ message: 'Commande introuvable' });
    }
    const commande = rows[0];
    const statut = commande.statut_commande;

    if (req.body.action === 'avancer') {
      const suivant = SUIVANT[statut];
      if (!suivant) {
        await connexion.rollback();
        return res.status(409).json({ message: `Cette commande ne peut pas avancer (statut : ${LIBELLES[statut]})` });
      }
      await connexion.query('UPDATE COMMANDE SET statut_commande = ? WHERE id_commande = ?', [suivant, id]);
      await connexion.commit();
      return res.json({ message: 'Statut mis à jour', statut_commande: suivant });
    }

    // Annulation
    if (!ANNULABLES.includes(statut)) {
      await connexion.rollback();
      return res.status(409).json({ message: `Cette commande ne peut plus être annulée (statut : ${LIBELLES[statut]})` });
    }
    if (STOCK_DECREMENTE.includes(statut)) {
      // Le stock avait été retiré au paiement : on le remet
      await connexion.query(
        `UPDATE PRODUIT p JOIN LIGNE_COMMANDE l ON l.id_produit = p.id_produit
         SET p.stock = p.stock + l.quantite WHERE l.id_commande = ?`,
        [id]
      );
    }
    await connexion.query("UPDATE COMMANDE SET statut_commande = 'annulee' WHERE id_commande = ?", [id]);
    await connexion.commit();
    res.json({
      message: 'Commande annulée. Le remboursement éventuel se fait manuellement depuis Stripe.',
      statut_commande: 'annulee',
    });
  } catch (e) {
    await connexion.rollback();
    next(e);
  } finally {
    connexion.release();
  }
});

module.exports = router;
