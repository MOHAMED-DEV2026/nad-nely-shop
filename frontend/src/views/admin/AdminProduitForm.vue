<script setup>
import { ref, onMounted } from "vue"
import { useRoute, useRouter } from "vue-router"
import { appelerApi, urlImage } from "../../services/api.js"

const route = useRoute()
const router = useRouter()
const id = route.params.id
const modification = Boolean(id)
const categories = ref([])
const form = ref({ nom: "", description: "", prix: "", stock: 0, id_categorie: "", marque: "", origine: "", date_fabrication: "", date_expiration: "", actif: true })
const imageActuelle = ref("")
const fichier = ref(null)
const apercu = ref("")
const erreurs = ref({})
const message = ref("")
const enCours = ref(false)
const chargement = ref(true)

function versDate(v) {
  if (!v) return ""
  const d = new Date(v)
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0")
}

onMounted(async () => {
  try {
    categories.value = await appelerApi("/categories")
    if (modification) {
      const p = await appelerApi("/admin/produits/" + id)
      form.value = { nom: p.nom, description: p.description, prix: p.prix, stock: p.stock, id_categorie: p.id_categorie, marque: p.marque || "", origine: p.origine || "", date_fabrication: versDate(p.date_fabrication), date_expiration: versDate(p.date_expiration), actif: Boolean(p.actif) }
      imageActuelle.value = p.image || ""
    }
  } catch (e) {
    message.value = e.message
  }
  chargement.value = false
})

function refuserImage(evenement, texte) {
  erreurs.value = { ...erreurs.value, image: texte }
  evenement.target.value = ""
  fichier.value = null
  apercu.value = ""
}

function choisirFichier(evenement) {
  const f = evenement.target.files[0]
  const reste = { ...erreurs.value }
  delete reste.image
  erreurs.value = reste
  if (!f) {
    fichier.value = null
    apercu.value = ""
    return
  }
  if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) return refuserImage(evenement, "Formats acceptés : JPG, PNG ou WEBP")
  if (f.size > 2 * 1024 * 1024) return refuserImage(evenement, "Image trop lourde : 2 Mo maximum")
  fichier.value = f
  apercu.value = URL.createObjectURL(f)
}

function valider() {
  const f = form.value
  const e = {}
  if (!f.nom.trim()) e.nom = "Le nom est obligatoire"
  if (!f.description.trim()) e.description = "La description est obligatoire"
  if (!(Number(f.prix) > 0)) e.prix = "Le prix doit être supérieur à 0"
  if (f.stock === "" || !Number.isInteger(Number(f.stock)) || Number(f.stock) < 0) e.stock = "Le stock doit être un nombre entier, 0 ou plus"
  if (!f.id_categorie) e.id_categorie = "Choisissez une catégorie"
  if (f.date_fabrication && f.date_expiration && f.date_fabrication >= f.date_expiration) e.date_expiration = "La date de fabrication doit être avant la date limite"
  if (erreurs.value.image) e.image = erreurs.value.image
  erreurs.value = e
  return Object.keys(e).length === 0
}

async function envoyer() {
  message.value = ""
  if (!valider()) return
  enCours.value = true
  const f = form.value
  const donnees = new FormData()
  donnees.append("nom", f.nom.trim())
  donnees.append("description", f.description.trim())
  donnees.append("prix", f.prix)
  donnees.append("stock", f.stock)
  donnees.append("id_categorie", f.id_categorie)
  donnees.append("marque", f.marque.trim())
  donnees.append("origine", f.origine.trim())
  donnees.append("date_fabrication", f.date_fabrication)
  donnees.append("date_expiration", f.date_expiration)
  if (modification) donnees.append("actif", f.actif ? "1" : "0")
  if (fichier.value) donnees.append("image", fichier.value)
  try {
    await appelerApi(modification ? "/admin/produits/" + id : "/admin/produits", { method: modification ? "PUT" : "POST", corps: donnees })
    router.push("/admin/produits")
  } catch (e) {
    if (e.donnees && e.donnees.erreurs) {
      const liste = {}
      e.donnees.erreurs.forEach((x) => { liste[x.path] = x.msg })
      erreurs.value = liste
    } else {
      message.value = e.message
    }
    enCours.value = false
  }
}
</script>

