const nodemailer = require('nodemailer');

// Serveur d'envoi des e-mails :
// - en production : le SMTP réel (variables SMTP_*, par exemple Gmail), les clients reçoivent vraiment les messages ;
// - en développement : la boîte de test Mailtrap (variables MAILTRAP_*), aucun vrai client ne les reçoit.
const smtp = process.env.SMTP_HOST
  ? {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    }
  : {
      host: process.env.MAILTRAP_HOST || 'sandbox.smtp.mailtrap.io',
      port: Number(process.env.MAILTRAP_PORT) || 2525,
      auth: { user: process.env.MAILTRAP_USER, pass: process.env.MAILTRAP_PASS },
    };
const transport = nodemailer.createTransport(smtp);
const EXPEDITEUR = process.env.SMTP_FROM || '"NAD-NELY Shop" <no-reply@nadnely-shop.test>';

// Adresse de la boutique : reçoit les alertes (nouvelle commande, stock bas...) et les messages du formulaire de contact
const EMAIL_ADMIN = process.env.ADMIN_EMAIL || process.env.SMTP_USER || 'admin@nadnely-shop.test';

// Envoie un message construit par emails/messages.js ({ sujet, html, texte }).
// « repondreA » : adresse utilisée quand on clique sur « Répondre » (formulaire de contact).
async function envoyer(destinataire, message, repondreA) {
  await transport.sendMail({
    from: EXPEDITEUR,
    to: destinataire,
    replyTo: repondreA,
    subject: message.sujet,
    text: message.texte,
    html: message.html,
  });
}

module.exports = { envoyer, EMAIL_ADMIN };
