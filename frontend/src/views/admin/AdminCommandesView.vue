<script setup>
import { ref, computed, onMounted } from "vue"
import { useRoute } from "vue-router"
import { appelerApi } from "../../services/api.js"
import { formaterPrix } from "../../utils/format.js"
import { styleStatut } from "../../utils/statuts.js"

const route = useRoute()
const commandes = ref([])
const total = ref(0)
const page = ref(1)
const parPage = ref(20)
const statut = ref(route.query.statut || "")
const du = ref("")
const au = ref("")
const client = ref("")
const alerte = ref("")
const chargement = ref(true)

const nbPages = computed(() => Math.max(1, Math.ceil(total.value / parPage.value)))

async function charger() {
  chargement.value = true
  alerte.value = ""
  const parametres = new URLSearchParams({ page: page.value })
  if (statut.value) parametres.set("statut", statut.value)
  if (du.value) parametres.set("du", du.value)
  if (au.value) parametres.set("au", au.value)
  if (client.value.trim()) parametres.set("client", client.value.trim())
  try {
    const r = await appelerApi("/admin/commandes?" + parametres.toString())
    commandes.value = r.commandes
    total.value = r.total
    parPage.value = r.par_page
  } catch (e) {
    alerte.value = e.message
  }
  chargement.value = false
}

onMounted(charger)

function filtrer() {
  page.value = 1
  charger()
}

function reinitialiser() {
  statut.value = ""
  du.value = ""
  au.value = ""
  client.value = ""
  page.value = 1
  charger()
}

function allerA(n) {
  if (n < 1 || n > nbPages.value) return
  page.value = n
  charger()
}

function dateCourte(d) {
  return new Date(d).toLocaleDateString("fr-FR")
}

function reception(c) {
  return c.mode_reception === "retrait" ? "Retrait" : "Livraison · " + c.commune_livraison
}
</script>

<template>
  <div>
    <h1>Commandes</h1>
    <p class="aide">De la plus récente à la plus ancienne, 20 par page.</p>
    <p v-if="alerte" class="alerte">{{ alerte }}</p>
    <form class="filtres" @submit.prevent="filtrer">
      <div class="champ">
        <label for="st">Statut</label>
        <select id="st" v-model="statut">
          <option value="">Tous les statuts</option>
          <option value="en_attente">En attente</option>
          <option value="confirmee">Confirmée</option>
          <option value="expediee">Expédiée</option>
          <option value="livree">Livrée</option>
          <option value="annulee">Annulée</option>
        </select>
      </div>
      <div class="champ"><label for="d1">Du</label><input id="d1" v-model="du" type="date" /></div>
      <div class="champ"><label for="d2">Au</label><input id="d2" v-model="au" type="date" /></div>
      <div class="champ large"><label for="cl">Client (nom ou e-mail)</label><input id="cl" v-model="client" type="search" /></div>
      <button type="submit" class="bouton">Filtrer</button>
      <button type="button" class="bouton bouton-contour" @click="reinitialiser">Réinitialiser</button>
    </form>
    <section class="carte">
      <p v-if="chargement">Chargement...</p>
      <p v-else-if="commandes.length === 0">Aucune commande ne correspond à ces filtres.</p>
      <div v-else class="defile">
        <table>
          <thead><tr><th>N°</th><th>Date</th><th>Client</th><th>Réception</th><th>Total</th><th>Statut</th><th>Actions</th></tr></thead>
          <tbody>
            <tr v-for="c in commandes" :key="c.id_commande">
              <td class="num">#{{ c.id_commande }}</td>
              <td>{{ dateCourte(c.date_commande) }}</td>
              <td>{{ c.prenom }} {{ c.nom }}<div class="mail">{{ c.email }}</div></td>
              <td>{{ reception(c) }}</td>
              <td>{{ formaterPrix(c.montant_total) }}</td>
              <td><span class="badge" :style="styleStatut(c.statut)">{{ c.statut_affiche }}</span></td>
              <td><RouterLink :to="`/admin/commandes/${c.id_commande}`" class="bouton bouton-contour petit">Voir le détail</RouterLink></td>
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
  </div>
</template>

<style scoped>
h1 { font-family: "Playfair Display", serif; color: var(--marine); margin: 0 0 0.25rem; }
.aide { margin: 0 0 1rem; font-size: 0.85rem; color: var(--texte-doux); }
.alerte { background: var(--erreur-fond); color: var(--erreur-texte); padding: 0.75rem 1rem; border-radius: 10px; }
.filtres { background: var(--blanc); border: 1px solid #E3DDD2; border-radius: 12px; padding: 1.25rem; display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: flex-end; margin-bottom: 1.25rem; }
.champ { flex: 1 1 160px; display: flex; flex-direction: column; gap: 0.25rem; }
.large { flex: 2 1 220px; }
label { font-size: 0.8rem; font-weight: 500; }
select, input { min-height: 44px; box-sizing: border-box; border: 1px solid var(--marine); border-radius: 8px; padding: 0 12px; background: var(--creme); font: inherit; }
.carte { background: var(--blanc); border: 1px solid #E3DDD2; border-radius: 12px; padding: 0.5rem 1.25rem; }
.defile { overflow-x: auto; }
table { width: 100%; min-width: 860px; border-collapse: collapse; text-align: left; }
th { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; color: var(--texte-doux); padding: 0.75rem 0.5rem; border-bottom: 2px solid var(--marine); }
td { padding: 0.6rem 0.5rem; border-bottom: 1px solid #E3DDD2; vertical-align: middle; }
.num { font-weight: 600; color: var(--marine); }
.mail { font-size: 0.75rem; color: var(--texte-doux); }
.badge { display: inline-block; padding: 2px 12px; border-radius: 999px; font-size: 0.75rem; font-weight: 600; white-space: nowrap; }
.petit { display: inline-flex; align-items: center; min-height: 44px; padding: 0 14px; text-decoration: none; white-space: nowrap; }
.pagination { display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center; padding: 1rem 0; }
.pagination button { min-width: 44px; min-height: 44px; border: 1.5px solid var(--marine); border-radius: 8px; background: var(--blanc); color: var(--marine); cursor: pointer; }
.pagination button.courante { background: var(--marine); color: var(--blanc); }
.pagination button:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