<template>
  <div class="page">
    <RouterLink to="/admin/produits" class="retour">← Retour aux produits</RouterLink>
    <h1>{{ modification ? "Modifier le produit" : "Ajouter un produit" }}</h1>
    <p v-if="chargement">Chargement...</p>
    <form v-else class="carte" novalidate @submit.prevent="envoyer">
      <p v-if="message" class="alerte">{{ message }}</p>
      <div class="champ">
        <label for="nom">Nom du produit *</label>
        <input id="nom" v-model="form.nom" type="text" maxlength="100" />
        <p v-if="erreurs.nom" class="erreur">{{ erreurs.nom }}</p>
      </div>
      <div class="champ">
        <label for="description">Description *</label>
        <textarea id="description" v-model="form.description" rows="4"></textarea>
        <p v-if="erreurs.description" class="erreur">{{ erreurs.description }}</p>
      </div>
      <div class="grille">
        <div class="champ">
          <label for="prix">Prix (€) *</label>
          <input id="prix" v-model="form.prix" type="number" min="0" step="0.01" />
          <p v-if="erreurs.prix" class="erreur">{{ erreurs.prix }}</p>
        </div>
        <div class="champ">
          <label for="stock">Stock *</label>
          <input id="stock" v-model="form.stock" type="number" min="0" step="1" />
          <p v-if="erreurs.stock" class="erreur">{{ erreurs.stock }}</p>
        </div>
      </div>
      <div class="champ">
        <label for="categorie">Catégorie *</label>
        <select id="categorie" v-model="form.id_categorie">
          <option value="">Choisir une catégorie</option>
          <option v-for="c in categories" :key="c.id_categorie" :value="c.id_categorie">{{ c.nom }}</option>
        </select>
        <p v-if="erreurs.id_categorie" class="erreur">{{ erreurs.id_categorie }}</p>
      </div>
      <div class="grille">
        <div class="champ">
          <label for="marque">Marque</label>
          <input id="marque" v-model="form.marque" type="text" maxlength="50" />
        </div>
        <div class="champ">
          <label for="origine">Origine</label>
          <input id="origine" v-model="form.origine" type="text" maxlength="50" />
        </div>
        <div class="champ">
          <label for="fabrication">Date de fabrication</label>
          <input id="fabrication" v-model="form.date_fabrication" type="date" />
        </div>
        <div class="champ">
          <label for="expiration">Date limite (expiration)</label>
          <input id="expiration" v-model="form.date_expiration" type="date" />
          <p v-if="erreurs.date_expiration" class="erreur">{{ erreurs.date_expiration }}</p>
        </div>
      </div>
      <div class="champ">
        <label for="image">Photo du produit (JPG, PNG ou WEBP, 2 Mo maximum)</label>
        <div class="image-zone">
          <img v-if="apercu" :src="apercu" alt="Aperçu" class="vignette" />
          <img v-else-if="imageActuelle" :src="urlImage(imageActuelle)" alt="Photo actuelle" class="vignette" />
          <div v-else class="vignette vide">Aucune photo</div>
          <input id="image" type="file" accept="image/jpeg,image/png,image/webp" @change="choisirFichier" />
        </div>
        <p v-if="erreurs.image" class="erreur">{{ erreurs.image }}</p>
      </div>
      <div v-if="modification" class="case">
        <input id="actif" v-model="form.actif" type="checkbox" />
        <label for="actif">Produit actif (visible dans la boutique)</label>
      </div>
      <div class="actions">
        <button class="bouton" type="submit" :disabled="enCours">{{ enCours ? "Enregistrement..." : "Enregistrer" }}</button>
        <RouterLink to="/admin/produits" class="bouton-contour">Annuler</RouterLink>
      </div>
    </form>
  </div>
</template>

<style scoped>
.page { max-width: 760px; }
.retour { color: var(--marine); font-size: 0.9rem; text-decoration: none; }
h1 { font-family: "Playfair Display", serif; color: var(--marine); margin: 0.5rem 0 1.25rem; }
.carte { background: var(--blanc); border: 1px solid #E3DDD2; border-radius: 16px; padding: 1.25rem; }
.champ { margin-bottom: 1rem; }
label { display: block; font-weight: 600; font-size: 0.9rem; color: var(--marine); margin-bottom: 0.35rem; }
input[type="text"], input[type="number"], input[type="date"], textarea, select { width: 100%; padding: 0.7rem 0.85rem; border: 1px solid var(--bordure); border-radius: 10px; font: inherit; background: var(--blanc); box-sizing: border-box; }
textarea { resize: vertical; }
.grille { display: grid; grid-template-columns: 1fr; column-gap: 1rem; }
.erreur { color: var(--rouge); font-size: 0.85rem; margin: 0.3rem 0 0; }
.alerte { background: var(--erreur-fond); color: var(--erreur-texte); padding: 0.75rem 1rem; border-radius: 10px; margin-bottom: 1rem; }
.image-zone { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
.vignette { width: 96px; height: 96px; object-fit: cover; border-radius: 12px; border: 1px solid #E3DDD2; }
.vide { background: var(--rose); display: flex; align-items: center; justify-content: center; font-size: 0.75rem; color: var(--texte-doux); text-align: center; }
.case { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; }
.case label { margin: 0; }
.actions { display: flex; gap: 0.75rem; flex-wrap: wrap; margin-top: 1.25rem; }
.actions a { text-decoration: none; display: inline-block; text-align: center; }
@media (min-width: 768px) {
  .grille { grid-template-columns: 1fr 1fr; }
}
</style>
