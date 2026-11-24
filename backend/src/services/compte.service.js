// Service « compte » : informations personnelles et mot de passe du client connecté.
// Chaque fonction renvoie { success, error, data }.
const bcrypt = require('bcrypt');
const utilisateurModel = require('../models/utilisateur.model');
const notifications = require('./notification.service');

// Alerte de sécurité par e-mail après une modification du compte (sans attendre l'envoi)
async function prevenir(idUtilisateur, envoi) {
  const profil = await utilisateurModel.trouverProfilParId(idUtilisateur);
  if (profil) envoi(profil);
}

// BF05 : lire ses informations
async function lire(idUtilisateur) {
  const profil = await utilisateurModel.trouverProfilParId(idUtilisateur);
  if (!profil) return { success: false, error: 'COMPTE_INTROUVABLE' };
  return { success: true, data: profil };
}

// Modifier nom, prénom et téléphone (l'e-mail n'est pas modifiable)
async function modifier(idUtilisateur, { nom, prenom, telephone }) {
  await utilisateurModel.modifierProfil(idUtilisateur, { nom, prenom, telephone });
  await prevenir(idUtilisateur, (p) => notifications.profilModifie(p.email, p));
  return { success: true, data: { nom, prenom, telephone: telephone || null } };
}

// Changer son mot de passe (ancien puis nouveau)
async function changerMotDePasse(idUtilisateur, { ancien_mot_de_passe, nouveau_mot_de_passe }) {
  const actuel = await utilisateurModel.trouverMotDePasseParId(idUtilisateur);
  if (!actuel) return { success: false, error: 'COMPTE_INTROUVABLE' };
  if (!(await bcrypt.compare(ancien_mot_de_passe, actuel))) {
    return { success: false, error: 'MOT_DE_PASSE_INCORRECT' };
  }
  // RG03 : le nouveau mot de passe est haché, jamais stocké en clair
  await utilisateurModel.modifierMotDePasse(idUtilisateur, await bcrypt.hash(nouveau_mot_de_passe, 10));
  await prevenir(idUtilisateur, (p) => notifications.motDePasseModifie(p.email, p.prenom));
  return { success: true };
}

module.exports = { lire, modifier, changerMotDePasse };
