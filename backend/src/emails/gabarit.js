// Gabarit commun à tous les e-mails, aux couleurs du site (bleu marine, or, crème).
// Un message est décrit par des « blocs » (paragraphe, code, bouton, commande...) :
// le même contenu donne la version HTML (jolie) et la version texte (lue par les messageries simples).
// Le HTML des e-mails n'accepte que des tableaux et des styles écrits dans chaque balise.

const C = {
  marine: '#1B2A4A', or: '#C9A44C', rose: '#F3D6DC', creme: '#FAF8F5', blanc: '#FFFFFF',
  texte: '#222222', texteDoux: '#555555', bordure: '#E8E2D8', beige: '#F3EEE3', bleuClair: '#DCE3F0',
  lignePied: '#34456B', succesFond: '#DDF0DE', succesTexte: '#1B5E20', alerteFond: '#FFE9CC',
  alerteTexte: '#7A3E00', erreurFond: '#F8D9D9', erreurTexte: '#8E1B1B',
};
const TITRE = "'Playfair Display', Georgia, 'Times New Roman', serif";
const TEXTE = "'Poppins', 'Segoe UI', Arial, Helvetica, sans-serif";

// Adresse du site (liens des boutons) et du logo (doit être en ligne pour s'afficher dans Gmail)
const URL_SITE = (process.env.FRONT_URL || 'http://localhost:5173').replace(/\/$/, '');
const URL_LOGO = process.env.EMAIL_LOGO_URL || 'https://nad-nely.alwaysdata.net/logo.png';

// Empêche un nom ou un message saisi par un visiteur d'injecter du HTML dans l'e-mail
function echapper(valeur) {
  return String(valeur ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Texte échappé, avec **gras** et retours à la ligne
function enrichir(texte) {
  return echapper(texte).replace(/\*\*(.+?)\*\*/g, `<strong style="color:${C.marine};">$1</strong>`).replace(/\n/g, '<br>');
}
const sansGras = (texte) => String(texte ?? '').replace(/\*\*(.+?)\*\*/g, '$1');

function prix(montant) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(montant));
}

function date(valeur) {
  return new Date(valeur).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Indian/Mayotte',
  });
}

const lien = (chemin) => URL_SITE + chemin;

// ---------- Rendu HTML de chaque type de bloc ----------

const P = `margin:0 0 16px;font-family:${TEXTE};font-size:15px;line-height:1.6;color:${C.texte};`;

