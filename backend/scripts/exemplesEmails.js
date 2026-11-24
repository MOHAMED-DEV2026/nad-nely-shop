// Exemples de chaque e-mail du site, avec de fausses données (pour l'aperçu et les tests d'envoi).
const messages = require('../src/emails/messages');

const commande = {
  id_commande: 1042, date_commande: new Date(), montant_total: 89.5, statut: 'confirmee',
  mode_reception: 'livraison', adresse_livraison: '12 rue du Commerce', commune_livraison: 'Mamoudzou',
  telephone_contact: '0639 12 34 56', nom: 'Ahmed', prenom: 'Nadia', email: 'nadia@exemple.com', telephone: null,
};
const lignes = [
  { nom: 'Robe salouva brodée', quantite: 1, prix_unitaire: 45, sous_total: 45 },
  { nom: 'Huile de coco vierge 250 ml', quantite: 2, prix_unitaire: 12.25, sous_total: 24.5 },
  { nom: 'Sandales dorées', quantite: 1, prix_unitaire: 20, sous_total: 20 },
];
const retrait = { ...commande, mode_reception: 'retrait', adresse_livraison: null, commune_livraison: null };

const EXEMPLES = {
  'code-verification': () => messages.codeVerification('Nadia', '482913'),
  'code-reinitialisation': () => messages.codeReinitialisation('Nadia', '730154'),
  bienvenue: () => messages.bienvenue('Nadia'),
  'mot-de-passe-modifie': () => messages.motDePasseModifie('Nadia'),
  'profil-modifie': () => messages.profilModifie({ nom: 'Ahmed', prenom: 'Nadia', telephone: '0639 12 34 56' }),
  'commande-confirmee': () => messages.commandeConfirmee(commande, lignes),
  'commande-expediee': () => messages.commandeStatut({ ...commande, statut: 'expediee' }, lignes, true),
  'commande-prete-a-retirer': () => messages.commandeStatut({ ...retrait, statut: 'expediee' }, lignes, true),
  'commande-livree': () => messages.commandeStatut({ ...commande, statut: 'livree' }, lignes, true),
  'commande-annulee': () => messages.commandeStatut({ ...commande, statut: 'annulee' }, lignes, true),
  'commande-annulee-stock': () => messages.commandeAnnuleeStock(commande, lignes),
  'admin-nouvelle-commande': () => messages.nouvelleCommande(commande, lignes),
  'admin-remboursement': () => messages.remboursementAFaire(commande, 'Un article est devenu indisponible pendant le paiement : la commande a été annulée automatiquement.', 'cs_test_a1B2c3D4'),
  'admin-stock-bas': () => messages.stockBas([{ nom: 'Robe salouva brodée', stock: 2 }, { nom: 'Sandales dorées', stock: 0 }], 3),
  'admin-contact': () => messages.messageContact({
    nom: 'Nadia Ahmed', email: 'nadia@exemple.com', sujet: 'Suivi de ma commande', compte: true,
    message: 'Bonjour,\nest-ce que la robe existe aussi en taille M ?\nMerci beaucoup !',
  }),
};

module.exports = { EXEMPLES };
