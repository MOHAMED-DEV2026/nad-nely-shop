<script setup>
import { computed } from "vue"
import { theme, basculerTheme } from "../stores/theme"

const sombre = computed(() => theme.value === "sombre")
const libelle = computed(() => (sombre.value ? "Passer en mode clair" : "Passer en mode sombre"))
</script>

<template>
  <button type="button" class="bouton-theme" :aria-label="libelle" :title="libelle" @click="basculerTheme">
    <!-- En mode sombre on montre le soleil (pour revenir au clair), sinon la lune -->
    <svg v-if="sombre" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
    <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
  </button>
</template>

<style scoped>
.bouton-theme { width: 44px; height: 44px; flex: none; display: inline-flex; align-items: center; justify-content: center; border: 1.5px solid currentColor; border-radius: 999px; background: transparent; color: inherit; }
.bouton-theme:hover { opacity: 0.8; }
</style>
