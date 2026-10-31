// Service « compte » : informations personnelles et mot de passe du client connecté.
// Chaque fonction renvoie { success, error, data }.
const bcrypt = require('bcrypt');
const utilisateurModel = require('../models/utilisateur.model');

// BF05 : lire ses informations
async function lire(idUtilisateur) {
  const profil = await utilisateurModel.trouverProfilParId(idUtilisateur);
  if (!profil) return { success: false, error: 'COMPTE_INTROUVABLE' };
  return { success: true, data: profil };
}

// Modifier nom, prénom et téléphone (l'e-mail n'est pas modifiable)
async function modifier(idUtilisateur, { nom, prenom, telephone }) {
  await utilisateurModel.modifierProfil(idUtilisateur, { nom, prenom, telephone });
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
  return { success: true };
}

module.exports = { lire, modifier, changerMotDePasse };
