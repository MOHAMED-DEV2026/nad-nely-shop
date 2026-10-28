const router = require('express').Router();
const db = require('../config/db');

const PAR_PAGE = 6;

// Le tri est choisi dans une liste fixe, jamais recopié depuis la requête (évite l'injection SQL)
const TRIS = {
  nouveautes: 'p.date_ajout DESC, p.id_produit DESC',
  prix_asc: 'p.prix ASC, p.id_produit ASC',
  prix_desc: 'p.prix DESC, p.id_produit ASC',
};

// RG15 : un produit est vendable s'il est actif, si son stock est supérieur à 0 et si sa date d'expiration n'est pas dépassée
const DISPONIBLE = '(p.stock > 0 AND (p.date_expiration IS NULL OR p.date_expiration >= CURDATE()))';

// GET /api/produits?recherche=&categorie=&prixMin=&prixMax=&marque=&origine=&tri=&page=  (BF06, BF07)
router.get('/', async (req, res, next) => {
  try {
    const conditions = ['p.actif = 1'];
    const valeurs = [];
    const q = req.query;

    if (q.recherche) { conditions.push('p.nom LIKE ?'); valeurs.push(`%${q.recherche}%`); }
    if (q.categorie && Number(q.categorie) > 0) { conditions.push('p.id_categorie = ?'); valeurs.push(Number(q.categorie)); }
    if (q.prixMin !== undefined && q.prixMin !== '' && !isNaN(q.prixMin)) { conditions.push('p.prix >= ?'); valeurs.push(Number(q.prixMin)); }
    if (q.prixMax !== undefined && q.prixMax !== '' && !isNaN(q.prixMax)) { conditions.push('p.prix <= ?'); valeurs.push(Number(q.prixMax)); }
    if (q.marque) { conditions.push('p.marque = ?'); valeurs.push(q.marque); }
    if (q.origine) { conditions.push('p.origine = ?'); valeurs.push(q.origine); }
    if (q.public === 'femme' || q.public === 'homme') { conditions.push('p.public_cible IN (?, ?)'); valeurs.push(q.public, 'mixte'); }

    const ordre = TRIS[q.tri] || TRIS.nouveautes;
    const page = Math.max(1, parseInt(q.page, 10) || 1);
    const where = conditions.join(' AND ');

    const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM produit p WHERE ${where}`, valeurs);
    const [rows] = await db.query(
      `SELECT p.id_produit, p.nom, p.prix, p.stock, p.image, p.marque, p.origine, p.date_expiration,
              c.nom AS categorie, ${DISPONIBLE} AS disponible
       FROM produit p JOIN categorie c ON c.id_categorie = p.id_categorie
       WHERE ${where}
       ORDER BY ${ordre}
       LIMIT ? OFFSET ?`,
      [...valeurs, PAR_PAGE, (page - 1) * PAR_PAGE]
    );
    res.json({
      total, page, par_page: PAR_PAGE,
      produits: rows.map((p) => ({ ...p, disponible: Boolean(p.disponible) })),
    });
  } catch (e) { next(e); }
});

// GET /api/produits/filtres : marques et origines existantes, pour les listes de filtres (BF07)
router.get('/filtres', async (req, res, next) => {
  try {
    const [marques] = await db.query(
      'SELECT DISTINCT marque FROM produit WHERE actif = 1 AND marque IS NOT NULL ORDER BY marque');
    const [origines] = await db.query(
      'SELECT DISTINCT origine FROM produit WHERE actif = 1 AND origine IS NOT NULL ORDER BY origine');
    res.json({ marques: marques.map((m) => m.marque), origines: origines.map((o) => o.origine) });
  } catch (e) { next(e); }
});

// GET /api/produits/:id : fiche d'un produit actif (BF08)
router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, c.nom AS categorie, ${DISPONIBLE} AS disponible
       FROM produit p JOIN categorie c ON c.id_categorie = p.id_categorie
       WHERE p.id_produit = ? AND p.actif = 1`,
      [Number(req.params.id)]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Produit introuvable' });
    res.json({ ...rows[0], disponible: Boolean(rows[0].disponible) });
  } catch (e) { next(e); }
});

module.exports = router;



