<script setup>
import { ref, onMounted } from "vue"
import { appelerApi, urlImage } from "../../services/api.js"

const categories = ref([])
const nom = ref("")
const description = ref("")
const enModification = ref(null)
const erreurForm = ref("")
const alerte = ref("")
const message = ref("")
const aSupprimer = ref(null)
const chargement = ref(true)

// Photo de la catégorie (affichée sur la page d'accueil)
const champFichier = ref(null)
const fichier = ref(null)
const apercu = ref("")
const imageActuelle = ref("")
const retirerImage = ref(false)

function viderPhoto() {
  if (apercu.value) URL.revokeObjectURL(apercu.value)
  fichier.value = null
  apercu.value = ""
  if (champFichier.value) champFichier.value.value = ""
}

// Mêmes règles que le serveur : JPG, PNG ou WEBP, 2 Mo maximum
function choisirFichier(evenement) {
  erreurForm.value = ""
  viderPhoto()
  const f = evenement.target.files[0]
  if (!f) return
  if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
    erreurForm.value = "Photo : formats acceptés JPG, PNG ou WEBP"
    evenement.target.value = ""
    return
  }
  if (f.size > 2 * 1024 * 1024) {
    erreurForm.value = "Photo trop lourde : 2 Mo maximum"
    evenement.target.value = ""
    return
  }
  fichier.value = f
  apercu.value = URL.createObjectURL(f)
  retirerImage.value = false
}

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
  imageActuelle.value = c.image || ""
  retirerImage.value = false
  viderPhoto()
  erreurForm.value = ""
  message.value = ""
  alerte.value = ""
}

function annulerFormulaire() {
  enModification.value = null
  nom.value = ""
  description.value = ""
  imageActuelle.value = ""
  retirerImage.value = false
  viderPhoto()
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
    // Formulaire en plusieurs parties (multipart), car il peut contenir une photo
    const donnees = new FormData()
    donnees.append("nom", nom.value.trim())
    donnees.append("description", description.value.trim())
    if (fichier.value) donnees.append("image", fichier.value)
    else if (modification && retirerImage.value) donnees.append("retirer_image", "1")
    await appelerApi(modification ? "/admin/categories/" + enModification.value : "/admin/categories", { method: modification ? "PUT" : "POST", corps: donnees })
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
            <thead><tr><th>Photo</th><th>Catégorie</th><th>Produits</th><th>Actions</th></tr></thead>
            <tbody>
              <tr v-for="c in categories" :key="c.id_categorie">
                <td>
                  <img v-if="c.image" :src="urlImage(c.image)" :alt="'Photo de la catégorie ' + c.nom" class="vignette" />
                  <span v-else class="sans-photo" aria-label="Pas de photo">{{ c.nom.charAt(0) }}</span>
                </td>
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
          <div class="champ">
            <label for="photo">Photo (facultative)</label>
            <input id="photo" ref="champFichier" type="file" accept="image/jpeg,image/png,image/webp" aria-describedby="photo-aide" @change="choisirFichier" />
            <p id="photo-aide" class="aide">JPG, PNG ou WEBP, 2 Mo maximum. Affichée sur la tuile de la page d'accueil.</p>
            <div v-if="apercu || (imageActuelle && !retirerImage)" class="apercu">
              <img :src="apercu || urlImage(imageActuelle)" :alt="apercu ? 'Aperçu de la nouvelle photo' : 'Photo actuelle'" />
              <span>{{ apercu ? "Nouvelle photo" : "Photo actuelle" }}</span>
            </div>
            <label v-if="enModification !== null && imageActuelle && !fichier" class="case">
              <input v-model="retirerImage" type="checkbox" /> Retirer la photo
            </label>
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
.carte { background: var(--blanc); border: 1px solid var(--bordure); border-radius: 12px; padding: 1.25rem; }
.defile { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; text-align: left; min-width: 480px; }
th { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; color: var(--texte-doux); padding: 0.75rem 0.5rem; border-bottom: 2px solid var(--marine); }
td { padding: 0.6rem 0.5rem; border-bottom: 1px solid var(--bordure); vertical-align: middle; }
.nom { font-weight: 600; }
.desc { font-size: 0.8rem; color: var(--texte-doux); }
.nb { font-weight: 600; }
.actions { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; }
.petit { padding: 0 14px; min-height: 44px; }
.suppr { min-height: 44px; padding: 0 14px; border: 1.5px solid var(--rouge); border-radius: 8px; background: var(--blanc); color: var(--rouge); font-weight: 500; cursor: pointer; }
.suppr:disabled { border-color: var(--bordure); background: var(--fond-desactive); color: var(--texte-doux); cursor: not-allowed; }
.oui { min-height: 44px; padding: 0 20px; border: 0; border-radius: 8px; background: var(--rouge); color: var(--sur-rouge); font-weight: 500; cursor: pointer; }
.note { font-size: 0.75rem; color: var(--texte-doux); }
.champ { margin-bottom: 1rem; }
label { display: block; font-weight: 500; font-size: 0.9rem; margin-bottom: 0.3rem; }
input, textarea { width: 100%; box-sizing: border-box; padding: 0.7rem 0.85rem; border: 1.5px solid var(--marine); border-radius: 8px; font: inherit; background: var(--creme); }
.vignette, .sans-photo { width: 48px; height: 48px; border-radius: 8px; display: flex; align-items: center; justify-content: center; object-fit: cover; }
.sans-photo { background: var(--fond-desactive); color: var(--texte-doux); font-family: "Playfair Display", serif; font-weight: 700; }
input[type="file"] { padding: 0.5rem; }
.aide { font-size: 0.8rem; color: var(--texte-doux); margin: 0.3rem 0 0; }
.apercu { display: flex; align-items: center; gap: 0.75rem; margin-top: 0.75rem; font-size: 0.85rem; color: var(--texte-doux); }
.apercu img { width: 96px; height: 96px; object-fit: cover; border-radius: 12px; border: 1px solid var(--bordure); }
.case { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.75rem; font-weight: 400; cursor: pointer; }
.case input { width: 18px; height: 18px; margin: 0; accent-color: var(--marine); }
.erreur { color: var(--rouge); font-size: 0.85rem; margin: 0.3rem 0 0; }
.alerte { background: var(--erreur-fond); color: var(--erreur-texte); padding: 0.75rem 1rem; border-radius: 10px; }
.succes { background: var(--succes-fond); color: var(--succes-texte); padding: 0.75rem 1rem; border-radius: 10px; }
.confirmation { margin-top: 1.25rem; max-width: 620px; }
@media (min-width: 1024px) {
  .deux { grid-template-columns: 2fr 1fr; }
}
</style>
