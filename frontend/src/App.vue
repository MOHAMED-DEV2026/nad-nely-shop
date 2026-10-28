<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import EnTete from "./components/EnTete.vue";
import PiedDePage from "./components/PiedDePage.vue";

const route = useRoute();
const admin = computed(() => route.path.startsWith("/admin"));
</script>

<template>
  <div class="appli">
    <EnTete v-if="!admin" />
    <div class="contenu"><RouterView /></div>
    <PiedDePage v-if="!admin" />
  </div>
</template>

<style scoped>
.appli { display: flex; flex-direction: column; min-height: 100vh; }
.contenu { flex: 1; }
</style>
