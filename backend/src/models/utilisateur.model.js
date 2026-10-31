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

// Vrai si la date d'expiration est encore dans le futur (comparaison faite par la base, avec son horloge)
async function dateEstFuture(date) {
  const [[{ valide }]] = await db.query('SELECT (? > NOW()) AS valide', [date]);
  return Boolean(valide);
}

// RG05, RG03 : nouveau mot de passe, et le code est effacé (il ne sert qu'une fois)
async function reinitialiserMotDePasse(id, motDePasseHache) {
  await db.query(
    'UPDATE utilisateur SET mot_de_passe = ?, code_reinitialisation = NULL, expiration_code = NULL WHERE id_utilisateur = ?',
    [motDePasseHache, id]
  );
}

module.exports = {
  trouverParEmail, trouverProfilParId, trouverMotDePasseParId, creer,
  modifierProfil, modifierMotDePasse, enregistrerCode, dateEstFuture, reinitialiserMotDePasse,
};
