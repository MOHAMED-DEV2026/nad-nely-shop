const router = require('express').Router();
const db = require('../config/db');

// GET /api/produits?recherche=...&categorie=...
// Seuls les produits actifs sont visibles par le public.
router.get('/', async (req, res, next) => {
  try {
    const conditions = ['p.actif = 1'];
    const valeurs = [];

    if (req.query.recherche) {
      conditions.push('p.nom_produit LIKE ?');
      valeurs.push(`%${req.query.recherche}%`);
    }
    if (req.query.categorie) {
      conditions.push('p.id_categorie = ?');
      valeurs.push(Number(req.query.categorie));
    }

    const [rows] = await db.query(
      `SELECT p.id_produit, p.nom_produit, p.prix, p.stock, p.image, c.nom_categorie
       FROM PRODUIT p JOIN CATEGORIE c ON c.id_categorie = p.id_categorie
       WHERE ${conditions.join(' AND ')}
       ORDER BY p.id_produit DESC`,
      valeurs
    );
    res.json(rows);
  } catch (e) { next(e); }
});

// GET /api/produits/:id : fiche produit
router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, c.nom_categorie
       FROM PRODUIT p JOIN CATEGORIE c ON c.id_categorie = p.id_categorie
       WHERE p.id_produit = ? AND p.actif = 1`,
      [Number(req.params.id)]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Produit introuvable' });
    res.json(rows[0]);
  } catch (e) { next(e); }
});

module.exports = router;
