<template>
  <section class="page">
    <span class="code">404</span>
    <h1>Page introuvable</h1>
    <p>La page que vous cherchez n'existe pas ou n'est plus disponible.</p>
    <div class="actions">
      <RouterLink class="bouton" to="/">Retour à l'accueil</RouterLink>
      <RouterLink class="bouton bouton-contour" to="/catalogue">Voir le catalogue</RouterLink>
    </div>
  </section>
</template>

<style scoped>
.page { max-width: 700px; margin: 0 auto; padding: 64px 16px; display: flex; flex-direction: column; align-items: center; gap: 16px; text-align: center; }
.code { font-family: "Playfair Display", serif; font-size: 72px; font-weight: 700; color: var(--or); line-height: 1; background: var(--marine); border-radius: 20px; padding: 12px 32px; }
.actions { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; }
</style>
