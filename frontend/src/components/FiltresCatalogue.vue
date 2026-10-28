<script setup>
import { ref, watch, onMounted } from "vue"
import { useRoute, useRouter } from "vue-router"
import { appelerApi } from "../services/api"

const route = useRoute()
const router = useRouter()
const categories = ref([])
const marques = ref([])
const origines = ref([])
const prixMin = ref("")
const prixMax = ref("")
const marque = ref("")
const origine = ref("")
const publics = [{ valeur: "femme", nom: "Femme" }, { valeur: "homme", nom: "Homme" }]

// Recopie les filtres de l adresse dans les champs
function synchroniser() {
  prixMin.value = route.query.prixMin || ""
  prixMax.value = route.query.prixMax || ""
  marque.value = route.query.marque || ""
  origine.value = route.query.origine || ""
}

// Met a jour l adresse : le catalogue se recharge tout seul
function appliquer(changements) {
  const requete = { ...route.query, ...changements }
  delete requete.page
  for (const cle of Object.keys(requete)) {
    if (requete[cle] === "" || requete[cle] == null) delete requete[cle]
  }
  router.push({ path: "/catalogue", query: requete })
}

// Applique les prix une demi-seconde apres la derniere frappe
let minuteur = null
function prixModifie() {
  clearTimeout(minuteur)
  minuteur = setTimeout(() => appliquer({ prixMin: prixMin.value, prixMax: prixMax.value }), 500)
}

// Efface tous les filtres (la recherche par nom est conservee)
function reinitialiser() {
  const requete = {}
  if (route.query.recherche) requete.recherche = route.query.recherche
  router.push({ path: "/catalogue", query: requete })
}

onMounted(async () => {
  try {
    categories.value = await appelerApi("/categories")
    const filtres = await appelerApi("/produits/filtres")
    marques.value = filtres.marques
    origines.value = filtres.origines
  } catch {
    // les listes restent vides si l API ne repond pas
  }
})

watch(() => route.query, synchroniser, { immediate: true })
</script>

<template>
  <aside class="filtres">
    <div>
      <h2>Catégorie</h2>
      <button type="button" class="choix" :class="{ actif: !route.query.categorie }" @click="appliquer({ categorie: null })">Toutes les catégories</button>
      <button v-for="c in categories" :key="c.id_categorie" type="button" class="choix" :class="{ actif: String(route.query.categorie) === String(c.id_categorie) }" @click="appliquer({ categorie: c.id_categorie })">{{ c.nom }}</button>
    </div>
    <div>
      <h2>Public</h2>
      <button type="button" class="choix" :class="{ actif: !route.query.public }" @click="appliquer({ public: null })">Tous</button>
      <button v-for="p in publics" :key="p.valeur" type="button" class="choix" :class="{ actif: route.query.public === p.valeur }" @click="appliquer({ public: p.valeur })">{{ p.nom }}</button>
    </div>
    <div>
      <h2>Prix</h2>
      <div class="prix">
        <label for="pmin" class="cache">Prix minimum</label>
        <input id="pmin" v-model="prixMin" type="number" min="0" placeholder="Min" @input="prixModifie" />
        <span aria-hidden="true">–</span>
        <label for="pmax" class="cache">Prix maximum</label>
        <input id="pmax" v-model="prixMax" type="number" min="0" placeholder="Max" @input="prixModifie" />
      </div>
    </div>
    <div>
      <h2>Marque</h2>
      <label for="marque" class="cache">Marque</label>
      <select id="marque" v-model="marque" @change="appliquer({ marque: $event.target.value })">
        <option value="">Toutes les marques</option>
        <option v-for="m in marques" :key="m" :value="m">{{ m }}</option>
      </select>
    </div>
    <div>
      <h2>Origine</h2>
      <label for="origine" class="cache">Origine</label>
      <select id="origine" v-model="origine" @change="appliquer({ origine: $event.target.value })">
        <option value="">Toutes les origines</option>
        <option v-for="o in origines" :key="o" :value="o">{{ o }}</option>
      </select>
    </div>
    <button type="button" class="reinit" @click="reinitialiser">Réinitialiser les filtres</button>
  </aside>
</template>

<style scoped>
.filtres { flex: 0 0 260px; background: var(--blanc); border: 1px solid var(--bordure); border-radius: var(--arrondi-moyen); padding: 20px; display: flex; flex-direction: column; gap: 20px; }
.filtres h2 { margin: 0 0 8px; font-size: 20px; }
.choix { width: 100%; min-height: var(--hauteur-bouton); padding: 0 12px; display: flex; align-items: center; text-align: left; border: 0; border-radius: var(--arrondi-petit); background: transparent; color: var(--marine); font-size: 15px; }
.choix.actif { background: var(--rose); font-weight: 600; }
.prix { display: flex; gap: 8px; align-items: center; }
.prix input, .filtres select { width: 100%; min-width: 0; min-height: var(--hauteur-bouton); border: 1px solid var(--marine); border-radius: var(--arrondi-petit); padding: 0 12px; background: var(--creme); font-size: 15px; }
.reinit { min-height: var(--hauteur-bouton); border: 1.5px solid var(--marine); border-radius: var(--arrondi-petit); background: var(--blanc); color: var(--marine); font-weight: 500; }
.cache { position: absolute; left: -9999px; }
</style>

