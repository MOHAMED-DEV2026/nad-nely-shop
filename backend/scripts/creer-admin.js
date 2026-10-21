// Crée (ou met à jour) le compte administrateur avec un mot de passe haché.
// Utilisation : npm run creer-admin -- ton@email.com TonMotDePasse
require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('../src/config/db');

(async () => {
  const [email, motDePasse] = process.argv.slice(2);
  if (!email || !motDePasse) {
    console.log('Utilisation : npm run creer-admin -- email motdepasse');
    process.exit(1);
  }
  const hash = await bcrypt.hash(motDePasse, 10);
  await db.query(
    `INSERT INTO UTILISATEUR (nom, prenom, email, mot_de_passe, role)
     VALUES ('Administrateur', 'NAD-NELY', ?, ?, 'admin')
     ON DUPLICATE KEY UPDATE mot_de_passe = VALUES(mot_de_passe), role = 'admin'`,
    [email, hash]
  );
  console.log('Compte administrateur prêt :', email);
  process.exit(0);
})();
