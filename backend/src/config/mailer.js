const nodemailer = require('nodemailer');

// En développement, les e-mails vont dans la boîte de test Mailtrap (aucun vrai client ne les reçoit)
const transport = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST || 'sandbox.smtp.mailtrap.io',
  port: Number(process.env.MAILTRAP_PORT) || 2525,
  auth: { user: process.env.MAILTRAP_USER, pass: process.env.MAILTRAP_PASS },
});

// Envoie le code de réinitialisation du mot de passe (BF04)
async function envoyerCodeReinitialisation(destinataire, prenom, code) {
  await transport.sendMail({
    from: '"NAD-NELY Shop" <no-reply@nadnely-shop.test>',
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

module.exports = { envoyerCodeReinitialisation };