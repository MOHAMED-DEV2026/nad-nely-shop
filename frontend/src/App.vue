<script setup>
import EnTete from './components/EnTete.vue'
import PiedDePage from './components/PiedDePage.vue'
</script>

<template>
  <div class="appli">
    <EnTete />
    <div class="contenu"><RouterView /></div>
    <PiedDePage />
  </div>
</template>

<style>
.appli { min-height: 100vh; display: flex; flex-direction: column; }
.contenu { flex: 1; }
</style>
