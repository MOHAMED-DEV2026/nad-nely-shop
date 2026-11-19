// Crée (ou met à jour) le compte administrateur avec un mot de passe haché (RG03).
// Utilisation : npm run creer-admin -- ton@email.com TonMotDePasse
require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('../src/config/db');

// RG02 : 8 caractères minimum, dont une majuscule, une minuscule et un chiffre
const POLITIQUE_MDP = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

(async () => {
  const [email, motDePasse] = process.argv.slice(2);
  if (!email || !motDePasse) {
    console.log('Utilisation : npm run creer-admin -- email motdepasse');
    process.exit(1);
  }
  if (!POLITIQUE_MDP.test(motDePasse)) {
    console.log('Mot de passe refusé : 8 caractères minimum, dont une majuscule, une minuscule et un chiffre.');
    process.exit(1);
  }
  const hash = await bcrypt.hash(motDePasse, 10);
  await db.query(
    `INSERT INTO utilisateur (nom, prenom, email, mot_de_passe, role, email_verifie)
     VALUES ('Administrateur', 'NAD-NELY', ?, ?, 'admin', 1)
     ON DUPLICATE KEY UPDATE mot_de_passe = VALUES(mot_de_passe), role = 'admin', email_verifie = 1`,
    [email, hash]
  );
  console.log('Compte administrateur prêt :', email);
  process.exit(0);
})();