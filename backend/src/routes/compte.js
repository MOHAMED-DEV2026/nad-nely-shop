const router = require('express').Router();
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const db = require('../config/db');
const { exigerConnexion } = require('../middlewares/auth');

// RG02 : 8 caractères minimum, dont une majuscule, une minuscule et un chiffre
const POLITIQUE_MDP = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

// Toutes les routes de ce fichier demandent d'être connecté
router.use(exigerConnexion);

// GET /api/compte : lire ses informations (BF05)
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      'SELECT id_utilisateur, nom, prenom, email, telephone, role, date_inscription FROM utilisateur WHERE id_utilisateur = ?',
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Compte introuvable' });
    res.json(rows[0]);
  } catch (e) { next(e); }
});

// PUT /api/compte : modifier nom, prénom et téléphone (l'e-mail n'est pas modifiable)
router.put(
  '/',
  [
    body('nom').trim().notEmpty().withMessage('Le nom est obligatoire').isLength({ max: 50 }),
    body('prenom').trim().notEmpty().withMessage('Le prénom est obligatoire').isLength({ max: 50 }),
    body('telephone').optional({ values: 'falsy' }).trim().isLength({ max: 20 }),
  ],
  async (req, res, next) => {
    const erreurs = validationResult(req);
    if (!erreurs.isEmpty()) return res.status(400).json({ erreurs: erreurs.array() });

    try {
      const { nom, prenom, telephone } = req.body;
      await db.query(
        'UPDATE utilisateur SET nom = ?, prenom = ?, telephone = ? WHERE id_utilisateur = ?',
        [nom, prenom, telephone || null, req.user.id]
      );
      res.json({ message: 'Informations mises à jour', nom, prenom, telephone: telephone || null });
    } catch (e) { next(e); }
  }
);

// PUT /api/compte/mot-de-passe : changer son mot de passe (ancien puis nouveau)
router.put(
  '/mot-de-passe',
  [
    body('ancien_mot_de_passe').notEmpty().withMessage('Saisis ton mot de passe actuel'),
    body('nouveau_mot_de_passe').matches(POLITIQUE_MDP)
      .withMessage('Le mot de passe doit contenir au moins 8 caractères, dont une majuscule, une minuscule et un chiffre'),
  ],
  async (req, res, next) => {
    const erreurs = validationResult(req);
    if (!erreurs.isEmpty()) return res.status(400).json({ erreurs: erreurs.array() });

    try {
      const { ancien_mot_de_passe, nouveau_mot_de_passe } = req.body;
      const [rows] = await db.query('SELECT mot_de_passe FROM utilisateur WHERE id_utilisateur = ?', [req.user.id]);
      if (rows.length === 0) return res.status(404).json({ message: 'Compte introuvable' });

      const ok = await bcrypt.compare(ancien_mot_de_passe, rows[0].mot_de_passe);
      if (!ok) return res.status(400).json({ message: 'Le mot de passe actuel est incorrect' });

      // RG03 : le nouveau mot de passe est haché, jamais stocké en clair
      const hash = await bcrypt.hash(nouveau_mot_de_passe, 10);
      await db.query('UPDATE utilisateur SET mot_de_passe = ? WHERE id_utilisateur = ?', [hash, req.user.id]);
      res.json({ message: 'Mot de passe modifié' });
    } catch (e) { next(e); }
  }
);

module.exports = router;