const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const db = require('../config/db');
const { envoyerCodeReinitialisation } = require('../config/mailer');

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

// POST /api/auth/mot-de-passe-oublie : génère un code à 6 chiffres et l'envoie par e-mail (BF04, RG05)
router.post(
  '/mot-de-passe-oublie',
  [body('email').trim().isEmail().withMessage('Adresse e-mail invalide')],
  async (req, res, next) => {
    const erreurs = validationResult(req);
    if (!erreurs.isEmpty()) return res.status(400).json({ erreurs: erreurs.array() });

    // Même réponse que le compte existe ou non : on ne révèle pas les adresses inscrites
    const reponse = { message: 'Si cette adresse correspond à un compte, un code vient d’être envoyé par e-mail.' };

    try {
      const { email } = req.body;
      const [rows] = await db.query('SELECT id_utilisateur, prenom FROM utilisateur WHERE email = ?', [email]);
      if (rows.length === 0) return res.json(reponse);

      // Code à 6 chiffres, stocké haché, valable 15 minutes (RG05)
      const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
      const hash = await bcrypt.hash(code, 10);
      await db.query(
        'UPDATE utilisateur SET code_reinitialisation = ?, expiration_code = DATE_ADD(NOW(), INTERVAL 15 MINUTE) WHERE id_utilisateur = ?',
        [hash, rows[0].id_utilisateur]
      );

      try {
        await envoyerCodeReinitialisation(email, rows[0].prenom, code);
      } catch (erreurMail) {
        console.error('Envoi du code impossible :', erreurMail.message);
      }
      res.json(reponse);
    } catch (e) { next(e); }
  }
);

// POST /api/auth/reinitialiser-mot-de-passe : vérifie le code puis enregistre le nouveau mot de passe (BF04, RG05, RG02, RG03)
router.post(
  '/reinitialiser-mot-de-passe',
  [
    body('email').trim().isEmail().withMessage('Adresse e-mail invalide'),
    body('code').trim().matches(/^\d{6}$/).withMessage('Le code doit contenir 6 chiffres'),
    body('nouveau_mot_de_passe').matches(POLITIQUE_MDP)
      .withMessage('Le mot de passe doit contenir au moins 8 caractères, dont une majuscule, une minuscule et un chiffre'),
    body('confirmation').custom((valeur, { req }) => valeur === req.body.nouveau_mot_de_passe)
      .withMessage('La confirmation est différente du mot de passe'),
  ],
  async (req, res, next) => {
    const erreurs = validationResult(req);
    if (!erreurs.isEmpty()) return res.status(400).json({ erreurs: erreurs.array() });

    try {
      const { email, code, nouveau_mot_de_passe } = req.body;
      const [rows] = await db.query(
        'SELECT id_utilisateur, code_reinitialisation, expiration_code FROM utilisateur WHERE email = ?',
        [email]
      );
      const user = rows[0];
      const messageErreur = { message: 'Code invalide ou expiré' };

      // Même message dans tous les cas d'échec (e-mail inconnu, code faux, code expiré)
      if (!user || !user.code_reinitialisation || !user.expiration_code) return res.status(400).json(messageErreur);
      const [[{ valide }]] = await db.query('SELECT (? > NOW()) AS valide', [user.expiration_code]);
      if (!valide) return res.status(400).json(messageErreur);
      const ok = await bcrypt.compare(code, user.code_reinitialisation);
      if (!ok) return res.status(400).json(messageErreur);

      // Le code ne sert qu'une fois (RG05) : on l'efface en même temps que le mot de passe est changé (RG03)
      const hash = await bcrypt.hash(nouveau_mot_de_passe, 10);
      await db.query(
        'UPDATE utilisateur SET mot_de_passe = ?, code_reinitialisation = NULL, expiration_code = NULL WHERE id_utilisateur = ?',
        [hash, user.id_utilisateur]
      );
      res.json({ message: 'Mot de passe réinitialisé. Vous pouvez vous connecter.' });
    } catch (e) { next(e); }
  }
);
module.exports = router;
