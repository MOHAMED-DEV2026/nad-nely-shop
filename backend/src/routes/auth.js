const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../config/db');

// POST /api/auth/register : inscription d'un client
router.post(
  '/register',
  [
    body('nom').trim().notEmpty().withMessage('Le nom est obligatoire'),
    body('prenom').trim().notEmpty().withMessage('Le prénom est obligatoire'),
    body('email').trim().isEmail().withMessage('Adresse e-mail invalide'),
    body('telephone').optional({ values: 'falsy' }).trim().isLength({ max: 20 }),
    // Règle provisoire : 8 caractères minimum. À aligner sur la règle de gestion du cahier des charges.
    body('mot_de_passe').isLength({ min: 8 }).withMessage('Le mot de passe doit faire au moins 8 caractères'),
  ],
  async (req, res, next) => {
    const erreurs = validationResult(req);
    if (!erreurs.isEmpty()) return res.status(400).json({ erreurs: erreurs.array() });

    try {
      const { nom, prenom, email, telephone, mot_de_passe } = req.body;

      const [existe] = await db.query('SELECT id_utilisateur FROM UTILISATEUR WHERE email = ?', [email]);
      if (existe.length > 0) return res.status(409).json({ message: 'Cette adresse e-mail est déjà utilisée' });

      // Le mot de passe est haché : on ne le stocke jamais en clair
      const hash = await bcrypt.hash(mot_de_passe, 10);
      const [r] = await db.query(
        'INSERT INTO UTILISATEUR (nom, prenom, email, telephone, mot_de_passe) VALUES (?, ?, ?, ?, ?)',
        [nom, prenom, email, telephone || null, hash]
      );
      res.status(201).json({ id_utilisateur: r.insertId, message: 'Compte créé' });
    } catch (e) { next(e); }
  }
);

// POST /api/auth/login : connexion, renvoie un jeton JWT
router.post(
  '/login',
  [body('email').trim().isEmail(), body('mot_de_passe').notEmpty()],
  async (req, res, next) => {
    const erreurs = validationResult(req);
    if (!erreurs.isEmpty()) return res.status(400).json({ message: 'E-mail ou mot de passe invalide' });

    try {
      const { email, mot_de_passe } = req.body;
      const [rows] = await db.query('SELECT * FROM UTILISATEUR WHERE email = ?', [email]);
      const user = rows[0];

      // Même message dans les deux cas : on ne révèle pas si l'e-mail existe
      const ok = user && (await bcrypt.compare(mot_de_passe, user.mot_de_passe));
      if (!ok) return res.status(401).json({ message: 'E-mail ou mot de passe incorrect' });

      const token = jwt.sign(
        { id: user.id_utilisateur, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
      );
      res.json({
        token,
        utilisateur: { id: user.id_utilisateur, nom: user.nom, prenom: user.prenom, role: user.role },
      });
    } catch (e) { next(e); }
  }
);

module.exports = router;
