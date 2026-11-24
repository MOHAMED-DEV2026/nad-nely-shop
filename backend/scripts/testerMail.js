// Envoie un e-mail de test, pour contrôler la configuration SMTP du fichier .env.
// Utilisation :
//   npm run tester-mail -- destinataire@exemple.com              (code de vérification)
//   npm run tester-mail -- destinataire@exemple.com bienvenue    (un modèle précis)
//   npm run tester-mail -- destinataire@exemple.com tous         (tous les modèles)
require('dotenv').config();
const { envoyer } = require('../src/config/mailer');
const { EXEMPLES } = require('./exemplesEmails');

(async () => {
  const [destinataire, choix = 'code-verification'] = process.argv.slice(2);
  if (!destinataire) {
    console.log('Utilisation : npm run tester-mail -- destinataire@exemple.com [modèle | tous]');
    console.log(`Modèles : ${Object.keys(EXEMPLES).join(', ')}`);
    process.exit(1);
  }
  const noms = choix === 'tous' ? Object.keys(EXEMPLES) : [choix];
  if (!noms.every((n) => EXEMPLES[n])) {
    console.log(`Modèle inconnu « ${choix} ». Modèles : ${Object.keys(EXEMPLES).join(', ')}`);
    process.exit(1);
  }

  console.log(`Serveur d'envoi : ${process.env.SMTP_HOST || 'Mailtrap (test, aucun vrai client ne reçoit)'}`);
  try {
    for (const nom of noms) {
      await envoyer(destinataire, EXEMPLES[nom]());
      console.log(`✓ ${nom} envoyé à ${destinataire}`);
    }
    console.log('Regardez aussi dans les courriers indésirables.');
    process.exit(0);
  } catch (erreur) {
    console.error('✗ Envoi impossible :', erreur.message);
    process.exit(1);
  }
})();
