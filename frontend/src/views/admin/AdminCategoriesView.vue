<script setup>
import { ref, onMounted } from "vue"
import { appelerApi } from "../../services/api.js"

const categories = ref([])
const nom = ref("")
const description = ref("")
const enModification = ref(null)
const erreurForm = ref("")
const alerte = ref("")
const message = ref("")
const aSupprimer = ref(null)
const chargement = ref(true)

async function charger() {
  try {
    categories.value = await appelerApi("/admin/categories")
  } catch (e) {
    alerte.value = e.message
  }
  chargement.value = false
}

onMounted(charger)

function modifier(c) {
  enModification.value = c.id_categorie
  nom.value = c.nom
  description.value = c.description || ""
  erreurForm.value = ""
  message.value = ""
  alerte.value = ""
}

function annulerFormulaire() {
  enModification.value = null
  nom.value = ""
  description.value = ""
  erreurForm.value = ""
}

async function enregistrer() {
  erreurForm.value = ""
  message.value = ""
  alerte.value = ""
  if (!nom.value.trim()) {
    erreurForm.value = "Le nom est obligatoire"
    return
  }
  const modification = enModification.value !== null
  try {
    await appelerApi(modification ? "/admin/categories/" + enModification.value : "/admin/categories", { method: modification ? "PUT" : "POST", corps: { nom: nom.value.trim(), description: description.value.trim() } })
    message.value = modification ? "Catégorie modifiée" : "Catégorie ajoutée"
    annulerFormulaire()
    await charger()
  } catch (e) {
    erreurForm.value = e.donnees && e.donnees.erreurs ? e.donnees.erreurs[0].msg : e.message
  }
}

async function confirmerSuppression() {
  const c = aSupprimer.value
  aSupprimer.value = null
  message.value = ""
  alerte.value = ""
  try {
    const r = await appelerApi("/admin/categories/" + c.id_categorie, { method: "DELETE" })
    message.value = r.message
    await charger()
  } catch (e) {
    alerte.value = e.message
  }
}
</script>

<template>
  <div>
    <h1>Catégories</h1>
    <p v-if="message" class="succes">{{ message }}</p>
    <p v-if="alerte" class="alerte">{{ alerte }}</p>
    <div class="deux">
      <section class="carte">
        <p v-if="chargement">Chargement...</p>
        <div v-else class="defile">
          <table>
            <thead><tr><th>Catégorie</th><th>Produits</th><th>Actions</th></tr></thead>
            <tbody>
              <tr v-for="c in categories" :key="c.id_categorie">
                <td><div class="nom">{{ c.nom }}</div><div class="desc">{{ c.description }}</div></td>
                <td class="nb">{{ c.nb_produits }}</td>
                <td>
                  <div class="actions">
                    <button type="button" class="bouton bouton-contour petit" @click="modifier(c)">Modifier</button>
                    <button type="button" class="suppr" :disabled="c.nb_produits > 0" @click="aSupprimer = c">Supprimer</button>
                    <span v-if="c.nb_produits > 0" class="note">Produits rattachés : suppression impossible</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      <section class="carte">
        <h2>{{ enModification === null ? "Ajouter une catégorie" : "Modifier la catégorie" }}</h2>
        <form novalidate @submit.prevent="enregistrer">
          <div class="champ">
            <label for="nom">Nom *</label>
            <input id="nom" v-model="nom" type="text" maxlength="50" />
            <p v-if="erreurForm" class="erreur">{{ erreurForm }}</p>
          </div>
          <div class="champ">
            <label for="desc">Description (facultative)</label>
            <textarea id="desc" v-model="description" rows="3" maxlength="255"></textarea>
          </div>
          <div class="actions">
            <button type="submit" class="bouton">{{ enModification === null ? "Ajouter" : "Enregistrer" }}</button>
            <button v-if="enModification !== null" type="button" class="bouton bouton-contour" @click="annulerFormulaire">Annuler</button>
          </div>
        </form>
      </section>
    </div>
    <section v-if="aSupprimer" class="carte confirmation">
      <h2>Confirmation avant suppression</h2>
      <p>Supprimer la catégorie « {{ aSupprimer.nom }} » ? Cette action est définitive.</p>
      <div class="actions">
        <button type="button" class="oui" @click="confirmerSuppression">Oui, supprimer</button>
        <button type="button" class="bouton bouton-contour" @click="aSupprimer = null">Annuler</button>
      </div>
    </section>
  </div>
</template>

<style scoped>
h1 { font-family: "Playfair Display", serif; color: var(--marine); margin: 0 0 1rem; }
h2 { font-family: "Playfair Display", serif; color: var(--marine); margin: 0 0 0.75rem; font-size: 1.25rem; }
.deux { display: grid; grid-template-columns: 1fr; gap: 1.25rem; align-items: start; }
.carte { background: var(--blanc); border: 1px solid #E3DDD2; border-radius: 12px; padding: 1.25rem; }
.defile { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; text-align: left; min-width: 480px; }
th { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; color: var(--texte-doux); padding: 0.75rem 0.5rem; border-bottom: 2px solid var(--marine); }
td { padding: 0.6rem 0.5rem; border-bottom: 1px solid #E3DDD2; vertical-align: middle; }
.nom { font-weight: 600; }
.desc { font-size: 0.8rem; color: var(--texte-doux); }
.nb { font-weight: 600; }
.actions { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; }
.petit { padding: 0 14px; min-height: 44px; }
.suppr { min-height: 44px; padding: 0 14px; border: 1.5px solid var(--rouge); border-radius: 8px; background: var(--blanc); color: var(--rouge); font-weight: 500; cursor: pointer; }
.suppr:disabled { border-color: #BDBDBD; background: #EDEDED; color: #595959; cursor: not-allowed; }
.oui { min-height: 44px; padding: 0 20px; border: 0; border-radius: 8px; background: var(--rouge); color: var(--blanc); font-weight: 500; cursor: pointer; }
.note { font-size: 0.75rem; color: var(--texte-doux); }
.champ { margin-bottom: 1rem; }
label { display: block; font-weight: 500; font-size: 0.9rem; margin-bottom: 0.3rem; }
input, textarea { width: 100%; box-sizing: border-box; padding: 0.7rem 0.85rem; border: 1.5px solid var(--marine); border-radius: 8px; font: inherit; background: var(--creme); }
.erreur { color: var(--rouge); font-size: 0.85rem; margin: 0.3rem 0 0; }
.alerte { background: var(--erreur-fond); color: var(--erreur-texte); padding: 0.75rem 1rem; border-radius: 10px; }
.succes { background: #DDEFDC; color: #1E5B25; padding: 0.75rem 1rem; border-radius: 10px; }
.confirmation { margin-top: 1.25rem; max-width: 620px; }
@media (min-width: 1024px) {
  .deux { grid-template-columns: 2fr 1fr; }
}
</style>
