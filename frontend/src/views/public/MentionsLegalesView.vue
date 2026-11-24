<template>
  <section class="page">
    <nav class="ariane"><RouterLink to="/">Accueil</RouterLink> › Mentions légales</nav>
    <h1>Mentions légales</h1>
    <p class="avertissement">
      NAD-NELY Shop est un <strong>projet personnel de fin de formation</strong> (titre professionnel Développeur Web et Web Mobile).
      Aucune vente réelle n'a lieu sur ce site : les commandes et les paiements fonctionnent en mode test.
    </p>
    <section class="bloc"><h2>Éditeur du site</h2><p>Site personnel et non professionnel, édité par un particulier dans le cadre d'une formation, à Mamoudzou, Mayotte. Le site n'a pas d'activité commerciale et n'est pas immatriculé (pas de numéro SIRET). Contact : <a href="mailto:nadnely.shop@gmail.com">nadnely.shop@gmail.com</a> ou depuis la page <RouterLink to="/contact">Nous contacter</RouterLink>.</p></section>
    <section class="bloc"><h2>Directeur de la publication</h2><p>L'éditeur du site, joignable à l'adresse <a href="mailto:nadnely.shop@gmail.com">nadnely.shop@gmail.com</a>.</p></section>
    <section class="bloc"><h2>Hébergement</h2><p>ALWAYSDATA, SARL au capital de 200 000 €, immatriculée au RCS de Paris sous le numéro 492 893 490, 91 rue du Faubourg Saint-Honoré, 75008 Paris. Site : <a href="https://www.alwaysdata.com" target="_blank" rel="noopener">www.alwaysdata.com</a>.</p></section>
    <section class="bloc"><h2>Paiement en ligne</h2><p>Les paiements par carte bancaire sont traités par Stripe, en mode test : aucune somme n'est réellement débitée. NAD-NELY Shop ne stocke aucune donnée bancaire.</p></section>
    <section class="bloc"><h2>Propriété intellectuelle</h2><p>Les textes, le logo et la mise en page du site sont la propriété de leur auteur. Toute reproduction sans autorisation est interdite. Les photos de produits sont utilisées à titre d'illustration pour ce projet de formation.</p></section>
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
.bloc a { text-decoration: underline; }
</style>
