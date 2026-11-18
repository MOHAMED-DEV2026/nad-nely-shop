<script setup>
import { ref, computed, watch } from "vue"
import { useRoute } from "vue-router"
import { appelerApi, urlImage } from "../../services/api"
import { formaterPrix } from "../../utils/format"
import { panier } from "../../stores/panier"
import SelecteurQuantite from "../../components/SelecteurQuantite.vue"

const route = useRoute()
const produit = ref(null)
const chargement = ref(true)
const erreur = ref("")
const quantite = ref(1)
const message = ref("")

async function charger() {
  chargement.value = true
  quantite.value = 1
  message.value = ""
  erreur.value = ""
  try {
    produit.value = await appelerApi("/produits/" + route.params.id)
  } catch (e) {
    produit.value = null
    erreur.value = e.statut === 404 ? "Ce produit est introuvable." : "Impossible de charger le produit. Réessayez plus tard."
  } finally {
    chargement.value = false
  }
}

// Etiquette de disponibilite : En stock, Plus que X en stock (5 ou moins), Indisponible
const etiquette = computed(() => {
  const p = produit.value
  if (!p || !p.disponible) return { texte: "Indisponible", classe: "indispo" }
  if (p.stock <= 5) return { texte: "Plus que " + p.stock + " en stock", classe: "faible" }
  return { texte: "En stock", classe: "dispo" }
})

const lienCategorie = computed(() => ({ path: "/catalogue", query: { categorie: produit.value ? produit.value.id_categorie : "" } }))

function ajouter() {
  panier.ajouter(produit.value, quantite.value)
  message.value = "Produit ajouté au panier"
}

function formaterDate(date) {
  return date ? new Date(date).toLocaleDateString("fr-FR") : ""
}

watch(() => route.params.id, charger, { immediate: true })
</script>

<template>
  <main class="page">
    <p v-if="chargement" class="info">Chargement…</p>
    <p v-else-if="erreur" class="message-erreur" role="alert">{{ erreur }} <RouterLink to="/catalogue">Retour au catalogue</RouterLink></p>
    <template v-else-if="produit">
      <nav class="fil" aria-label="Fil d'Ariane">
        <RouterLink to="/">Accueil</RouterLink> › <RouterLink to="/catalogue">Catalogue</RouterLink> › <RouterLink :to="lienCategorie">{{ produit.categorie }}</RouterLink> › {{ produit.nom }}
      </nav>
      <div class="fiche">
        <div class="fiche-photo">
          <img v-if="produit.image" :src="urlImage(produit.image)" :alt="produit.nom" />
          <span v-else>Photo du produit</span>
        </div>
        <div class="fiche-infos">
          <span class="cat">{{ produit.categorie }}</span>
          <h1>{{ produit.nom }}</h1>
          <p class="prix">{{ formaterPrix(produit.prix) }}</p>
          <p class="etiquette" :class="etiquette.classe">{{ etiquette.texte }}</p>
          <p class="description">{{ produit.description }}</p>
          <dl v-if="produit.marque || produit.origine || produit.date_fabrication || produit.date_expiration" class="details">
            <template v-if="produit.marque"><dt>Marque</dt><dd>{{ produit.marque }}</dd></template>
            <template v-if="produit.origine"><dt>Origine</dt><dd>{{ produit.origine }}</dd></template>
            <template v-if="produit.date_fabrication"><dt>Fabriqué le</dt><dd>{{ formaterDate(produit.date_fabrication) }}</dd></template>
            <template v-if="produit.date_expiration"><dt>À utiliser avant le</dt><dd>{{ formaterDate(produit.date_expiration) }}</dd></template>
          </dl>
          <div class="achat">
            <SelecteurQuantite v-if="produit.disponible" v-model="quantite" :max="produit.stock" />
            <button type="button" class="bouton ajout" :disabled="!produit.disponible" @click="ajouter">Ajouter au panier</button>
          </div>
          <p v-if="message" class="confirmation" role="status">{{ message }}</p>
        </div>
      </div>
    </template>
  </main>
</template>

<style scoped>
.page { max-width: var(--largeur-max); margin: 0 auto; padding: 24px; }
.fil { font-size: 13px; color: var(--texte-doux); margin-bottom: 24px; }
.fil a { text-decoration: underline; }
.fiche { display: flex; flex-wrap: wrap; gap: 48px; align-items: flex-start; }
.fiche-photo { flex: 1 1 420px; aspect-ratio: 1 / 1; max-height: 520px; border-radius: var(--arrondi-grand); background: var(--fond-bleu-clair); display: flex; align-items: center; justify-content: center; color: var(--marine); font-family: var(--police-titre); font-size: 22px; overflow: hidden; }
.fiche-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
.fiche-infos { flex: 1 1 420px; display: flex; flex-direction: column; gap: 16px; }
.cat { font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: var(--texte-doux); }
.fiche-infos h1 { margin: 0; font-size: 40px; line-height: 1.15; }
.prix { margin: 0; font-family: var(--police-titre); font-size: 32px; font-weight: 700; color: var(--marine); }
.etiquette { margin: 0; align-self: flex-start; padding: 4px 14px; border-radius: 999px; font-weight: 600; font-size: 14px; }
.etiquette.dispo { background: var(--succes-fond); color: var(--succes-texte); }
.etiquette.faible { background: var(--alerte-fond); color: var(--alerte-texte); }
.etiquette.indispo { background: var(--rouge); color: var(--sur-rouge); }
.description { margin: 0; color: var(--texte); }
.details { margin: 0; display: grid; grid-template-columns: auto 1fr; gap: 6px 24px; background: var(--blanc); border: 1px solid var(--bordure); border-radius: 12px; padding: 16px; font-size: 14px; }
.details dt { color: var(--texte-doux); }
.details dd { margin: 0; font-weight: 500; }
.achat { display: flex; flex-wrap: wrap; align-items: center; gap: 16px; }
.ajout { flex: 1 1 220px; min-height: 52px; font-size: 16px; font-weight: 600; }
.confirmation { margin: 0; background: var(--succes-fond); color: var(--succes-texte); border-radius: var(--arrondi-petit); padding: 12px 16px; font-size: 14px; font-weight: 500; }
.ajout:disabled { background: var(--fond-desactive); border-color: var(--fond-desactive); color: var(--texte-doux); cursor: not-allowed; }
.info { color: var(--texte-doux); font-size: 14px; }
.message-erreur { background: var(--erreur-fond); color: var(--erreur-texte); border-radius: var(--arrondi-petit); padding: 12px 16px; font-weight: 500; }
.message-erreur a { text-decoration: underline; margin-left: 8px; }
</style>

