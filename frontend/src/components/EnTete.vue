<script setup>
import { ref, computed, watch, onMounted } from "vue"
import { useRoute, useRouter } from "vue-router"
import logo from "../assets/logo.png"
import { appelerApi } from "../services/api"
import { nombreArticles } from "../stores/panier"
import { auth, estConnecte } from "../stores/auth"

const route = useRoute()
const router = useRouter()
const recherche = ref("")
const categories = ref([])
const menuOuvert = ref(false)

const lienCompte = computed(() => (estConnecte.value ? "/mon-compte" : "/connexion"))
const libelleCompte = computed(() => (estConnecte.value ? "Mon compte" : "Se connecter"))
const libellePanier = computed(() => "Panier, " + nombreArticles.value + (nombreArticles.value > 1 ? " articles" : " article"))

function fermerMenu() {
  menuOuvert.value = false
}

function deconnexion() {
  auth.fermerSession()
  fermerMenu()
  router.push("/")
}

function chercher() {
  fermerMenu()
  router.push({ path: "/catalogue", query: recherche.value ? { recherche: recherche.value } : {} })
}

onMounted(async () => {
  try {
    categories.value = await appelerApi("/categories")
  } catch {
    categories.value = []
  }
})

// Le menu se referme quand on change de page
watch(() => route.fullPath, fermerMenu)
</script>

<template>
  <div>
    <div class="bande"><span class="long">Livraison dans les 17 communes de Mayotte · Retrait possible (convenu par téléphone)</span><span class="court">Livraison dans les 17 communes de Mayotte</span></div>
    <header class="entete-haut">
      <div class="entete-contenu">
        <button type="button" class="burger" aria-label="Ouvrir le menu" aria-controls="menu-categories" :aria-expanded="menuOuvert" @click="menuOuvert = !menuOuvert">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
        </button>
        <RouterLink to="/" class="marque">
          <img :src="logo" alt="Logo NAD-NELY Shop" class="logo" />
          <span class="marque-nom"><span class="nom-long">NAD-NELY Shop</span><span class="nom-court">NAD-NELY</span></span>
        </RouterLink>
        <form class="recherche" @submit.prevent="chercher">
          <label for="q" class="cache">Rechercher un produit</label>
          <input id="q" v-model="recherche" type="search" placeholder="Rechercher un produit…" />
          <button type="submit">Rechercher</button>
        </form>
        <div class="actions">
          <template v-if="estConnecte">
            <RouterLink to="/mon-compte" class="bouton bouton-contour action-texte">Mon compte</RouterLink>
            <button type="button" class="bouton bouton-contour action-texte" @click="deconnexion">Se déconnecter</button>
          </template>
          <RouterLink v-else to="/connexion" class="bouton bouton-contour action-texte">Se connecter</RouterLink>
          <RouterLink :to="lienCompte" class="action-icone" :aria-label="libelleCompte">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4-6 8-6s7 2 8 6" /></svg>
          </RouterLink>
          <RouterLink to="/panier" class="bouton bouton-or action-texte">Panier<span v-if="nombreArticles > 0" class="pastille">{{ nombreArticles }}</span></RouterLink>
          <RouterLink to="/panier" class="action-icone" :aria-label="libellePanier">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 6h15l-1.5 9h-12z" /><path d="M6 6L5 3H2" /><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" /></svg>
            <span v-if="nombreArticles > 0" class="badge">{{ nombreArticles }}</span>
          </RouterLink>
        </div>
      </div>
      <nav id="menu-categories" class="categories" :class="{ ouvert: menuOuvert }" aria-label="Catégories">
        <div class="categories-contenu">
          <RouterLink v-for="c in categories" :key="c.id_categorie" :to="{ path: '/catalogue', query: { categorie: c.id_categorie } }">{{ c.nom }}</RouterLink>
          <div class="menu-compte">
            <template v-if="estConnecte">
              <RouterLink to="/mon-compte">Mon compte</RouterLink>
              <button type="button" class="lien-menu" @click="deconnexion">Se déconnecter</button>
            </template>
            <RouterLink v-else to="/connexion">Se connecter</RouterLink>
          </div>
        </div>
      </nav>
    </header>
  </div>
