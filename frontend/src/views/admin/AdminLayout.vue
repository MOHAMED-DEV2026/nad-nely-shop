<script setup>
import { useRouter } from "vue-router";
import { auth } from "../../stores/auth.js";

const router = useRouter();

function deconnecter() {
  auth.fermerSession();
  router.push("/");
}
</script>

<template>
  <div class="admin">
    <aside class="menu">
      <div class="marque">NAD-NELY<br /><span>ADMINISTRATION</span></div>
      <nav aria-label="Administration" class="liens">
        <RouterLink to="/admin" exact-active-class="actif">Tableau de bord</RouterLink>
        <RouterLink to="/admin/produits" active-class="actif">Produits</RouterLink>
        <RouterLink to="/admin/categories" active-class="actif">Catégories</RouterLink>
        <RouterLink to="/admin/commandes" active-class="actif">Commandes</RouterLink>
        <RouterLink to="/admin/utilisateurs" active-class="actif">Utilisateurs</RouterLink>
      </nav>
      <div class="bas">
        <RouterLink to="/">Voir la boutique</RouterLink>
        <button type="button" @click="deconnecter">Se déconnecter</button>
      </div>
    </aside>
    <main class="principal"><RouterView /></main>
  </div>
</template>

<style scoped>
.admin { min-height: 100vh; display: flex; flex-direction: column; background: #F4F1EC; }
.menu { background: var(--marine); color: var(--creme); padding: 16px; display: flex; flex-direction: column; gap: 12px; }
.marque { font-family: "Playfair Display", serif; font-weight: 700; font-size: 18px; }
.marque span { font-family: "Poppins", sans-serif; font-size: 12px; font-weight: 400; letter-spacing: 2px; color: #E6D9B0; }
.liens { display: flex; flex-wrap: wrap; gap: 4px; }
.liens a, .bas a, .bas button { min-height: 44px; padding: 0 16px; display: flex; align-items: center; border-radius: 8px; color: var(--creme); text-decoration: none; background: transparent; border: 0; font-size: 15px; font-family: inherit; cursor: pointer; }
.liens a.actif { background: var(--or); color: var(--marine); font-weight: 600; }
.bas { display: flex; flex-wrap: wrap; gap: 4px; border-top: 1px solid var(--ligne-pied); padding-top: 12px; }
.principal { flex: 1; min-width: 0; padding: 24px 16px; }
@media (min-width: 1024px) { .admin { flex-direction: row; } .menu { flex: 0 0 250px; padding: 24px 16px; } .liens { flex-direction: column; } .bas { margin-top: auto; flex-direction: column; } .principal { padding: 32px 40px; } }
</style>
