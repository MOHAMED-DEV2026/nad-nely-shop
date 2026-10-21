const router = require('express').Router();
const db = require('../config/db');

// GET /api/categories : liste des catégories
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      'SELECT id_categorie, nom_categorie, description FROM CATEGORIE ORDER BY nom_categorie'
    );
    res.json(rows);
  } catch (e) { next(e); }
});

module.exports = router;
