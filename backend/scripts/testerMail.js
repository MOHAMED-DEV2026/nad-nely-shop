// Envoie un e-mail de vérification de test, pour contrôler la configuration SMTP du fichier .env.
// Utilisation : npm run tester-mail -- destinataire@exemple.com
require('dotenv').config();
const { envoyerCodeVerification } = require('../src/config/mailer');

(async () => {
  const destinataire = process.argv[2];
  if (!destinataire) {
    console.log('Utilisation : npm run tester-mail -- destinataire@exemple.com');
    process.exit(1);
  }
  console.log(`Serveur d'envoi : ${process.env.SMTP_HOST || 'Mailtrap (test, aucun vrai client ne reçoit)'}`);
  try {
    await envoyerCodeVerification(destinataire, 'Test', '123456');
    console.log(`✓ E-mail envoyé à ${destinataire} (regardez aussi dans les courriers indésirables)`);
    process.exit(0);
  } catch (erreur) {
    console.error('✗ Envoi impossible :', erreur.message);
    process.exit(1);
  }
})();
