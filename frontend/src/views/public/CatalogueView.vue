<script setup>
import { ref, watch } from "vue"
import { useRoute } from "vue-router"
import { appelerApi } from "../../services/api"
import CarteProduit from "../../components/CarteProduit.vue"

const route = useRoute()
const produits = ref([])
const total = ref(0)
const chargement = ref(true)
const erreur = ref("")

// Charge les produits selon les parametres de l adresse (recherche, categorie, ...)
async function charger() {
  chargement.value = true
  erreur.value = ""
  try {
    const parametres = new URLSearchParams(route.query).toString()
    const donnees = await appelerApi("/produits" + (parametres ? "?" + parametres : ""))
    produits.value = donnees.produits
    total.value = donnees.total
  } catch (e) {
    erreur.value = "Impossible de charger les produits. Réessayez plus tard."
  } finally {
    chargement.value = false
  }
}

watch(() => route.query, charger, { immediate: true })
</script>

<template>
  <main class="page">
    <nav class="fil" aria-label="Fil d'Ariane"><RouterLink to="/">Accueil</RouterLink> › Catalogue</nav>
    <h1>Catalogue</h1>
    <p v-if="erreur" class="message-erreur" role="alert">{{ erreur }}</p>
    <p v-else-if="chargement" class="info">Chargement…</p>
    <template v-else>
      <p class="info">{{ total }} produit{{ total > 1 ? "s" : "" }}</p>
      <p v-if="produits.length === 0" class="info">Aucun produit ne correspond à votre recherche.</p>
      <div class="grille">
        <CarteProduit v-for="p in produits" :key="p.id_produit" :produit="p" />
      </div>
    </template>
  </main>
</template>

<style scoped>
.page { max-width: var(--largeur-max); margin: 0 auto; padding: 24px; }
.fil { font-size: 13px; color: var(--texte-doux); }
.fil a { text-decoration: underline; }
.page h1 { margin: 8px 0 4px; font-size: 36px; }
.info { color: var(--texte-doux); font-size: 14px; }
.message-erreur { background: var(--erreur-fond); color: var(--erreur-texte); border-radius: var(--arrondi-petit); padding: 12px 16px; font-weight: 500; }
.grille { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px; margin-top: 16px; }
</style>
