// Contrôleur « authentification » : lit la requête, appelle le service, choisit le code HTTP.
const authService = require('../services/auth.service');

async function inscription(req, res, next) {
  try {
    const r = await authService.inscrire(req.body);
    if (!r.success) return res.status(409).json({ message: 'Cette adresse e-mail est déjà utilisée' });
    res.status(201).json(r.data);
  } catch (e) { next(e); }
}

async function connexion(req, res, next) {
  try {
    const r = await authService.connecter(req.body);
    if (!r.success) return res.status(401).json({ message: 'E-mail ou mot de passe incorrect' });
    res.json(r.data);
  } catch (e) { next(e); }
}

async function motDePasseOublie(req, res, next) {
  try {
    await authService.demanderCodeReinitialisation(req.body.email);
    res.json({ message: 'Si cette adresse correspond à un compte, un code vient d’être envoyé par e-mail.' });
  } catch (e) { next(e); }
}

async function reinitialiserMotDePasse(req, res, next) {
  try {
    const r = await authService.reinitialiserMotDePasse(req.body);
    if (!r.success) return res.status(400).json({ message: 'Code invalide ou expiré' });
    res.json({ message: 'Mot de passe réinitialisé. Vous pouvez vous connecter.' });
  } catch (e) { next(e); }
}

module.exports = { inscription, connexion, motDePasseOublie, reinitialiserMotDePasse };
