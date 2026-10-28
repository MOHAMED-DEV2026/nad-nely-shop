const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');
const db = require('../config/db');
const upload = require('../middleware/upload');
const { exigerConnexion, exigerAdmin } = require('../middleware/auth');

// Toutes les routes de ce fichier sont réservées à l'administrateur
router.use(exigerConnexion, exigerAdmin);

const regles = [
  body('nom').trim().notEmpty().withMessage('Le nom est obligatoire').isLength({ max: 100 }),
  body('description').trim().notEmpty().withMessage('La description est obligatoire'),
  body('prix').isFloat({ gt: 0 }).withMessage('Le prix doit être supérieur à 0'),
  body('stock').isInt({ min: 0 }).withMessage('Stock invalide'),
  body('id_categorie').isInt({ min: 1 }).withMessage('Catégorie obligatoire'),
  body('marque').optional({ values: 'falsy' }).trim().isLength({ max: 50 }),
  body('origine').optional({ values: 'falsy' }).trim().isLength({ max: 50 }),
  body('date_fabrication').optional({ values: 'falsy' }).isISO8601(),
  body('date_expiration').optional({ values: 'falsy' }).isISO8601(),
];

// Envoi du fichier image, avec message clair en cas de format ou de taille refusés
function envoyerImage(req, res, next) {
  upload.single('image')(req, res, (err) => {
    if (!err) return next();
    const message = err.message === 'FORMAT_IMAGE'
      ? 'Image : formats acceptés JPG, PNG ou WEBP'
      : 'Image : 2 Mo maximum';
    res.status(400).json({ message });
  });
}

function datesIncoherentes(b) {
  return b.date_fabrication && b.date_expiration && b.date_fabrication >= b.date_expiration;
}

// GET /api/admin/produits : tous les produits, actifs ou non (BF09 à BF11)
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, c.nom AS categorie FROM produit p
       JOIN categorie c ON c.id_categorie = p.id_categorie
       ORDER BY p.id_produit DESC`
    );
    res.json(rows);
  } catch (e) { next(e); }
});

// GET /api/admin/produits/:id : un produit, pour pré-remplir le formulaire de modification (BF10)
router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM produit WHERE id_produit = ?', [Number(req.params.id)]);
    if (rows.length === 0) return res.status(404).json({ message: 'Produit introuvable' });
    res.json(rows[0]);
  } catch (e) { next(e); }
});

// POST /api/admin/produits : ajout, avec image facultative (BF09)
router.post('/', envoyerImage, regles, async (req, res, next) => {
  const erreurs = validationResult(req);
  if (!erreurs.isEmpty()) return res.status(400).json({ erreurs: erreurs.array() });
  try {
    const b = req.body;
    if (datesIncoherentes(b)) {
      return res.status(400).json({ message: 'La date d’expiration doit suivre la date de fabrication' });
    }
    const [r] = await db.query(
      `INSERT INTO produit (nom, description, prix, stock, image, id_categorie,
                            date_fabrication, date_expiration, marque, origine)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [b.nom, b.description, b.prix, b.stock, req.file ? req.file.filename : null,
       b.id_categorie, b.date_fabrication || null, b.date_expiration || null,
       b.marque || null, b.origine || null]
    );
    res.status(201).json({ id_produit: r.insertId, message: 'Produit ajouté' });
  } catch (e) {
    if (e.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ message: 'Catégorie inconnue' });
    next(e);
  }
});

// PUT /api/admin/produits/:id : modification (l'image n'est remplacée que si une nouvelle est envoyée) (BF10)
router.put('/:id', envoyerImage, regles, async (req, res, next) => {
  const erreurs = validationResult(req);
  if (!erreurs.isEmpty()) return res.status(400).json({ erreurs: erreurs.array() });
  try {
    const b = req.body;
    if (datesIncoherentes(b)) {
      return res.status(400).json({ message: 'La date d’expiration doit suivre la date de fabrication' });
    }
    const [r] = await db.query(
      `UPDATE produit SET nom = ?, description = ?, prix = ?, stock = ?,
              image = COALESCE(?, image), id_categorie = ?, date_fabrication = ?,
              date_expiration = ?, marque = ?, origine = ?, actif = COALESCE(?, actif)
       WHERE id_produit = ?`,
      [b.nom, b.description, b.prix, b.stock, req.file ? req.file.filename : null,
       b.id_categorie, b.date_fabrication || null, b.date_expiration || null,
       b.marque || null, b.origine || null, b.actif === undefined ? null : b.actif, Number(req.params.id)]
    );
    if (r.affectedRows === 0) return res.status(404).json({ message: 'Produit introuvable' });
    res.json({ message: 'Produit modifié' });
  } catch (e) {
    if (e.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ message: 'Catégorie inconnue' });
    next(e);
  }
});

// DELETE /api/admin/produits/:id : supprime ou désactive (BF11)
// RG13 : un produit déjà commandé n'est jamais supprimé, il est désactivé.
router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [lignes] = await db.query('SELECT 1 FROM ligne_commande WHERE id_produit = ? LIMIT 1', [id]);
    if (lignes.length > 0) {
      await db.query('UPDATE produit SET actif = 0 WHERE id_produit = ?', [id]);
      return res.json({ message: 'Produit déjà commandé : il a été désactivé et non supprimé' });
    }
    const [anciens] = await db.query('SELECT image FROM produit WHERE id_produit = ?', [id]);
    const [r] = await db.query('DELETE FROM produit WHERE id_produit = ?', [id]);
    if (r.affectedRows === 0) return res.status(404).json({ message: 'Produit introuvable' });
    if (anciens[0] && anciens[0].image) {
      fs.unlink(path.join(__dirname, '..', '..', 'uploads', anciens[0].image), () => {});
    }
    res.json({ message: 'Produit supprimé' });
  } catch (e) { next(e); }
});

module.exports = router;
