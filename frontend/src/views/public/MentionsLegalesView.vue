<template>
  <section class="page">
    <nav class="ariane"><RouterLink to="/">Accueil</RouterLink> › Mentions légales</nav>
    <h1>Mentions légales</h1>
    <p class="aide">Texte modèle : les informations entre crochets sont à compléter avant la mise en ligne.</p>
    <section class="bloc"><h2>Éditeur du site</h2><p>NAD-NELY Shop, [forme juridique et nom de l'exploitant], [adresse], Mamoudzou, Mayotte. Contact : [e-mail] · [téléphone].</p></section>
    <section class="bloc"><h2>Directeur de la publication</h2><p>[Nom du responsable de la publication].</p></section>
    <section class="bloc"><h2>Hébergement</h2><p>[Nom de l'hébergeur], [adresse de l'hébergeur].</p></section>
    <section class="bloc"><h2>Paiement en ligne</h2><p>Les paiements par carte bancaire sont traités par Stripe. NAD-NELY Shop ne stocke aucune donnée bancaire.</p></section>
    <section class="bloc"><h2>Propriété intellectuelle</h2><p>Les textes, images et le logo du site sont la propriété de NAD-NELY Shop [à confirmer].</p></section>
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
</style>
