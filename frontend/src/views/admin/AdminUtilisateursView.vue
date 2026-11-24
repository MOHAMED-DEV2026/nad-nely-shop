<script setup>
import { ref, computed, onMounted } from "vue"
import { appelerApi } from "../../services/api.js"

const utilisateurs = ref([])
const total = ref(0)
const page = ref(1)
const parPage = ref(20)
const recherche = ref("")
const alerte = ref("")
const message = ref("")
const aSupprimer = ref(null)
const chargement = ref(true)

const nbPages = computed(() => Math.max(1, Math.ceil(total.value / parPage.value)))

async function charger() {
  chargement.value = true
  alerte.value = ""
  const parametres = new URLSearchParams({ page: page.value })
  if (recherche.value.trim()) parametres.set("recherche", recherche.value.trim())
  try {
    const r = await appelerApi("/admin/utilisateurs?" + parametres.toString())
    utilisateurs.value = r.utilisateurs
    total.value = r.total
    parPage.value = r.par_page
  } catch (e) {
    alerte.value = e.message
  }
  chargement.value = false
}

onMounted(charger)

function chercher() {
  page.value = 1
  charger()
}

function allerA(n) {
  if (n < 1 || n > nbPages.value) return
  page.value = n
  charger()
}

async function confirmerSuppression() {
  const u = aSupprimer.value
  aSupprimer.value = null
  message.value = ""
  alerte.value = ""
  try {
    const r = await appelerApi("/admin/utilisateurs/" + u.id_utilisateur, { method: "DELETE" })
    message.value = r.message
    // Si la page devient vide, on revient à la précédente
    if (utilisateurs.value.length === 1 && page.value > 1) page.value--
    await charger()
  } catch (e) {
    alerte.value = e.message
  }
}

function dateCourte(d) {
  return new Date(d).toLocaleDateString("fr-FR")
}
</script>

<template>
  <div>
    <h1>Utilisateurs</h1>
    <p class="aide">Liste des clients inscrits. Un client peut être supprimé seulement s'il n'a passé aucune commande.</p>
    <p v-if="message" class="succes">{{ message }}</p>
    <p v-if="alerte" class="alerte">{{ alerte }}</p>
    <form class="recherche" @submit.prevent="chercher">
      <label for="r" class="cache">Rechercher par nom ou e-mail</label>
      <input id="r" v-model="recherche" type="search" placeholder="Rechercher par nom ou e-mail..." />
      <button type="submit" class="bouton">Rechercher</button>
    </form>
    <section class="carte">
      <p v-if="chargement">Chargement...</p>
      <p v-else-if="utilisateurs.length === 0">Aucun client trouvé.</p>
      <div v-else class="defile">
        <table>
          <thead><tr><th>Nom</th><th>Prénom</th><th>E-mail</th><th>Téléphone</th><th>Inscription</th><th>Commandes</th><th>Actions</th></tr></thead>
          <tbody>
            <tr v-for="u in utilisateurs" :key="u.id_utilisateur">
              <td class="gras">{{ u.nom }}</td><td>{{ u.prenom }}</td><td>{{ u.email }}</td><td>{{ u.telephone || "—" }}</td><td>{{ dateCourte(u.date_inscription) }}</td><td class="gras">{{ u.nb_commandes }}</td>
              <td><button type="button" class="suppr" :disabled="u.nb_commandes > 0" :title="u.nb_commandes > 0 ? 'Impossible : ce client a des commandes' : 'Supprimer ce client'" @click="aSupprimer = u">Supprimer</button></td>
            </tr>
          </tbody>
        </table>
      </div>
      <nav v-if="nbPages > 1" class="pagination" aria-label="Pagination">
        <button type="button" :disabled="page === 1" @click="allerA(page - 1)">‹</button>
        <button v-for="n in nbPages" :key="n" type="button" :class="{ courante: n === page }" @click="allerA(n)">{{ n }}</button>
        <button type="button" :disabled="page === nbPages" @click="allerA(page + 1)">›</button>
      </nav>
    </section>
    <p class="aide">{{ total }} client(s) au total. La liste ne montre que les comptes clients. Les mots de passe ne sont jamais affichés.</p>
    <section v-if="aSupprimer" class="carte confirmation">
      <h2>Confirmation avant suppression</h2>
      <p>Supprimer le compte de {{ aSupprimer.prenom }} {{ aSupprimer.nom }} ({{ aSupprimer.email }}) ? Cette action est définitive.</p>
      <div class="actions">
        <button type="button" class="oui" @click="confirmerSuppression">Oui, supprimer</button>
        <button type="button" class="bouton bouton-contour" @click="aSupprimer = null">Annuler</button>
      </div>
    </section>
  </div>
</template>

<style scoped>
h1 { font-family: "Playfair Display", serif; color: var(--marine); margin: 0 0 0.25rem; }
.aide { margin: 0.5rem 0 1rem; font-size: 0.85rem; color: var(--texte-doux); }
.succes { background: var(--succes-fond); color: var(--succes-texte); padding: 0.75rem 1rem; border-radius: 10px; }
.alerte { background: var(--erreur-fond); color: var(--erreur-texte); padding: 0.75rem 1rem; border-radius: 10px; }
.recherche { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1.25rem; }
.recherche input { flex: 1 1 300px; min-height: 44px; box-sizing: border-box; border: 1px solid var(--marine); border-radius: 8px; padding: 0 14px; background: var(--blanc); font: inherit; }
.cache { position: absolute; left: -9999px; }
.carte { background: var(--blanc); border: 1px solid var(--bordure); border-radius: 12px; padding: 0.5rem 1.25rem; }
.defile { overflow-x: auto; }
table { width: 100%; min-width: 920px; border-collapse: collapse; text-align: left; }
th { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; color: var(--texte-doux); padding: 0.75rem 0.5rem; border-bottom: 2px solid var(--marine); }
td { padding: 0.75rem 0.5rem; border-bottom: 1px solid var(--bordure); }
.gras { font-weight: 600; }
.pagination { display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center; padding: 1rem 0; }
.pagination button { min-width: 44px; min-height: 44px; border: 1.5px solid var(--marine); border-radius: 8px; background: var(--blanc); color: var(--marine); cursor: pointer; }
.pagination button.courante { background: var(--marine); color: var(--blanc); }
.pagination button:disabled { opacity: 0.4; cursor: not-allowed; }
.suppr { min-height: 44px; padding: 0 14px; border: 1.5px solid var(--rouge); border-radius: 8px; background: var(--blanc); color: var(--rouge); font-weight: 500; cursor: pointer; }
.suppr:disabled { border-color: var(--bordure); background: var(--fond-desactive); color: var(--texte-doux); cursor: not-allowed; }
.confirmation { margin-top: 1.25rem; max-width: 620px; padding: 1rem 1.25rem; }
.confirmation h2 { font-family: "Playfair Display", serif; color: var(--marine); margin: 0 0 0.5rem; font-size: 1.2rem; }
.actions { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; }
.oui { min-height: 44px; padding: 0 20px; border: 0; border-radius: 8px; background: var(--rouge); color: var(--sur-rouge); font-weight: 500; cursor: pointer; }
</style>
