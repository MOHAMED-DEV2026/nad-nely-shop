// Modèle « utilisateur » : les requêtes SQL sur la table utilisateur. Aucune règle métier ici.
const db = require('../config/db');

// Un utilisateur complet par e-mail (mot de passe haché compris), ou null
async function trouverParEmail(email) {
  const [rows] = await db.query('SELECT * FROM utilisateur WHERE email = ?', [email]);
  return rows[0] ?? null;
}

// Les informations publiques d'un compte, ou null
async function trouverProfilParId(id) {
  const [rows] = await db.query(
    'SELECT id_utilisateur, nom, prenom, email, telephone, role, date_inscription FROM utilisateur WHERE id_utilisateur = ?',
    [id]
  );
  return rows[0] ?? null;
}

// Le mot de passe haché d'un compte, ou null
async function trouverMotDePasseParId(id) {
  const [rows] = await db.query('SELECT mot_de_passe FROM utilisateur WHERE id_utilisateur = ?', [id]);
  return rows[0]?.mot_de_passe ?? null;
}

// Crée un client et renvoie son identifiant
async function creer({ nom, prenom, email, telephone, motDePasseHache }) {
  const [r] = await db.query(
    'INSERT INTO utilisateur (nom, prenom, email, telephone, mot_de_passe) VALUES (?, ?, ?, ?, ?)',
    [nom, prenom, email, telephone || null, motDePasseHache]
  );
  return r.insertId;
}

async function modifierProfil(id, { nom, prenom, telephone }) {
  await db.query(
    'UPDATE utilisateur SET nom = ?, prenom = ?, telephone = ? WHERE id_utilisateur = ?',
    [nom, prenom, telephone || null, id]
  );
}

async function modifierMotDePasse(id, motDePasseHache) {
  await db.query('UPDATE utilisateur SET mot_de_passe = ? WHERE id_utilisateur = ?', [motDePasseHache, id]);
}

// RG05 : enregistre le code (haché) de réinitialisation, valable 15 minutes
async function enregistrerCode(id, codeHache) {
  await db.query(
    'UPDATE utilisateur SET code_reinitialisation = ?, expiration_code = DATE_ADD(NOW(), INTERVAL 15 MINUTE) WHERE id_utilisateur = ?',
    [codeHache, id]
  );
}

// Inscription d'une adresse déjà enregistrée mais jamais vérifiée : on remplace les informations
// (seul le vrai propriétaire de l'adresse pourra valider le compte avec le code reçu)
async function remplacerNonVerifie(id, { nom, prenom, telephone, motDePasseHache }) {
  await db.query(
    'UPDATE utilisateur SET nom = ?, prenom = ?, telephone = ?, mot_de_passe = ? WHERE id_utilisateur = ? AND email_verifie = 0',
    [nom, prenom, telephone || null, motDePasseHache, id]
  );
}

// Enregistre le code (haché) de vérification de l'adresse e-mail, valable 15 minutes
async function enregistrerCodeVerification(id, codeHache) {
  await db.query(
    'UPDATE utilisateur SET code_verification = ?, expiration_verification = DATE_ADD(NOW(), INTERVAL 15 MINUTE) WHERE id_utilisateur = ?',
    [codeHache, id]
  );
}

// L'adresse est vérifiée : le code est effacé (il ne sert qu'une fois)
async function marquerEmailVerifie(id) {
  await db.query(
    'UPDATE utilisateur SET email_verifie = 1, code_verification = NULL, expiration_verification = NULL WHERE id_utilisateur = ?',
    [id]
  );
}

// Vrai si la date d'expiration est encore dans le futur (comparaison faite par la base, avec son horloge)
async function dateEstFuture(date) {
  const [[{ valide }]] = await db.query('SELECT (? > NOW()) AS valide', [date]);
  return Boolean(valide);
}

// RG05, RG03 : nouveau mot de passe, et le code est effacé (il ne sert qu'une fois).
// Le code a été reçu par e-mail : l'adresse est donc vérifiée par la même occasion.
async function reinitialiserMotDePasse(id, motDePasseHache) {
  await db.query(
    'UPDATE utilisateur SET mot_de_passe = ?, code_reinitialisation = NULL, expiration_code = NULL, email_verifie = 1 WHERE id_utilisateur = ?',
    [motDePasseHache, id]
  );
}

// Administration (BF24) : une page de clients, avec le nombre total et le nombre de commandes de chacun.
// RG04 : seuls les comptes de rôle « client » apparaissent.
// RG03 : on ne sélectionne jamais le mot de passe ni le code de réinitialisation.
async function chercherClients(recherche, page, parPage) {
  const conditions = ["u.role = 'client'"];
  const valeurs = [];
  if (recherche) {
    conditions.push('(u.nom LIKE ? OR u.prenom LIKE ? OR u.email LIKE ?)');
    const motif = `%${recherche}%`;
    valeurs.push(motif, motif, motif);
  }
  const where = conditions.join(' AND ');

  const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM utilisateur u WHERE ${where}`, valeurs);
  const [clients] = await db.query(
    `SELECT u.id_utilisateur, u.nom, u.prenom, u.email, u.telephone, u.date_inscription,
            COUNT(c.id_commande) AS nb_commandes
     FROM utilisateur u
     LEFT JOIN commande c ON c.id_utilisateur = u.id_utilisateur
     WHERE ${where}
     GROUP BY u.id_utilisateur
     ORDER BY u.date_inscription DESC, u.id_utilisateur DESC
     LIMIT ? OFFSET ?`,
    [...valeurs, parPage, (page - 1) * parPage]
  );
  return { total, clients };
}

// Administration : un compte avec son rôle et son nombre de commandes, ou null
async function trouverAvecNbCommandes(id) {
  const [rows] = await db.query(
    `SELECT u.id_utilisateur, u.role, COUNT(c.id_commande) AS nb_commandes
     FROM utilisateur u
     LEFT JOIN commande c ON c.id_utilisateur = u.id_utilisateur
     WHERE u.id_utilisateur = ?
     GROUP BY u.id_utilisateur`,
    [id]
  );
  return rows[0] ?? null;
}

// Supprime un compte client (jamais un administrateur). Renvoie le nombre de lignes supprimées.
async function supprimerClient(id) {
  const [r] = await db.query("DELETE FROM utilisateur WHERE id_utilisateur = ? AND role = 'client'", [id]);
  return r.affectedRows;
}

module.exports = {
  trouverAvecNbCommandes, supprimerClient,
  chercherClients, trouverParEmail, trouverProfilParId, trouverMotDePasseParId, creer,
  modifierProfil, modifierMotDePasse, enregistrerCode, dateEstFuture, reinitialiserMotDePasse,
  remplacerNonVerifie, enregistrerCodeVerification, marquerEmailVerifie,
};
