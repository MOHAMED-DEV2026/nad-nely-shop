<template>
  <nav class="nav" aria-label="Espace client">
    <RouterLink to="/mon-compte" class="onglet" exact-active-class="actif">Mes informations</RouterLink>
    <RouterLink to="/mon-compte/commandes" class="onglet" active-class="actif">Mes commandes</RouterLink>
  </nav>
</template>

<style scoped>
.nav { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 24px; }
.onglet { min-height: 44px; padding: 0 20px; display: flex; align-items: center; border-radius: 999px; border: 1.5px solid var(--marine); color: var(--marine); font-weight: 500; text-decoration: none; }
.actif { background: var(--marine); color: var(--blanc); }
</style>
