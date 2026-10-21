const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/db');
const upload = require('../middleware/upload');
const { exigerConnexion, exigerAdmin } = require('../middleware/auth');

// Toutes les routes de ce fichier sont réservées à l'administrateur
router.use(exigerConnexion, exigerAdmin);

const regles = [
  body('nom_produit').trim().notEmpty().withMessage('Le nom est obligatoire').isLength({ max: 100 }),
  body('prix').isFloat({ min: 0 }).withMessage('Prix invalide'),
  body('stock').isInt({ min: 0 }).withMessage('Stock invalide'),
  body('id_categorie').isInt({ min: 1 }).withMessage('Catégorie obligatoire'),
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

// GET /api/admin/produits : tous les produits, actifs ou non
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, c.nom_categorie FROM PRODUIT p
       JOIN CATEGORIE c ON c.id_categorie = p.id_categorie
       ORDER BY p.id_produit DESC`
    );
    res.json(rows);
  } catch (e) { next(e); }
});

// GET /api/admin/produits/:id
router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM PRODUIT WHERE id_produit = ?', [Number(req.params.id)]);
    if (rows.length === 0) return res.status(404).json({ message: 'Produit introuvable' });
    res.json(rows[0]);
  } catch (e) { next(e); }
});

// POST /api/admin/produits : ajout (formulaire avec image facultative)
router.post('/', envoyerImage, regles, async (req, res, next) => {
  const erreurs = validationResult(req);
  if (!erreurs.isEmpty()) return res.status(400).json({ erreurs: erreurs.array() });
  try {
    const b = req.body;
    if (b.date_fabrication && b.date_expiration && b.date_fabrication >= b.date_expiration) {
      return res.status(400).json({ message: 'La date d’expiration doit suivre la date de fabrication' });
    }
    const [r] = await db.query(
      `INSERT INTO PRODUIT (nom_produit, description, prix, stock, image, id_categorie,
                            date_fabrication, date_expiration, marque, origine)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [b.nom_produit, b.description || null, b.prix, b.stock, req.file ? req.file.filename : null,
       b.id_categorie, b.date_fabrication || null, b.date_expiration || null,
       b.marque || null, b.origine || null]
    );
    res.status(201).json({ id_produit: r.insertId, message: 'Produit ajouté' });
  } catch (e) {
    if (e.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ message: 'Catégorie inconnue' });
    next(e);
  }
});

// PUT /api/admin/produits/:id : modification (l'image n'est remplacée que si une nouvelle est envoyée)
router.put('/:id', envoyerImage, regles, async (req, res, next) => {
  const erreurs = validationResult(req);
  if (!erreurs.isEmpty()) return res.status(400).json({ erreurs: erreurs.array() });
  try {
    const b = req.body;
    if (b.date_fabrication && b.date_expiration && b.date_fabrication >= b.date_expiration) {
      return res.status(400).json({ message: 'La date d’expiration doit suivre la date de fabrication' });
    }
    const [r] = await db.query(
      `UPDATE PRODUIT SET nom_produit = ?, description = ?, prix = ?, stock = ?,
              image = COALESCE(?, image), id_categorie = ?, date_fabrication = ?,
              date_expiration = ?, marque = ?, origine = ?
       WHERE id_produit = ?`,
      [b.nom_produit, b.description || null, b.prix, b.stock, req.file ? req.file.filename : null,
       b.id_categorie, b.date_fabrication || null, b.date_expiration || null,
       b.marque || null, b.origine || null, Number(req.params.id)]
    );
    if (r.affectedRows === 0) return res.status(404).json({ message: 'Produit introuvable' });
    res.json({ message: 'Produit modifié' });
  } catch (e) {
    if (e.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ message: 'Catégorie inconnue' });
    next(e);
  }
});

// PATCH /api/admin/produits/:id/actif : activer ou désactiver un produit
router.patch('/:id/actif', body('actif').isBoolean(), async (req, res, next) => {
  if (!validationResult(req).isEmpty()) return res.status(400).json({ message: 'Valeur invalide' });
  try {
    const actif = req.body.actif === true || req.body.actif === 'true' ? 1 : 0;
    const [r] = await db.query('UPDATE PRODUIT SET actif = ? WHERE id_produit = ?', [actif, Number(req.params.id)]);
    if (r.affectedRows === 0) return res.status(404).json({ message: 'Produit introuvable' });
    res.json({ message: actif ? 'Produit activé' : 'Produit désactivé' });
  } catch (e) { next(e); }
});

// DELETE /api/admin/produits/:id
// RG13 : un produit déjà commandé n'est jamais supprimé, il est désactivé.
router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [lignes] = await db.query('SELECT 1 FROM LIGNE_COMMANDE WHERE id_produit = ? LIMIT 1', [id]);
    if (lignes.length > 0) {
      await db.query('UPDATE PRODUIT SET actif = 0 WHERE id_produit = ?', [id]);
      return res.json({ message: 'Produit déjà commandé : il a été désactivé et non supprimé' });
    }
    const [r] = await db.query('DELETE FROM PRODUIT WHERE id_produit = ?', [id]);
    if (r.affectedRows === 0) return res.status(404).json({ message: 'Produit introuvable' });
    res.json({ message: 'Produit supprimé' });
  } catch (e) { next(e); }
});

module.exports = router;
