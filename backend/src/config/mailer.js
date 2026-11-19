const nodemailer = require('nodemailer');

// Serveur d'envoi des e-mails :
// - en production : le SMTP de l'hébergeur (variables SMTP_*), les clients reçoivent vraiment les messages ;
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

// Envoie le code de réinitialisation du mot de passe (BF04)
async function envoyerCodeReinitialisation(destinataire, prenom, code) {
  await transport.sendMail({
    from: EXPEDITEUR,
    to: destinataire,
    subject: 'Votre code de réinitialisation – NAD-NELY Shop',
    text:
      `Bonjour ${prenom},\n\n` +
      `Voici votre code de réinitialisation : ${code}\n` +
      `Il est valable 15 minutes et ne peut servir qu'une seule fois.\n\n` +
      `Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.\n\n` +
      `NAD-NELY Shop`,
  });
}

// Envoie le code de vérification de l'adresse e-mail (inscription)
async function envoyerCodeVerification(destinataire, prenom, code) {
  await transport.sendMail({
    from: EXPEDITEUR,
    to: destinataire,
    subject: 'Confirmez votre adresse e-mail – NAD-NELY Shop',
    text:
      `Bonjour ${prenom},\n\n` +
      `Bienvenue sur NAD-NELY Shop ! Pour activer votre compte, saisissez ce code :\n\n` +
      `${code}\n\n` +
      `Il est valable 15 minutes et ne peut servir qu'une seule fois.\n\n` +
      `Si vous n'avez pas créé de compte, ignorez ce message.\n\n` +
      `NAD-NELY Shop`,
  });
}

module.exports = { envoyerCodeReinitialisation, envoyerCodeVerification };
