const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../config/db');

// RG02 : 8 caractères minimum, dont une majuscule, une minuscule et un chiffre
const POLITIQUE_MDP = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

function creerJeton(utilisateur) {
  return jwt.sign(
    { id: utilisateur.id_utilisateur, role: utilisateur.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
  );
}

// POST /api/auth/inscription : crée un compte client puis renvoie un jeton (BF01)
router.post(
  '/inscription',
  [
    body('nom').trim().notEmpty().withMessage('Le nom est obligatoire').isLength({ max: 50 }),
    body('prenom').trim().notEmpty().withMessage('Le prénom est obligatoire').isLength({ max: 50 }),
    body('email').trim().isEmail().withMessage('Adresse e-mail invalide').isLength({ max: 100 }),
    body('telephone').optional({ values: 'falsy' }).trim().isLength({ max: 20 }),
    body('mot_de_passe').matches(POLITIQUE_MDP)
      .withMessage('Le mot de passe doit contenir au moins 8 caractères, dont une majuscule, une minuscule et un chiffre'),
  ],
  async (req, res, next) => {
    const erreurs = validationResult(req);
    if (!erreurs.isEmpty()) return res.status(400).json({ erreurs: erreurs.array() });

    try {
      const { nom, prenom, email, telephone, mot_de_passe } = req.body;

      const [existe] = await db.query('SELECT id_utilisateur FROM utilisateur WHERE email = ?', [email]);
      if (existe.length > 0) return res.status(409).json({ message: 'Cette adresse e-mail est déjà utilisée' });

      // RG03 : le mot de passe est haché, jamais stocké en clair
      const hash = await bcrypt.hash(mot_de_passe, 10);
      const [r] = await db.query(
        'INSERT INTO utilisateur (nom, prenom, email, telephone, mot_de_passe) VALUES (?, ?, ?, ?, ?)',
        [nom, prenom, email, telephone || null, hash]
      );
      const utilisateur = { id_utilisateur: r.insertId, role: 'client' };
      res.status(201).json({
        token: creerJeton(utilisateur),
        utilisateur: { id: r.insertId, nom, prenom, role: 'client' },
      });
    } catch (e) { next(e); }
  }
);

// POST /api/auth/connexion : vérifie les identifiants et renvoie un jeton (BF02)
router.post(
  '/connexion',
  [body('email').trim().isEmail(), body('mot_de_passe').notEmpty()],
  async (req, res, next) => {
    const erreurs = validationResult(req);
    if (!erreurs.isEmpty()) return res.status(400).json({ message: 'E-mail ou mot de passe invalide' });

    try {
      const { email, mot_de_passe } = req.body;
      const [rows] = await db.query('SELECT * FROM utilisateur WHERE email = ?', [email]);
      const user = rows[0];

      // Même message dans les deux cas : on ne révèle pas si l'e-mail existe
      const ok = user && (await bcrypt.compare(mot_de_passe, user.mot_de_passe));
      if (!ok) return res.status(401).json({ message: 'E-mail ou mot de passe incorrect' });

      res.json({
        token: creerJeton(user),
        utilisateur: { id: user.id_utilisateur, nom: user.nom, prenom: user.prenom, role: user.role },
      });
    } catch (e) { next(e); }
  }
);

module.exports = router;
