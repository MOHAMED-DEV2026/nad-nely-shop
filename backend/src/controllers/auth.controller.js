// Contrôleur « authentification » : lit la requête, appelle le service, choisit le code HTTP.
const authService = require('../services/auth.service');

async function inscription(req, res, next) {
  try {
    const r = await authService.inscrire(req.body);
    if (!r.success) return res.status(409).json({ message: 'Cette adresse e-mail est déjà utilisée' });
    res.status(201).json({ ...r.data, message: 'Un code de vérification vient d’être envoyé par e-mail.' });
  } catch (e) { next(e); }
}

async function verifierEmail(req, res, next) {
  try {
    const r = await authService.verifierEmail(req.body);
    if (!r.success) return res.status(400).json({ message: 'Code invalide ou expiré' });
    res.json(r.data);
  } catch (e) { next(e); }
}

async function renvoyerCode(req, res, next) {
  try {
    await authService.renvoyerCodeVerification(req.body.email);
    res.json({ message: 'Si un compte attend une vérification, un nouveau code vient d’être envoyé par e-mail.' });
  } catch (e) { next(e); }
}

async function connexion(req, res, next) {
  try {
    const r = await authService.connecter(req.body);
    if (r.error === 'EMAIL_NON_VERIFIE') {
      return res.status(403).json({
        code: 'EMAIL_NON_VERIFIE',
        message: 'Votre adresse e-mail n’est pas encore vérifiée. Un nouveau code vient de vous être envoyé.',
      });
    }
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

module.exports = { inscription, verifierEmail, renvoyerCode, connexion, motDePasseOublie, reinitialiserMotDePasse };
