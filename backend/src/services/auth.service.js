// Service « authentification » : inscription, connexion, mot de passe oublié.
// Il ne connaît ni req ni res. Chaque fonction renvoie { success, error, data }.
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const utilisateurModel = require('../models/utilisateur.model');
const notifications = require('./notification.service');

// « seSouvenir » : connexion longue (30 jours par défaut) quand le client coche « Se souvenir de moi »
function creerJeton(id, role, seSouvenir = false) {
  const duree = seSouvenir
    ? process.env.JWT_EXPIRES_IN_SOUVENIR || '30d'
    : process.env.JWT_EXPIRES_IN || '2h';
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: duree });
}

function reponseSession(user, seSouvenir = false) {
  return {
    token: creerJeton(user.id_utilisateur, user.role, seSouvenir),
    utilisateur: { id: user.id_utilisateur, nom: user.nom, prenom: user.prenom, role: user.role },
  };
}

// Génère un code de vérification à 6 chiffres (stocké haché, valable 15 minutes) et l'envoie par e-mail.
// Un échec d'envoi n'arrête pas l'inscription (il est seulement journalisé) : le client peut demander un nouveau code.
async function envoyerNouveauCodeVerification(id, email, prenom) {
  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  await utilisateurModel.enregistrerCodeVerification(id, await bcrypt.hash(code, 10));
  await notifications.codeVerification(email, prenom, code);
}

// BF01 : crée un compte client (non vérifié) et envoie le code de vérification par e-mail.
// Aucun jeton n'est donné tant que l'adresse n'est pas vérifiée.
async function inscrire({ nom, prenom, email, telephone, mot_de_passe }) {
  // RG03 : le mot de passe est haché, jamais stocké en clair
  const motDePasseHache = await bcrypt.hash(mot_de_passe, 10);

  const existant = await utilisateurModel.trouverParEmail(email);
  let id;
  if (existant) {
    if (existant.email_verifie) return { success: false, error: 'EMAIL_DEJA_UTILISE' };
    // Compte jamais vérifié (inscription abandonnée, ou adresse saisie par quelqu'un d'autre) :
    // on reprend l'inscription avec les nouvelles informations
    id = existant.id_utilisateur;
    await utilisateurModel.remplacerNonVerifie(id, { nom, prenom, telephone, motDePasseHache });
  } else {
    try {
      id = await utilisateurModel.creer({ nom, prenom, email, telephone, motDePasseHache });
    } catch (e) {
      // Deux inscriptions simultanées avec le même e-mail : la base refuse la seconde
      if (e.code === 'ER_DUP_ENTRY') return { success: false, error: 'EMAIL_DEJA_UTILISE' };
      throw e;
    }
  }

  await envoyerNouveauCodeVerification(id, email, prenom);
  return { success: true, data: { email } };
}

// Vérifie le code reçu par e-mail : le compte est activé et le client est connecté
async function verifierEmail({ email, code }) {
  const user = await utilisateurModel.trouverParEmail(email);

  // Même résultat dans tous les cas d'échec (e-mail inconnu, déjà vérifié, code faux, code expiré)
  const echec = { success: false, error: 'CODE_INVALIDE' };
  if (!user || user.email_verifie || !user.code_verification || !user.expiration_verification) return echec;
  if (!(await utilisateurModel.dateEstFuture(user.expiration_verification))) return echec;
  if (!(await bcrypt.compare(code, user.code_verification))) return echec;

  await utilisateurModel.marquerEmailVerifie(user.id_utilisateur);
  notifications.bienvenue(email, user.prenom); // sans attendre l'envoi : le client est connecté tout de suite
  return { success: true, data: reponseSession(user) };
}

// Renvoie un nouveau code. Le résultat est toujours le même : on ne révèle pas les adresses inscrites.
async function renvoyerCodeVerification(email) {
  const user = await utilisateurModel.trouverParEmail(email);
  if (user && !user.email_verifie) await envoyerNouveauCodeVerification(user.id_utilisateur, email, user.prenom);
  return { success: true };
}

// BF02 : vérifie les identifiants et renvoie un jeton
async function connecter({ email, mot_de_passe, se_souvenir }) {
  const user = await utilisateurModel.trouverParEmail(email);
  // Même résultat dans les deux cas : on ne révèle pas si l'e-mail existe
  const ok = user && (await bcrypt.compare(mot_de_passe, user.mot_de_passe));
  if (!ok) return { success: false, error: 'IDENTIFIANTS_INCORRECTS' };

  // Bon mot de passe mais adresse jamais vérifiée : un nouveau code part par e-mail
  if (!user.email_verifie) {
    await envoyerNouveauCodeVerification(user.id_utilisateur, email, user.prenom);
    return { success: false, error: 'EMAIL_NON_VERIFIE' };
  }

  return { success: true, data: reponseSession(user, se_souvenir === true) };
}

// BF04, RG05 : génère un code à 6 chiffres et l'envoie par e-mail.
// Le résultat est le même que le compte existe ou non : on ne révèle pas les adresses inscrites.
async function demanderCodeReinitialisation(email) {
  const user = await utilisateurModel.trouverParEmail(email);
  if (!user) return { success: true };

  // Code à 6 chiffres, stocké haché, valable 15 minutes (RG05)
  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  await utilisateurModel.enregistrerCode(user.id_utilisateur, await bcrypt.hash(code, 10));

  await notifications.codeReinitialisation(email, user.prenom, code);
  return { success: true };
}

// BF04, RG05, RG02, RG03 : vérifie le code puis enregistre le nouveau mot de passe
async function reinitialiserMotDePasse({ email, code, nouveau_mot_de_passe }) {
  const user = await utilisateurModel.trouverParEmail(email);

  // Même résultat dans tous les cas d'échec (e-mail inconnu, code faux, code expiré)
  const echec = { success: false, error: 'CODE_INVALIDE' };
  if (!user || !user.code_reinitialisation || !user.expiration_code) return echec;
  if (!(await utilisateurModel.dateEstFuture(user.expiration_code))) return echec;
  if (!(await bcrypt.compare(code, user.code_reinitialisation))) return echec;

  // Le code ne sert qu'une fois (RG05) : on l'efface en même temps que le mot de passe est changé (RG03)
  await utilisateurModel.reinitialiserMotDePasse(user.id_utilisateur, await bcrypt.hash(nouveau_mot_de_passe, 10));
  notifications.motDePasseModifie(email, user.prenom); // alerte de sécurité, sans attendre l'envoi
  return { success: true };
}

module.exports = {
  inscrire, verifierEmail, renvoyerCodeVerification, connecter,
  demanderCodeReinitialisation, reinitialiserMotDePasse,
};
