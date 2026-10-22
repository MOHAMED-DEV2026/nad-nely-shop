const router = require('express').Router();
const db = require('../config/db');

// GET /api/categories : liste des catégories (BF06)
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT id_categorie, nom, description FROM categorie ORDER BY nom');
    res.json(rows);
  } catch (e) { next(e); }
});

module.exports = router;
