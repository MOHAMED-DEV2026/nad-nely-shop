// Crée un fichier HTML par e-mail dans le dossier « apercu-emails », pour les regarder dans le navigateur
// sans rien envoyer. Utilisation : npm run apercu-mails
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { EXEMPLES } = require('./exemplesEmails');

const dossier = path.join(__dirname, '..', 'apercu-emails');
fs.mkdirSync(dossier, { recursive: true });

const liens = [];
for (const [nom, creer] of Object.entries(EXEMPLES)) {
  const message = creer();
  fs.writeFileSync(path.join(dossier, `${nom}.html`), message.html);
  liens.push(`<li><a href="${nom}.html">${nom}</a> : ${message.sujet}</li>`);
}
fs.writeFileSync(
  path.join(dossier, 'index.html'),
  `<!doctype html><meta charset="utf-8"><title>Aperçu des e-mails</title>
<body style="font-family:Arial,sans-serif;padding:24px;line-height:1.8"><h1>E-mails de NAD-NELY Shop</h1><ul>${liens.join('')}</ul></body>`,
);
console.log(`✓ ${liens.length} aperçus créés. Ouvrez : ${path.join(dossier, 'index.html')}`);