</template>

<style scoped>
/* Telephone d abord : les regles ci-dessous sont pour les petits ecrans */
.bande { background: var(--marine); color: var(--creme); font-size: 12px; padding: 8px 16px; text-align: center; }
.bande .long { display: none; }
.entete-haut { background: var(--blanc); border-bottom: 1px solid var(--bordure); }
.entete-contenu { max-width: var(--largeur-max); margin: 0 auto; padding: 8px 16px; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.burger { order: 1; width: 44px; height: 44px; border: 0; background: transparent; color: var(--marine); display: flex; align-items: center; justify-content: center; }
.marque { order: 2; flex: 1; min-width: 0; display: flex; align-items: center; gap: 8px; }
.logo { width: 40px; height: 40px; border-radius: 8px; object-fit: cover; display: block; }
.marque-nom { font-family: var(--police-titre); font-weight: 700; font-size: 17px; color: var(--marine); }
.nom-long { display: none; }
.actions { order: 3; display: flex; gap: 4px; }
.action-texte { display: none; }
.action-icone { position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; color: var(--marine); }
.badge { position: absolute; top: 2px; right: 0; background: var(--or); color: var(--marine); border-radius: 999px; min-width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; }
.recherche { order: 4; flex: 1 1 100%; display: flex; padding-bottom: 4px; }
.recherche input { flex: 1; min-width: 0; min-height: var(--hauteur-bouton); border: 1px solid var(--marine); border-radius: var(--arrondi-petit); padding: 0 16px; font-size: 15px; background: var(--creme); }
.recherche button { display: none; }
.cache { position: absolute; left: -9999px; }
.categories { display: none; border-top: 1px solid var(--bordure); }
.categories.ouvert { display: block; }
.categories-contenu { max-width: var(--largeur-max); margin: 0 auto; padding: 0 16px 8px; display: flex; flex-direction: column; }
.categories a, .lien-menu { min-height: var(--hauteur-bouton); display: flex; align-items: center; font-size: 15px; font-weight: 500; color: var(--marine); background: none; border: 0; padding: 0; text-align: left; }
.categories a:hover, .lien-menu:hover { text-decoration: underline; }
.menu-compte { display: flex; flex-direction: column; border-top: 1px solid var(--bordure); margin-top: 8px; padding-top: 8px; }
.pastille { background: var(--marine); color: var(--blanc); border-radius: 999px; min-width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; margin-left: 8px; }

/* Tablette : a partir de 768 px */
@media (min-width: 768px) {
  .bande { font-size: 13px; }
  .bande .long { display: inline; }
  .bande .court { display: none; }
  .entete-contenu { padding: 12px 24px; gap: 16px 24px; }
  .burger { display: none; }
  .logo { width: 60px; height: 60px; border-radius: 12px; }
  .marque { gap: 12px; }
  .marque-nom { font-size: 22px; letter-spacing: 1px; }
  .nom-long { display: inline; }
  .nom-court { display: none; }
  .actions { gap: 12px; }
  .action-icone { display: none; }
  .action-texte { display: inline-flex; }
  .recherche { padding-bottom: 0; }
  .recherche input { border-right: 0; border-radius: 8px 0 0 8px; }
  .recherche button { display: block; min-height: var(--hauteur-bouton); padding: 0 20px; background: var(--marine); color: var(--blanc); border: 0; border-radius: 0 8px 8px 0; font-weight: 500; font-size: 15px; }
  .categories { display: block; }
  .categories-contenu { padding: 0 24px; flex-direction: row; flex-wrap: wrap; gap: 0 32px; }
  .menu-compte { display: none; }
}

/* Ordinateur : a partir de 1024 px, tout sur une seule ligne */
@media (min-width: 1024px) {
  .marque { order: 1; flex: none; }
  .recherche { order: 2; flex: 1 1 280px; }
  .actions { order: 3; }
}
</style>
