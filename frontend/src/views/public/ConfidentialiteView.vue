<template>
  <section class="page">
    <nav class="ariane"><RouterLink to="/">Accueil</RouterLink> › Politique de confidentialité</nav>
    <h1>Politique de confidentialité</h1>
    <p class="aide">Texte modèle : les informations entre crochets sont à compléter avant la mise en ligne.</p>
    <section class="bloc"><h2>Données collectées</h2><p>Seules les données nécessaires sont collectées :</p><ul><li>nom, prénom, adresse e-mail et téléphone (facultatif) à l'inscription</li><li>adresse, commune et téléphone de contact lors d'une commande livrée</li><li>historique de vos commandes</li></ul></section>
    <section class="bloc"><h2>Utilisation des données</h2><p>Vos données servent à créer votre compte, traiter vos commandes et vous contacter pour la livraison ou le retrait. Elles ne sont pas revendues [à confirmer].</p></section>
    <section class="bloc"><h2>Sécurité</h2><p>Votre mot de passe est stocké de façon chiffrée, jamais en clair. Aucune donnée bancaire n'est conservée sur le site : seule la référence du paiement Stripe est enregistrée.</p></section>
    <section class="bloc"><h2>Consentement</h2><p>Au moment de créer un compte, vous acceptez cette politique en cochant la case prévue.</p></section>
    <section class="bloc"><h2>Vos droits</h2><p>Vous pouvez demander l'accès à vos données ou leur suppression par e-mail à [adresse e-mail de contact].</p></section>
    <section class="bloc"><h2>Durée de conservation</h2><p>[Durée à définir].</p></section>
  </section>
</template>

<style scoped>
.page { max-width: 900px; margin: 0 auto; padding: 24px 16px 48px; display: flex; flex-direction: column; gap: 16px; }
.ariane { font-size: 13px; color: var(--texte-doux); }
.ariane a { text-decoration: underline; }
.aide { font-size: 13px; color: var(--texte-doux); margin: 0; }
.bloc { background: var(--blanc); border: 1px solid var(--bordure); border-radius: 16px; padding: 24px; }
.bloc h2 { font-size: 22px; margin: 0 0 8px; }
.bloc p { margin: 0; font-size: 15px; }
.bloc ul { margin: 8px 0 0; padding-left: 20px; font-size: 15px; }
</style>
