// Service « authentification » : inscription, connexion, mot de passe oublié.
// Il ne connaît ni req ni res. Chaque fonction renvoie { success, error, data }.
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const utilisateurModel = require('../models/utilisateur.model');
const { envoyerCodeReinitialisation } = require('../config/mailer');

function creerJeton(id, role) {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '2h' });
}

// BF01 : crée un compte client puis renvoie un jeton
async function inscrire({ nom, prenom, email, telephone, mot_de_passe }) {
  const existant = await utilisateurModel.trouverParEmail(email);
  if (existant) return { success: false, error: 'EMAIL_DEJA_UTILISE' };

  // RG03 : le mot de passe est haché, jamais stocké en clair
  const motDePasseHache = await bcrypt.hash(mot_de_passe, 10);
  let id;
  try {
    id = await utilisateurModel.creer({ nom, prenom, email, telephone, motDePasseHache });
  } catch (e) {
    // Deux inscriptions simultanées avec le même e-mail : la base refuse la seconde
    if (e.code === 'ER_DUP_ENTRY') return { success: false, error: 'EMAIL_DEJA_UTILISE' };
    throw e;
  }
  return {
    success: true,
    data: { token: creerJeton(id, 'client'), utilisateur: { id, nom, prenom, role: 'client' } },
  };
}

// BF02 : vérifie les identifiants et renvoie un jeton
async function connecter({ email, mot_de_passe }) {
  const user = await utilisateurModel.trouverParEmail(email);
  // Même résultat dans les deux cas : on ne révèle pas si l'e-mail existe
  const ok = user && (await bcrypt.compare(mot_de_passe, user.mot_de_passe));
  if (!ok) return { success: false, error: 'IDENTIFIANTS_INCORRECTS' };

  return {
    success: true,
    data: {
      token: creerJeton(user.id_utilisateur, user.role),
      utilisateur: { id: user.id_utilisateur, nom: user.nom, prenom: user.prenom, role: user.role },
    },
  };
}

// BF04, RG05 : génère un code à 6 chiffres et l'envoie par e-mail.
// Le résultat est le même que le compte existe ou non : on ne révèle pas les adresses inscrites.
async function demanderCodeReinitialisation(email) {
  const user = await utilisateurModel.trouverParEmail(email);
  if (!user) return { success: true };

  // Code à 6 chiffres, stocké haché, valable 15 minutes (RG05)
  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  await utilisateurModel.enregistrerCode(user.id_utilisateur, await bcrypt.hash(code, 10));

  try {
    await envoyerCodeReinitialisation(email, user.prenom, code);
  } catch (erreurMail) {
    console.error('Envoi du code impossible :', erreurMail.message);
  }
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
  return { success: true };
}

module.exports = { inscrire, connecter, demanderCodeReinitialisation, reinitialiserMotDePasse };
