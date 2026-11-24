// Contenu de chaque e-mail envoyé par le site. Chaque fonction renvoie { sujet, html, texte }.
// La mise en page (couleurs, logo, pied de page) est dans gabarit.js.
const { construire, lien, prix, date } = require('./gabarit');
const { statutAffiche } = require('../utils/statuts');

const SECURITE = "Si vous n'êtes pas à l'origine de cette demande, ignorez simplement ce message : votre compte reste protégé.";

// Lignes « Réception » d'une commande (livraison à domicile ou retrait en boutique)
function infosReception(c) {
  const lignes = c.mode_reception === 'livraison'
    ? [['Mode', 'Livraison à domicile'], ['Adresse', `${c.adresse_livraison}, ${c.commune_livraison}`]]
    : [['Mode', 'Retrait en boutique, à Mamoudzou']];
  if (c.telephone_contact) lignes.push(['Téléphone de contact', c.telephone_contact]);
  return { type: 'infos', titre: 'Réception de la commande', lignes };
}

// Étapes du suivi (RG34 : pour un retrait, « expédiée » devient « prête à retirer »)
function suivi(c) {
  const etapes = c.mode_reception === 'retrait'
    ? ['Payée', 'Prête à retirer', 'Retirée']
    : ['Payée', 'Expédiée', 'Livrée'];
  const actuelle = { confirmee: 0, expediee: 1, livree: 2 }[c.statut] ?? 0;
  return { type: 'suivi', etapes, actuelle };
}

const boutonCommande = (c) => ({ type: 'bouton', texte: 'Voir ma commande', url: lien(`/mon-compte/commandes/${c.id_commande}`) });

// ============================== Compte client ==============================

function codeVerification(prenom, code) {
  return construire({
    sujet: 'Confirmez votre adresse e-mail – NAD-NELY Shop',
    apercu: `Votre code de vérification : ${code}`,
    titre: 'Bienvenue, ' + prenom + ' !',
    blocs: [
      { type: 'p', texte: 'Merci de votre inscription sur NAD-NELY Shop. Pour activer votre compte, saisissez ce code sur la page de vérification :' },
      { type: 'code', code },
      { type: 'p', texte: 'Ce code est valable **15 minutes** et ne peut servir qu’une seule fois.' },
      { type: 'note', texte: "Si vous n'avez pas créé de compte, ignorez ce message : aucun compte ne sera activé." },
    ],
  });
}

function codeReinitialisation(prenom, code) {
  return construire({
    sujet: 'Votre code de réinitialisation – NAD-NELY Shop',
    apercu: `Votre code pour choisir un nouveau mot de passe : ${code}`,
    titre: 'Mot de passe oublié ?',
    blocs: [
      { type: 'p', texte: `Bonjour ${prenom},\nvous avez demandé à choisir un nouveau mot de passe. Voici votre code :` },
      { type: 'code', code },
      { type: 'p', texte: 'Ce code est valable **15 minutes** et ne peut servir qu’une seule fois.' },
      { type: 'note', texte: SECURITE },
    ],
  });
}

function bienvenue(prenom) {
  return construire({
    sujet: 'Bienvenue chez NAD-NELY Shop !',
    apercu: 'Votre compte est activé, bonne découverte de la boutique.',
    titre: `Votre compte est activé, ${prenom} !`,
    blocs: [
      { type: 'p', texte: 'Votre adresse e-mail est confirmée : vous faites maintenant partie de la famille **NAD-NELY Shop**.' },
      { type: 'encadre', ton: 'info', texte: 'Avec votre compte, vous pouvez :\n• commander en quelques clics, en livraison ou en retrait à Mamoudzou ;\n• suivre vos commandes étape par étape ;\n• retrouver tout votre historique d’achats.' },
      { type: 'bouton', texte: 'Découvrir la boutique', url: lien('/catalogue'), or: true },
      { type: 'note', texte: 'Une question ? Répondez-nous depuis la page Contact du site, nous vous répondrons rapidement.' },
    ],
  });
}

function motDePasseModifie(prenom) {
  return construire({
    sujet: 'Votre mot de passe a été modifié – NAD-NELY Shop',
    apercu: 'Le mot de passe de votre compte vient d’être changé.',
    titre: 'Mot de passe modifié',
    blocs: [
      { type: 'p', texte: `Bonjour ${prenom},\nle mot de passe de votre compte NAD-NELY Shop vient d’être modifié le **${date(new Date())}**.` },
      { type: 'encadre', ton: 'succes', texte: 'C’est bien vous ? Tout est en ordre, vous n’avez rien à faire.' },
      { type: 'encadre', ton: 'alerte', texte: '**Ce n’est pas vous ?** Choisissez tout de suite un nouveau mot de passe avec « Mot de passe oublié », puis contactez-nous.' },
      { type: 'bouton', texte: 'Sécuriser mon compte', url: lien('/mot-de-passe-oublie') },
    ],
  });
}

