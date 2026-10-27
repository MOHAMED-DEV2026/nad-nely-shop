<script setup>
import { ref, onMounted } from "vue"
import { useRouter } from "vue-router"
import logo from "../assets/logo.png"
import { appelerApi } from "../services/api"
import { nombreArticles } from "../stores/panier"
import { auth, estConnecte } from "../stores/auth"

const router = useRouter()
const recherche = ref("")
const categories = ref([])

function deconnexion() {
  auth.fermerSession()
  router.push("/")
}

function chercher() {
  router.push({ path: "/catalogue", query: recherche.value ? { recherche: recherche.value } : {} })
}

onMounted(async () => {
  try {
    categories.value = await appelerApi("/categories")
  } catch {
    categories.value = []
  }
})
</script>

<template>
  <div>
    <div class="bande">Livraison dans les 17 communes de Mayotte · Retrait possible (convenu par téléphone)</div>
    <header class="entete-haut">
      <div class="entete-contenu">
        <RouterLink to="/" class="marque">
          <img :src="logo" alt="Logo NAD-NELY Shop" class="logo" />
          <span class="marque-nom">NAD-NELY Shop</span>
        </RouterLink>
        <form class="recherche" @submit.prevent="chercher">
          <label for="q" class="cache">Rechercher un produit</label>
          <input id="q" v-model="recherche" type="search" placeholder="Rechercher un produit par son nom…" />
          <button type="submit">Rechercher</button>
        </form>
        <div class="actions">
          <template v-if="estConnecte">
            <RouterLink to="/mon-compte" class="bouton bouton-contour">Mon compte</RouterLink>
            <button type="button" class="bouton bouton-contour" @click="deconnexion">Se déconnecter</button>
          </template>
          <RouterLink v-else to="/connexion" class="bouton bouton-contour">Se connecter</RouterLink>
          <RouterLink to="/panier" class="bouton bouton-or">Panier<span v-if="nombreArticles > 0" class="pastille">{{ nombreArticles }}</span></RouterLink>
        </div>
      </div>
      <nav class="categories" aria-label="Catégories">
        <div class="categories-contenu">
          <RouterLink v-for="c in categories" :key="c.id_categorie" :to="{ path: '/catalogue', query: { categorie: c.id_categorie } }">{{ c.nom }}</RouterLink>
        </div>
      </nav>
    </header>
  </div>
</template>

<style scoped>
.bande { background: var(--marine); color: var(--creme); font-size: 13px; padding: 8px 24px; text-align: center; }
.entete-haut { background: var(--blanc); border-bottom: 1px solid var(--bordure); }
.entete-contenu { max-width: var(--largeur-max); margin: 0 auto; padding: 12px 24px; display: flex; flex-wrap: wrap; align-items: center; gap: 16px 24px; }
.marque { display: flex; align-items: center; gap: 12px; }
.logo { width: 60px; height: 60px; border-radius: 12px; object-fit: cover; display: block; }
.marque-nom { font-family: var(--police-titre); font-weight: 700; font-size: 22px; color: var(--marine); letter-spacing: 1px; }
.recherche { flex: 1 1 280px; display: flex; }
.recherche input { flex: 1; min-width: 0; min-height: var(--hauteur-bouton); border: 1px solid var(--marine); border-right: 0; border-radius: 8px 0 0 8px; padding: 0 16px; font-size: 15px; background: var(--creme); }
.recherche button { min-height: var(--hauteur-bouton); padding: 0 20px; background: var(--marine); color: var(--blanc); border: 0; border-radius: 0 8px 8px 0; font-weight: 500; }
.actions { display: flex; gap: 12px; }
.pastille { background: var(--marine); color: var(--blanc); border-radius: 999px; min-width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; margin-left: 8px; }
.cache { position: absolute; left: -9999px; }
.categories { border-top: 1px solid var(--bordure); }
.categories-contenu { max-width: var(--largeur-max); margin: 0 auto; padding: 0 24px; display: flex; flex-wrap: wrap; gap: 0 32px; }
.categories a { min-height: var(--hauteur-bouton); display: flex; align-items: center; font-size: 15px; font-weight: 500; color: var(--marine); }
.categories a:hover { text-decoration: underline; }
</style>


