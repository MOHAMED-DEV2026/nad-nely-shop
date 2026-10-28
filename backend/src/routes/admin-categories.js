const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/db');
const { exigerConnexion, exigerAdmin } = require('../middlewares/auth');

router.use(exigerConnexion, exigerAdmin);

const regles = [
  body('nom').trim().notEmpty().withMessage('Le nom est obligatoire').isLength({ max: 50 }),
  body('description').optional({ values: 'falsy' }).trim().isLength({ max: 255 }),
];

// GET /api/admin/categories : liste avec le nombre de produits, actifs ou non (BF12)
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT c.id_categorie, c.nom, c.description, COUNT(p.id_produit) AS nb_produits
       FROM categorie c LEFT JOIN produit p ON p.id_categorie = c.id_categorie
       GROUP BY c.id_categorie ORDER BY c.nom`
    );
    res.json(rows);
  } catch (e) { next(e); }
});

// POST /api/admin/categories : ajout
router.post('/', regles, async (req, res, next) => {
  const erreurs = validationResult(req);
  if (!erreurs.isEmpty()) return res.status(400).json({ erreurs: erreurs.array() });
  try {
    const [r] = await db.query('INSERT INTO categorie (nom, description) VALUES (?, ?)',
      [req.body.nom, req.body.description || null]);
    res.status(201).json({ id_categorie: r.insertId, message: 'Catégorie ajoutée' });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Ce nom de catégorie existe déjà' });
    next(e);
  }
});

// PUT /api/admin/categories/:id : modification
router.put('/:id', regles, async (req, res, next) => {
  const erreurs = validationResult(req);
  if (!erreurs.isEmpty()) return res.status(400).json({ erreurs: erreurs.array() });
  try {
    const [r] = await db.query(
      'UPDATE categorie SET nom = ?, description = ? WHERE id_categorie = ?',
      [req.body.nom, req.body.description || null, Number(req.params.id)]);
    if (r.affectedRows === 0) return res.status(404).json({ message: 'Catégorie introuvable' });
    res.json({ message: 'Catégorie modifiée' });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Ce nom de catégorie existe déjà' });
    next(e);
  }
});

// DELETE /api/admin/categories/:id : seulement si aucun produit (actif ou non) n'y est rattaché
router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [p] = await db.query('SELECT 1 FROM produit WHERE id_categorie = ? LIMIT 1', [id]);
    if (p.length > 0) return res.status(409).json({ message: 'Suppression impossible : des produits sont rattachés à cette catégorie' });
    const [r] = await db.query('DELETE FROM categorie WHERE id_categorie = ?', [id]);
    if (r.affectedRows === 0) return res.status(404).json({ message: 'Catégorie introuvable' });
    res.json({ message: 'Catégorie supprimée' });
  } catch (e) { next(e); }
});

module.exports = router;
