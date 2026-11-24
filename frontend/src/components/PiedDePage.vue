<template>
  <footer class="pied">
    <div class="pied-contenu">
      <div class="pied-bloc">
        <p class="pied-marque">NAD-NELY Shop</p>
        <p>Boutique en ligne basée à Mamoudzou, Mayotte.</p>
      </div>
      <div class="pied-bloc">
        <p class="pied-titre">Suivez-nous</p>
        <a href="#">Snapchat</a>
        <a href="#">Facebook</a>
        <a href="#">TikTok</a>
      </div>
      <div class="pied-bloc">
        <p class="pied-titre">Informations</p>
        <RouterLink to="/contact">Nous contacter</RouterLink>
        <RouterLink to="/mentions-legales">Mentions légales</RouterLink>
        <RouterLink to="/confidentialite">Politique de confidentialité</RouterLink>
      </div>
    </div>
    <div class="pied-bas">© 2026 NAD-NELY Shop</div>
  </footer>
</template>

<style scoped>
.pied { background: var(--marque-fond); color: var(--sur-marque); margin-top: 48px; }
.pied-contenu { max-width: var(--largeur-max); margin: 0 auto; padding: 32px 24px; display: flex; flex-wrap: wrap; gap: 32px 40px; justify-content: space-between; }
.pied-bloc { flex: 1 1 200px; display: flex; flex-direction: column; }
.pied-bloc p { margin: 0 0 8px; }
.pied-marque { font-family: var(--police-titre); font-size: 24px; color: var(--or); }
.pied-titre { font-weight: 600; }
.pied-bloc a { min-height: var(--hauteur-bouton); display: flex; align-items: center; }
.pied-bloc a:hover { text-decoration: underline; }
.pied-bas { border-top: 1px solid var(--ligne-pied); padding: 16px 24px; text-align: center; font-size: 13px; }
</style>