const html = {
  p: (b) => `<p style="${P}">${enrichir(b.texte)}</p>`,

  code: (b) => `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;">
      <tr><td align="center" style="background:${C.bleuClair};border:2px dashed ${C.or};border-radius:12px;padding:22px 12px;">
        <div style="font-family:${TEXTE};font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${C.marine};margin-bottom:6px;">Votre code</div>
        <div style="font-family:${TEXTE};font-size:36px;font-weight:600;letter-spacing:12px;color:${C.marine};padding-left:12px;">${echapper(b.code)}</div>
      </td></tr>
    </table>`,

  bouton: (b) => `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px auto 24px;">
      <tr><td align="center" bgcolor="${b.or ? C.or : C.marine}" style="border-radius:8px;">
        <a href="${echapper(b.url)}" target="_blank" style="display:inline-block;padding:14px 32px;font-family:${TEXTE};font-size:15px;font-weight:600;color:${b.or ? C.marine : C.blanc};text-decoration:none;border-radius:8px;">${echapper(b.texte)}</a>
      </td></tr>
    </table>`,

  // Encadré coloré : ton « info », « succes », « alerte » ou « erreur »
  encadre: (b) => {
    const tons = {
      info: [C.bleuClair, C.marine], succes: [C.succesFond, C.succesTexte],
      alerte: [C.alerteFond, C.alerteTexte], erreur: [C.erreurFond, C.erreurTexte],
    };
    const [fond, couleur] = tons[b.ton] || tons.info;
    return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
      <tr><td style="background:${fond};border-radius:8px;padding:14px 16px;font-family:${TEXTE};font-size:14px;line-height:1.6;color:${couleur};">${enrichir(b.texte)}</td></tr>
    </table>`;
  },

  // Liste « libellé : valeur » (coordonnées, adresse, informations du compte...)
  infos: (b) => `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;background:${C.creme};border:1px solid ${C.bordure};border-radius:12px;">
      ${b.titre ? `<tr><td colspan="2" style="padding:14px 16px 4px;font-family:${TITRE};font-size:17px;font-weight:700;color:${C.marine};">${echapper(b.titre)}</td></tr>` : ''}
      ${b.lignes.map(([libelle, valeur]) => `
      <tr>
        <td valign="top" style="padding:6px 16px;font-family:${TEXTE};font-size:13px;color:${C.texteDoux};width:40%;">${echapper(libelle)}</td>
        <td valign="top" style="padding:6px 16px;font-family:${TEXTE};font-size:14px;color:${C.texte};font-weight:500;">${enrichir(valeur)}</td>
      </tr>`).join('')}
      <tr><td colspan="2" style="height:8px;line-height:8px;font-size:0;">&nbsp;</td></tr>
    </table>`,

  // Récapitulatif d'une commande : articles, quantités, total
  commande: (b) => `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border:1px solid ${C.bordure};border-radius:12px;">
      <tr><td colspan="2" style="padding:14px 16px;background:${C.marine};border-radius:11px 11px 0 0;font-family:${TITRE};font-size:17px;font-weight:700;color:${C.creme};">
        Commande n° ${echapper(b.commande.id_commande)}
        <span style="font-family:${TEXTE};font-size:12px;font-weight:400;color:${C.or};">&nbsp;·&nbsp;${echapper(date(b.commande.date_commande))}</span>
      </td></tr>
      ${b.lignes.map((l) => `
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid ${C.bordure};font-family:${TEXTE};font-size:14px;color:${C.texte};">
          ${echapper(l.nom)}<br><span style="font-size:12px;color:${C.texteDoux};">${echapper(l.quantite)} × ${echapper(prix(l.prix_unitaire))}</span>
        </td>
        <td align="right" style="padding:12px 16px;border-bottom:1px solid ${C.bordure};font-family:${TEXTE};font-size:14px;color:${C.texte};white-space:nowrap;">${echapper(prix(l.sous_total))}</td>
      </tr>`).join('')}
      <tr>
        <td style="padding:14px 16px;font-family:${TITRE};font-size:17px;font-weight:700;color:${C.marine};">Total</td>
        <td align="right" style="padding:14px 16px;font-family:${TITRE};font-size:20px;font-weight:700;color:${C.or};white-space:nowrap;">${echapper(prix(b.commande.montant_total))}</td>
      </tr>
    </table>`,

  // Suivi de commande : étapes passées en or, étapes à venir en gris
  suivi: (b) => `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 24px;">
      <tr>
        ${b.etapes.map((etape, i) => {
          const faite = i <= b.actuelle;
          return `<td align="center" valign="top" width="${Math.floor(100 / b.etapes.length)}%" style="padding:0 4px;">
            <div style="width:34px;height:34px;line-height:34px;border-radius:17px;margin:0 auto 8px;text-align:center;font-family:${TEXTE};font-size:15px;font-weight:600;background:${faite ? C.or : C.bordure};color:${faite ? C.marine : C.texteDoux};">${faite ? '✓' : i + 1}</div>
            <div style="font-family:${TEXTE};font-size:12px;line-height:1.3;color:${faite ? C.marine : C.texteDoux};font-weight:${i === b.actuelle ? 600 : 400};">${echapper(etape)}</div>
          </td>`;
        }).join('')}
      </tr>
    </table>`,

  // Petit texte en bas du message (sécurité, explications)
  note: (b) => `<p style="margin:8px 0 0;font-family:${TEXTE};font-size:12px;line-height:1.6;color:${C.texteDoux};">${enrichir(b.texte)}</p>`,

  separateur: () => `<div style="height:1px;background:${C.bordure};margin:8px 0 20px;line-height:1px;font-size:0;">&nbsp;</div>`,
};

// ---------- Rendu texte de chaque type de bloc ----------

const texte = {
  p: (b) => sansGras(b.texte),
  code: (b) => `Votre code : ${b.code}`,
  bouton: (b) => `${b.texte} : ${b.url}`,
  encadre: (b) => sansGras(b.texte),
  infos: (b) => [b.titre, ...b.lignes.map(([l, v]) => `${l} : ${sansGras(v)}`)].filter(Boolean).join('\n'),
  commande: (b) => [
    `Commande n° ${b.commande.id_commande} du ${date(b.commande.date_commande)}`,
    ...b.lignes.map((l) => `- ${l.nom} : ${l.quantite} × ${prix(l.prix_unitaire)} = ${prix(l.sous_total)}`),
    `Total : ${prix(b.commande.montant_total)}`,
  ].join('\n'),
  suivi: (b) => `Suivi : ${b.etapes.map((e, i) => (i === b.actuelle ? `[${e}]` : e)).join(' > ')}`,
  note: (b) => sansGras(b.texte),
  separateur: () => '----------',
};

// Construit l'e-mail complet. « pourAdmin » change le pied de page (message interne à la boutique).
function construire({ sujet, apercu, titre, blocs, pourAdmin = false }) {
  const corps = blocs.map((b) => html[b.type](b)).join('\n');
  const raison = pourAdmin
    ? 'Message interne envoyé automatiquement par le site NAD-NELY Shop.'
    : 'Vous recevez cet e-mail car vous avez un compte sur NAD-NELY Shop. Une question ? Répondez simplement à ce message.';

  const page = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${echapper(sujet)}</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Poppins:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  body { margin:0; padding:0; }
  a { color:${C.marine}; }
  @media (max-width: 620px) {
    .conteneur { width:100% !important; }
    .contenu { padding:28px 20px !important; }
    .titre { font-size:24px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${C.creme};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.creme};">${echapper(apercu || '')}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${C.creme}" style="background:${C.creme};">
  <tr><td align="center" style="padding:24px 12px;">
    <table role="presentation" class="conteneur" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;">

      <!-- Bandeau du haut, comme sur le site -->
      <tr><td align="center" style="background:${C.marine};border-radius:16px 16px 0 0;padding:9px 16px;font-family:${TEXTE};font-size:12px;color:${C.creme};">
        Boutique en ligne · Mamoudzou, Mayotte
      </td></tr>

      <!-- En-tête : logo et nom de la boutique -->
      <tr><td align="center" style="background:${C.blanc};padding:26px 24px 20px;border-left:1px solid ${C.bordure};border-right:1px solid ${C.bordure};border-bottom:3px solid ${C.or};">
        <a href="${lien('/')}" target="_blank" style="text-decoration:none;">
          <img src="${echapper(URL_LOGO)}" width="84" height="84" alt="NAD-NELY Shop" style="display:block;margin:0 auto 10px;width:84px;height:84px;border-radius:14px;border:0;">
          <span style="font-family:${TITRE};font-size:24px;font-weight:700;color:${C.marine};">NAD-NELY Shop</span>
        </a>
      </td></tr>

      <!-- Contenu du message -->
      <tr><td class="contenu" style="background:${C.blanc};padding:36px 44px 32px;border-left:1px solid ${C.bordure};border-right:1px solid ${C.bordure};">
        <h1 class="titre" style="margin:0 0 20px;font-family:${TITRE};font-size:28px;line-height:1.25;font-weight:700;color:${C.marine};">${echapper(titre)}</h1>
        ${corps}
      </td></tr>

      <!-- Pied de page, comme sur le site -->
      <tr><td align="center" style="background:${C.marine};border-radius:0 0 16px 16px;padding:28px 24px 22px;">
        <div style="font-family:${TITRE};font-size:22px;color:${C.or};margin-bottom:6px;">NAD-NELY Shop</div>
        <div style="font-family:${TEXTE};font-size:13px;color:${C.creme};margin-bottom:16px;">Boutique en ligne basée à Mamoudzou, Mayotte.</div>
        <div style="font-family:${TEXTE};font-size:13px;margin-bottom:18px;">
          <a href="${lien('/catalogue')}" target="_blank" style="color:${C.or};text-decoration:none;">Boutique</a>
          <span style="color:${C.lignePied};">&nbsp;&nbsp;|&nbsp;&nbsp;</span>
          <a href="${lien('/mon-compte')}" target="_blank" style="color:${C.or};text-decoration:none;">Mon compte</a>
          <span style="color:${C.lignePied};">&nbsp;&nbsp;|&nbsp;&nbsp;</span>
          <a href="${lien('/contact')}" target="_blank" style="color:${C.or};text-decoration:none;">Contact</a>
        </div>
        <div style="border-top:1px solid ${C.lignePied};padding-top:14px;font-family:${TEXTE};font-size:11px;line-height:1.6;color:#B8C0D0;">
          ${echapper(raison)}<br>© ${new Date().getFullYear()} NAD-NELY Shop
        </div>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;

  const version_texte = [
    titre, '', ...blocs.map((b) => texte[b.type](b)).flatMap((t) => [t, '']),
    '--', 'NAD-NELY Shop · Boutique en ligne basée à Mamoudzou, Mayotte', URL_SITE,
  ].join('\n');

  return { sujet, html: page, texte: version_texte };
}

module.exports = { construire, lien, prix, date };
