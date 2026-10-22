const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/db');
const { exigerConnexion } = require('../middleware/auth');

const COMMUNES = ['Acoua', 'Bandraboua', 'Bandrélé', 'Bouéni', 'Chiconi', 'Chirongui', 'Dembéni',
  'Dzaoudzi', 'Kani-Kéli', 'Koungou', 'Mamoudzou', 'Mtsamboro', "M'Tsangamouji", 'Ouangani',
  'Pamandzi', 'Sada', 'Tsingoni'];

// POST /api/commandes : crée une commande « en attente » avec son paiement « en attente ».
// Corps attendu :
// { "mode_reception": "livraison" | "retrait", "adresse": "...", "commune": "...",
//   "lignes": [ { "id_produit": 1, "quantite": 2 } ] }
// Le prix et le total viennent toujours de la base, jamais du navigateur.
router.post(
  '/',
  exigerConnexion,
  [
    body('mode_reception').isIn(['livraison', 'retrait']).withMessage('Mode de réception invalide'),
    body('adresse').if(body('mode_reception').equals('livraison')).trim().notEmpty().withMessage('Adresse obligatoire').isLength({ max: 255 }),
    body('commune').if(body('mode_reception').equals('livraison')).isIn(COMMUNES).withMessage('Commune invalide'),
    body('lignes').isArray({ min: 1 }).withMessage('Le panier est vide'),
    body('lignes.*.id_produit').isInt({ min: 1 }),
    body('lignes.*.quantite').isInt({ min: 1, max: 99 }),
  ],
  async (req, res, next) => {
    const erreurs = validationResult(req);
    if (!erreurs.isEmpty()) return res.status(400).json({ erreurs: erreurs.array() });

    const { mode_reception, adresse, commune, lignes } = req.body;

    // Si le même produit apparaît deux fois, on additionne les quantités
    const quantites = new Map();
    for (const l of lignes) {
      const id = Number(l.id_produit);
      quantites.set(id, (quantites.get(id) || 0) + Number(l.quantite));
    }

    const connexion = await db.getConnection();
    try {
      await connexion.beginTransaction();

      const ids = [...quantites.keys()];
      // FOR UPDATE : verrouille les produits le temps de la vérification
      const [produits] = await connexion.query(
        `SELECT id_produit, nom_produit, prix, stock, actif, date_expiration
         FROM PRODUIT WHERE id_produit IN (?) FOR UPDATE`,
        [ids]
      );
      const parId = new Map(produits.map((p) => [p.id_produit, p]));
      const aujourdhui = new Date().toISOString().slice(0, 10);

      let total = 0;
      for (const [id, quantite] of quantites) {
        const p = parId.get(id);
        const expire = p && p.date_expiration && String(p.date_expiration.toISOString?.().slice(0, 10) ?? p.date_expiration) < aujourdhui;
        // RG15 : vendable = actif, stock > 0, non expiré. RG17 : stock suffisant.
        if (!p || !p.actif || expire) {
          await connexion.rollback();
          return res.status(409).json({ message: `Produit indisponible : ${p ? p.nom_produit : 'produit inconnu'}` });
        }
        if (p.stock < quantite) {
          await connexion.rollback();
          return res.status(409).json({ message: `Stock insuffisant pour : ${p.nom_produit}` });
        }
        total += Number(p.prix) * quantite;
      }
      total = Math.round(total * 100) / 100;

      const [c] = await connexion.query(
        `INSERT INTO COMMANDE (id_utilisateur, mode_reception, adresse_livraison, commune_livraison, montant_total)
         VALUES (?, ?, ?, ?, ?)`,
        [req.user.id, mode_reception,
         mode_reception === 'livraison' ? adresse : null,
         mode_reception === 'livraison' ? commune : null,
         total]
      );
      const idCommande = c.insertId;

      for (const [id, quantite] of quantites) {
        // Le prix est figé au moment de l'achat
        await connexion.query(
          'INSERT INTO LIGNE_COMMANDE (id_commande, id_produit, quantite, prix_unitaire) VALUES (?, ?, ?, ?)',
          [idCommande, id, quantite, parId.get(id).prix]
        );
      }
      await connexion.query('INSERT INTO PAIEMENT (id_commande, montant) VALUES (?, ?)', [idCommande, total]);

      await connexion.commit();
      res.status(201).json({ id_commande: idCommande, montant_total: total, statut: 'en_attente' });
    } catch (e) {
      await connexion.rollback();
      next(e);
    } finally {
      connexion.release();
    }
  }
);

// RG34 : pour un retrait, « expédiée » s'affiche « Prête à retirer » et « livrée » s'affiche « Retirée »
const LIBELLES = {
  en_attente: 'En attente', confirmee: 'Confirmée', expediee: 'Expédiée', livree: 'Livrée', annulee: 'Annulée',
};
function statutAffiche(commande) {
  if (commande.mode_reception === 'retrait') {
    if (commande.statut_commande === 'expediee') return 'Prête à retirer';
    if (commande.statut_commande === 'livree') return 'Retirée';
  }
  return LIBELLES[commande.statut_commande];
}

// GET /api/commandes : mes commandes, de la plus récente à la plus ancienne
router.get('/', exigerConnexion, async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT id_commande, date_commande, mode_reception, montant_total, statut_commande
       FROM COMMANDE WHERE id_utilisateur = ? ORDER BY date_commande DESC, id_commande DESC`,
      [req.user.id]
    );
    res.json(rows.map((c) => ({ ...c, statut_affiche: statutAffiche(c) })));
  } catch (e) { next(e); }
});

// GET /api/commandes/:id : détail d'une de mes commandes
router.get('/:id', exigerConnexion, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    // On filtre aussi sur l'utilisateur : impossible de voir la commande d'un autre client
    const [rows] = await db.query(
      'SELECT * FROM COMMANDE WHERE id_commande = ? AND id_utilisateur = ?', [id, req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Commande introuvable' });

    const [lignes] = await db.query(
      `SELECT l.id_produit, p.nom_produit, l.quantite, l.prix_unitaire,
              (l.quantite * l.prix_unitaire) AS sous_total
       FROM LIGNE_COMMANDE l JOIN PRODUIT p ON p.id_produit = l.id_produit
       WHERE l.id_commande = ?`,
      [id]
    );
    const [paiements] = await db.query(
      'SELECT statut_paiement, date_paiement FROM PAIEMENT WHERE id_commande = ?', [id]
    );
    res.json({ ...rows[0], statut_affiche: statutAffiche(rows[0]), lignes, paiement: paiements[0] || null });
  } catch (e) { next(e); }
});

module.exports = router;