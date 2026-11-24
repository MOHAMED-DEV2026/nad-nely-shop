<template>
  <section class="page">
    <nav class="ariane"><RouterLink to="/">Accueil</RouterLink> › Politique de confidentialité</nav>
    <h1>Politique de confidentialité</h1>
    <p class="avertissement">
      Ce site est un <strong>projet personnel de fin de formation</strong>. Les données saisies servent uniquement à faire fonctionner
      et à démontrer la boutique : évitez d'y enregistrer des informations sensibles.
    </p>
    <section class="bloc"><h2>Données collectées</h2><p>Seules les données nécessaires sont collectées :</p><ul><li>nom, prénom, adresse e-mail et téléphone (facultatif) à l'inscription</li><li>adresse, commune et téléphone de contact lors d'une commande livrée</li><li>historique de vos commandes</li><li>nom, adresse e-mail et contenu du message quand vous utilisez le formulaire de contact</li></ul></section>
    <section class="bloc"><h2>Utilisation des données</h2><p>Vos données servent à créer votre compte, traiter vos commandes, vous envoyer les e-mails liés à votre compte et à vos commandes (code de vérification, confirmation, suivi) et répondre à vos messages. Elles ne sont ni vendues, ni louées, ni utilisées à des fins publicitaires.</p></section>
    <section class="bloc"><h2>Destinataires</h2><p>Vos données ne sont transmises qu'aux services nécessaires au fonctionnement du site :</p><ul><li>ALWAYSDATA (Paris) : hébergement du site et de la base de données</li><li>Stripe : traitement des paiements, en mode test</li><li>Google (Gmail) : envoi des e-mails du site</li></ul></section>
    <section class="bloc"><h2>Sécurité</h2><p>Votre mot de passe est stocké de façon chiffrée, jamais en clair. Les codes de vérification sont eux aussi chiffrés et ne sont valables que 15 minutes. Aucune donnée bancaire n'est conservée sur le site : seule la référence du paiement Stripe est enregistrée.</p></section>
    <section class="bloc"><h2>Consentement</h2><p>Au moment de créer un compte, vous acceptez cette politique en cochant la case prévue.</p></section>
    <section class="bloc"><h2>Vos droits</h2><p>Conformément au RGPD, vous pouvez demander l'accès à vos données, leur correction ou leur suppression par e-mail à <a href="mailto:nadnely.shop@gmail.com">nadnely.shop@gmail.com</a> ou depuis la page <RouterLink to="/contact">Nous contacter</RouterLink>. Vous pouvez aussi adresser une réclamation à la CNIL (<a href="https://www.cnil.fr" target="_blank" rel="noopener">www.cnil.fr</a>).</p></section>
    <section class="bloc"><h2>Durée de conservation</h2><p>Les données de votre compte et de vos commandes sont conservées tant que votre compte existe, et au plus pendant la durée du projet de formation. Un compte jamais vérifié peut être supprimé à tout moment. Les messages du formulaire de contact sont supprimés une fois la demande traitée. Vous pouvez demander la suppression de votre compte à tout moment.</p></section>
  </section>
</template>

<style scoped>
.page { max-width: 900px; margin: 0 auto; padding: 24px 16px 48px; display: flex; flex-direction: column; gap: 16px; }
.ariane { font-size: 13px; color: var(--texte-doux); }
.ariane a { text-decoration: underline; }
.avertissement { background: var(--fond-bleu-clair); color: var(--marine); border-radius: 12px; padding: 14px 16px; margin: 0; font-size: 14px; }
.bloc { background: var(--blanc); border: 1px solid var(--bordure); border-radius: 16px; padding: 24px; }
.bloc h2 { font-size: 22px; margin: 0 0 8px; }
.bloc p { margin: 0; font-size: 15px; }
.bloc ul { margin: 8px 0 0; padding-left: 20px; font-size: 15px; }
.bloc a { text-decoration: underline; }
</style>