function profilModifie({ nom, prenom, telephone }) {
  return construire({
    sujet: 'Vos informations ont été mises à jour – NAD-NELY Shop',
    apercu: 'Les informations de votre compte ont été modifiées.',
    titre: 'Informations mises à jour',
    blocs: [
      { type: 'p', texte: `Bonjour ${prenom},\nles informations de votre compte viennent d’être modifiées. Les voici :` },
      { type: 'infos', lignes: [['Nom', nom], ['Prénom', prenom], ['Téléphone', telephone || 'non renseigné']] },
      { type: 'bouton', texte: 'Voir mon compte', url: lien('/mon-compte') },
      { type: 'note', texte: "Si vous n'êtes pas à l'origine de cette modification, changez votre mot de passe et contactez-nous." },
    ],
  });
}

// ============================== Commandes (client) ==============================

function commandeConfirmee(c, lignes) {
  const retrait = c.mode_reception === 'retrait';
  return construire({
    sujet: `Commande n° ${c.id_commande} confirmée – NAD-NELY Shop`,
    apercu: `Merci ! Votre paiement de ${prix(c.montant_total)} est bien reçu.`,
    titre: `Merci pour votre commande, ${c.prenom} !`,
    blocs: [
      { type: 'p', texte: `Votre paiement de **${prix(c.montant_total)}** est bien reçu : votre commande est **confirmée** et nous commençons à la préparer.` },
      suivi(c),
      { type: 'commande', commande: c, lignes },
      infosReception(c),
      { type: 'encadre', ton: 'info', texte: retrait
        ? 'Nous vous prévenons par e-mail dès que votre commande est **prête à retirer**.'
        : 'Nous vous prévenons par e-mail dès que votre commande est **expédiée**.' },
      boutonCommande(c),
    ],
  });
}

// Changement de statut fait par l'administrateur : expédiée, livrée ou annulée
function commandeStatut(c, lignes, paiementValide) {
  const etat = statutAffiche(c);
  const retrait = c.mode_reception === 'retrait';

  if (c.statut === 'annulee') {
    return construire({
      sujet: `Commande n° ${c.id_commande} annulée – NAD-NELY Shop`,
      apercu: 'Votre commande a été annulée.',
      titre: 'Votre commande est annulée',
      blocs: [
        { type: 'p', texte: `Bonjour ${c.prenom},\nnous sommes désolés : votre commande n° **${c.id_commande}** a été annulée.` },
        { type: 'commande', commande: c, lignes },
        paiementValide
          ? { type: 'encadre', ton: 'alerte', texte: `Votre paiement de **${prix(c.montant_total)}** vous sera **remboursé** sur votre moyen de paiement. Le délai dépend de votre banque (en général 5 à 10 jours).` }
          : { type: 'encadre', ton: 'info', texte: 'Aucun paiement n’a été encaissé pour cette commande.' },
        { type: 'p', texte: 'Pour toute question, n’hésitez pas à nous écrire depuis la page Contact.' },
        { type: 'bouton', texte: 'Nous contacter', url: lien('/contact') },
      ],
    });
  }

  const textes = {
    expediee: retrait
      ? ['Votre commande est prête !', 'Bonne nouvelle : votre commande est **prête à retirer** en boutique, à Mamoudzou. Pensez à indiquer votre numéro de commande.']
      : ['Votre commande est en route !', `Bonne nouvelle : votre commande vient d’être **expédiée** à l’adresse suivante : ${c.adresse_livraison}, ${c.commune_livraison}.`],
    livree: retrait
      ? ['Merci pour votre visite !', 'Votre commande a bien été **retirée**. Nous espérons que vos articles vous plaisent !']
      : ['Votre commande est livrée !', 'Votre commande a bien été **livrée**. Nous espérons que vos articles vous plaisent !'],
  };
  const [titre, phrase] = textes[c.statut];
  return construire({
    sujet: `Commande n° ${c.id_commande} : ${etat.toLowerCase()} – NAD-NELY Shop`,
    apercu: titre,
    titre,
    blocs: [
      { type: 'p', texte: `Bonjour ${c.prenom},\n${phrase}` },
      suivi(c),
      { type: 'commande', commande: c, lignes },
      c.statut === 'livree'
        ? { type: 'bouton', texte: 'Découvrir les nouveautés', url: lien('/catalogue'), or: true }
        : boutonCommande(c),
    ],
  });
}

