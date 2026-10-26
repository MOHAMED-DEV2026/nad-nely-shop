<script setup>
import { ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { appelerApi } from "../../services/api"
import CarteProduit from "../../components/CarteProduit.vue"
import FiltresCatalogue from "../../components/FiltresCatalogue.vue"
import Pagination from "../../components/Pagination.vue"

const route = useRoute()
const router = useRouter()
const produits = ref([])
const total = ref(0)
const parPage = ref(12)
const chargement = ref(true)
const erreur = ref("")
const tri = ref(route.query.tri || "nouveautes")

// Charge les produits selon les parametres de l adresse (recherche, categorie, filtres, tri)
async function charger() {
  chargement.value = true
  erreur.value = ""
  try {
    const parametres = new URLSearchParams(route.query).toString()
    const donnees = await appelerApi("/produits" + (parametres ? "?" + parametres : ""))
    produits.value = donnees.produits
    total.value = donnees.total
    parPage.value = donnees.par_page
  } catch (e) {
    erreur.value = "Impossible de charger les produits. Réessayez plus tard."
  } finally {
    chargement.value = false
  }
}

function changerTri() {
  const requete = { ...route.query, tri: tri.value }
  delete requete.page
  router.push({ path: "/catalogue", query: requete })
}

watch(() => route.query, charger, { immediate: true })
watch(() => route.query.tri, (valeur) => { tri.value = valeur || "nouveautes" })
</script>

<template>
  <main class="page">
    <nav class="fil" aria-label="Fil d'Ariane"><RouterLink to="/">Accueil</RouterLink> › Catalogue</nav>
    <h1>Catalogue</h1>
    <div class="disposition">
      <FiltresCatalogue />
      <section class="resultats">
        <div class="barre">
          <span v-if="!chargement && !erreur" class="info">{{ total }} produit{{ total > 1 ? "s" : "" }}</span>
          <span v-else></span>
          <div class="tri">
            <label for="tri">Trier par</label>
            <select id="tri" v-model="tri" @change="changerTri">
              <option value="nouveautes">Nouveautés</option>
              <option value="prix_asc">Prix croissant</option>
              <option value="prix_desc">Prix décroissant</option>
            </select>
          </div>
        </div>
        <p v-if="erreur" class="message-erreur" role="alert">{{ erreur }}</p>
        <p v-else-if="chargement" class="info">Chargement…</p>
        <template v-else>
          <p v-if="produits.length === 0" class="info">Aucun produit ne correspond à votre recherche.</p>
          <div class="grille">
            <CarteProduit v-for="p in produits" :key="p.id_produit" :produit="p" />
          </div>
          <Pagination :total="total" :par-page="parPage" />
        </template>
      </section>
    </div>
  </main>
</template>

<style scoped>
.page { max-width: var(--largeur-max); margin: 0 auto; padding: 24px; }
.fil { font-size: 13px; color: var(--texte-doux); }
.fil a { text-decoration: underline; }
.page h1 { margin: 8px 0 4px; font-size: 36px; }
.disposition { display: flex; flex-wrap: wrap; gap: 32px; align-items: flex-start; margin-top: 16px; }
.resultats { flex: 999 1 560px; min-width: 0; }
.barre { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px; }
.tri { display: flex; align-items: center; gap: 8px; font-size: 14px; }
.tri select { min-height: var(--hauteur-bouton); border: 1px solid var(--marine); border-radius: var(--arrondi-petit); padding: 0 12px; background: var(--blanc); }
.info { color: var(--texte-doux); font-size: 14px; }
.message-erreur { background: var(--erreur-fond); color: var(--erreur-texte); border-radius: var(--arrondi-petit); padding: 12px 16px; font-weight: 500; }
.grille { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-top: 16px; }
@media (min-width: 768px) { .grille { grid-template-columns: repeat(3, 1fr); } }
</style>


