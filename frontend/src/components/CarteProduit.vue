<script setup>
import { formaterPrix } from "../utils/format"
import { urlImage } from "../services/api"

defineProps({ produit: { type: Object, required: true } })
</script>

<template>
  <article class="carte">
    <div class="carte-photo">
      <img v-if="produit.image" :src="urlImage(produit.image)" :alt="produit.nom" loading="lazy" />
      <span v-else>Photo produit</span>
      <span v-if="!produit.disponible" class="badge-indispo">Indisponible</span>
    </div>
    <div class="carte-corps">
      <span class="carte-cat">{{ produit.categorie }}</span>
      <h3>{{ produit.nom }}</h3>
      <p class="carte-prix">{{ formaterPrix(produit.prix) }}</p>
      <RouterLink :to="`/produit/${produit.id_produit}`" class="carte-lien">Voir le produit</RouterLink>
    </div>
  </article>
</template>

<style scoped>
.carte { background: var(--blanc); border: 1px solid var(--bordure); border-radius: var(--arrondi-moyen); overflow: hidden; display: flex; flex-direction: column; }
.carte-photo { position: relative; height: 200px; background: var(--rose); display: flex; align-items: center; justify-content: center; color: var(--marine); font-family: var(--police-titre); }
.carte-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
.badge-indispo { position: absolute; top: 10px; left: 10px; background: var(--rouge); color: var(--blanc); font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 999px; font-family: var(--police-texte); }
.carte-corps { padding: 16px; display: flex; flex-direction: column; gap: 4px; flex: 1; }
.carte-cat { font-size: 11px; letter-spacing: 1px; text-transform: uppercase; color: #555555; }
.carte-corps h3 { margin: 0; font-size: 16px; font-weight: 600; color: var(--texte); font-family: var(--police-texte); }
.carte-prix { margin: 0 0 8px; font-family: var(--police-titre); font-size: 20px; font-weight: 700; color: var(--marine); }
.carte-lien { margin-top: auto; min-height: var(--hauteur-bouton); display: flex; align-items: center; justify-content: center; background: var(--marine); color: var(--blanc); border-radius: var(--arrondi-petit); font-weight: 500; font-size: 14px; }
</style>
