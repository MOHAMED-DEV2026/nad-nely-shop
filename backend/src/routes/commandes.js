const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/db');
const { exigerConnexion } = require('../middleware/auth');

const COMMUNES = ['Acoua', 'Bandraboua', 'Bandrélé', 'Bouéni', 'Chiconi', 'Chirongui', 'Dembéni',
  'Dzaoudzi', 'Kani-Kéli', 'Koungou', 'Mamoudzou', 'Mtsamboro', "M'Tsangamouji", 'Ouangani',
  'Pamandzi', 'Sada', 'Tsingoni'];

// POST /api/commandes : crée une commande « en attente » avec son paiement « en attente » (BF17)
// Corps attendu :
// { "lignes": [ { "id_produit": 3, "quantite": 1 } ], "mode_reception": "livraison" | "retrait",
//   "adresse_livraison": "...", "commune_livraison": "...", "telephone_contact": "..." }
// RG19 : le prix et le total viennent toujours de la base, jamais du navigateur.
router.post(
  '/',
  exigerConnexion,
  [
    body('mode_reception').isIn(['livraison', 'retrait']).withMessage('Mode de réception invalide'),
    body('adresse_livraison').if(body('mode_reception').equals('livraison')).trim().notEmpty().withMessage('Adresse obligatoire').isLength({ max: 255 }),
    body('commune_livraison').if(body('mode_reception').equals('livraison')).isIn(COMMUNES).withMessage('Commune invalide'),
    body('telephone_contact').trim().matches(/^[0-9+ .()-]{6,20}$/).withMessage('Téléphone de contact invalide'),
    body('lignes').isArray({ min: 1 }).withMessage('Le panier est vide'),
    body('lignes.*.id_produit').isInt({ min: 1 }),
    body('lignes.*.quantite').isInt({ min: 1, max: 99 }),
  ],
  async (req, res, next) => {
    const erreurs = validationResult(req);
    if (!erreurs.isEmpty()) return res.status(400).json({ erreurs: erreurs.array() });

    const { mode_reception, adresse_livraison, commune_livraison, telephone_contact, lignes } = req.body;

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
        `SELECT id_produit, nom, prix, stock, actif,
                (date_expiration IS NOT NULL AND date_expiration < CURDATE()) AS expire
         FROM produit WHERE id_produit IN (?) FOR UPDATE`,
        [ids]
      );
      const parId = new Map(produits.map((p) => [p.id_produit, p]));

      let total = 0;
      for (const [id, quantite] of quantites) {
        const p = parId.get(id);
        // RG15 : vendable = actif, non expiré. RG17 : stock suffisant.
        if (!p || !p.actif || p.expire) {
          await connexion.rollback();
          return res.status(409).json({ message: `Produit indisponible : ${p ? p.nom : 'produit inconnu'}` });
        }
        if (p.stock < quantite) {
          await connexion.rollback();
          return res.status(409).json({ message: `Stock insuffisant pour : ${p.nom}` });
        }
        total += Number(p.prix) * quantite;
      }
      total = Math.round(total * 100) / 100;

      const livraison = mode_reception === 'livraison';
      const [c] = await connexion.query(
        `INSERT INTO commande (id_utilisateur, mode_reception, adresse_livraison, commune_livraison,
                               telephone_contact, montant_total)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [req.user.id, mode_reception, livraison ? adresse_livraison : null,
         livraison ? commune_livraison : null, telephone_contact, total]
      );
      const idCommande = c.insertId;

      for (const [id, quantite] of quantites) {
        // Le prix est figé au moment de l'achat
        await connexion.query(
          'INSERT INTO ligne_commande (id_commande, id_produit, quantite, prix_unitaire) VALUES (?, ?, ?, ?)',
          [idCommande, id, quantite, parId.get(id).prix]
        );
      }
      await connexion.query('INSERT INTO paiement (id_commande, montant) VALUES (?, ?)', [idCommande, total]);

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
    if (commande.statut === 'expediee') return 'Prête à retirer';
    if (commande.statut === 'livree') return 'Retirée';
  }
  return LIBELLES[commande.statut];
}

// GET /api/commandes : mes commandes, de la plus récente à la plus ancienne (BF19)
router.get('/', exigerConnexion, async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT id_commande, date_commande, mode_reception, montant_total, statut
       FROM commande WHERE id_utilisateur = ? ORDER BY date_commande DESC, id_commande DESC`,
      [req.user.id]
    );
    res.json(rows.map((c) => ({ ...c, statut_affiche: statutAffiche(c) })));
  } catch (e) { next(e); }
});

// GET /api/commandes/:id : détail d'une de mes commandes (BF20)
router.get('/:id', exigerConnexion, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [rows] = await db.query('SELECT * FROM commande WHERE id_commande = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Commande introuvable' });
    // La commande doit appartenir au client connecté, sinon 403
    if (rows[0].id_utilisateur !== req.user.id) return res.status(403).json({ message: 'Accès refusé' });

    const [lignes] = await db.query(
      `SELECT l.id_produit, p.nom, l.quantite, l.prix_unitaire,
              (l.quantite * l.prix_unitaire) AS sous_total
       FROM ligne_commande l JOIN produit p ON p.id_produit = l.id_produit
       WHERE l.id_commande = ?`,
      [id]
    );
    const [paiements] = await db.query(
      'SELECT statut, date_paiement FROM paiement WHERE id_commande = ?', [id]
    );
    res.json({ ...rows[0], statut_affiche: statutAffiche(rows[0]), lignes, paiement: paiements[0] || null });
  } catch (e) { next(e); }
});

module.exports = router;