// RG39 : le stock a manqué au moment du paiement, la commande est annulée et sera remboursée
function commandeAnnuleeStock(c, lignes) {
  return construire({
    sujet: `Commande n° ${c.id_commande} : article(s) épuisé(s) – NAD-NELY Shop`,
    apercu: 'Un article est épuisé : votre commande est annulée et sera remboursée.',
    titre: 'Un article vient d’être épuisé',
    blocs: [
      { type: 'p', texte: `Bonjour ${c.prenom},\nnous sommes vraiment désolés : pendant votre paiement, un ou plusieurs articles de votre commande n° **${c.id_commande}** ont été épuisés. Votre commande a donc été **annulée**.` },
      { type: 'commande', commande: c, lignes },
      { type: 'encadre', ton: 'alerte', texte: `Votre paiement de **${prix(c.montant_total)}** vous sera **intégralement remboursé**. Le délai dépend de votre banque (en général 5 à 10 jours).` },
      { type: 'bouton', texte: 'Voir les articles disponibles', url: lien('/catalogue'), or: true },
    ],
  });
}

// ============================== Messages pour l'administrateur ==============================

function nouvelleCommande(c, lignes) {
  return construire({
    pourAdmin: true,
    sujet: `🛍️ Nouvelle commande n° ${c.id_commande} – ${prix(c.montant_total)}`,
    apercu: `${c.prenom} ${c.nom} vient de payer ${prix(c.montant_total)}.`,
    titre: 'Nouvelle commande payée !',
    blocs: [
      { type: 'encadre', ton: 'succes', texte: `**${c.prenom} ${c.nom}** vient de payer **${prix(c.montant_total)}**. La commande est à préparer.` },
      { type: 'commande', commande: c, lignes },
      { type: 'infos', titre: 'Client', lignes: [['Nom', `${c.prenom} ${c.nom}`], ['E-mail', c.email], ['Téléphone', c.telephone_contact || c.telephone || 'non renseigné']] },
      infosReception(c),
      { type: 'bouton', texte: 'Gérer la commande', url: lien(`/admin/commandes/${c.id_commande}`) },
    ],
  });
}

// Paiement encaissé sur une commande annulée : remboursement à faire depuis Stripe
function remboursementAFaire(c, raison, reference) {
  return construire({
    pourAdmin: true,
    sujet: `⚠️ Remboursement à faire – commande n° ${c.id_commande}`,
    apercu: raison,
    titre: 'Remboursement à faire',
    blocs: [
      { type: 'encadre', ton: 'erreur', texte: `${raison}\nLe client a payé **${prix(c.montant_total)}** : remboursez-le depuis le tableau de bord Stripe.` },
      { type: 'infos', titre: 'Informations', lignes: [
        ['Commande', `n° ${c.id_commande} du ${date(c.date_commande)}`],
        ['Client', `${c.prenom} ${c.nom} (${c.email})`],
        ['Référence Stripe', reference || 'voir le détail de la commande'],
      ] },
      { type: 'bouton', texte: 'Voir la commande', url: lien(`/admin/commandes/${c.id_commande}`) },
    ],
  });
}

function stockBas(produits, seuil) {
  return construire({
    pourAdmin: true,
    sujet: `📦 Stock bas : ${produits.length} produit(s) à réapprovisionner`,
    apercu: produits.map((p) => p.nom).join(', '),
    titre: 'Stock bas',
    blocs: [
      { type: 'p', texte: `Après la dernière commande, ces produits ont **${seuil} unités ou moins** en stock :` },
      { type: 'infos', lignes: produits.map((p) => [p.nom, p.stock <= 0 ? '**Épuisé**' : `${p.stock} restant(s)`]) },
      { type: 'bouton', texte: 'Gérer les produits', url: lien('/admin/produits') },
    ],
  });
}

function messageContact({ nom, email, sujet, message, compte }) {
  return construire({
    pourAdmin: true,
    sujet: `✉️ Contact : ${sujet}`,
    apercu: `${nom} vous a écrit depuis le site.`,
    titre: 'Nouveau message d’un visiteur',
    blocs: [
      { type: 'infos', lignes: [['De', nom], ['E-mail', email], ['Compte client', compte ? 'oui' : 'non'], ['Sujet', sujet]] },
      { type: 'encadre', ton: 'info', texte: message },
      { type: 'note', texte: `Cliquez sur « Répondre » dans votre messagerie : la réponse partira directement à ${email}.` },
    ],
  });
}

module.exports = {
  codeVerification, codeReinitialisation, bienvenue, motDePasseModifie, profilModifie,
  commandeConfirmee, commandeStatut, commandeAnnuleeStock,
  nouvelleCommande, remboursementAFaire, stockBas, messageContact,
};
