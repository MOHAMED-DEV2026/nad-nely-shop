<script setup>
import { computed } from "vue"
import { useRoute, useRouter } from "vue-router"

const props = defineProps({
  total: { type: Number, required: true },
  parPage: { type: Number, default: 12 },
})

const route = useRoute()
const router = useRouter()

const pageCourante = computed(() => Math.max(1, parseInt(route.query.page, 10) || 1))
const nbPages = computed(() => Math.max(1, Math.ceil(props.total / props.parPage)))
const pages = computed(() => Array.from({ length: nbPages.value }, (_, i) => i + 1))

// Change de page en gardant les filtres de l adresse
function aller(numero) {
  if (numero < 1 || numero > nbPages.value || numero === pageCourante.value) return
  router.push({ path: "/catalogue", query: { ...route.query, page: numero } })
}
</script>

<template>
  <nav v-if="nbPages > 1" class="pagination" aria-label="Pagination">
    <button type="button" :disabled="pageCourante === 1" aria-label="Page précédente" @click="aller(pageCourante - 1)">‹</button>
    <button v-for="n in pages" :key="n" type="button" :class="{ actif: n === pageCourante }" :aria-current="n === pageCourante" @click="aller(n)">{{ n }}</button>
    <button type="button" :disabled="pageCourante === nbPages" aria-label="Page suivante" @click="aller(pageCourante + 1)">›</button>
  </nav>
</template>

<style scoped>
.pagination { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; align-items: center; margin-top: 24px; }
.pagination button { min-width: 44px; min-height: var(--hauteur-bouton); padding: 0 12px; border: 1.5px solid var(--marine); border-radius: var(--arrondi-petit); background: var(--blanc); color: var(--marine); font-weight: 500; }
.pagination button.actif { background: var(--marine); color: var(--blanc); }
.pagination button:disabled { opacity: 0.4; cursor: default; }
</style>
