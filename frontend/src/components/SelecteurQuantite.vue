<script setup>
const props = defineProps({
  modelValue: { type: Number, required: true },
  max: { type: Number, default: 99 },
})
const emit = defineEmits(["update:modelValue"])

// Garde la quantite entre 1 et le maximum
function borner(valeur) {
  const n = parseInt(valeur, 10)
  return Math.min(Math.max(isNaN(n) ? 1 : n, 1), props.max)
}

function changer(ecart) {
  emit("update:modelValue", borner(props.modelValue + ecart))
}

function saisie(evenement) {
  const valeur = borner(evenement.target.value)
  evenement.target.value = valeur
  emit("update:modelValue", valeur)
}
</script>

<template>
  <div class="quantite">
    <button type="button" aria-label="Diminuer la quantité" :disabled="modelValue <= 1" @click="changer(-1)">−</button>
    <input type="text" inputmode="numeric" aria-label="Quantité" :value="modelValue" @change="saisie" />
    <button type="button" aria-label="Augmenter la quantité" :disabled="modelValue >= max" @click="changer(1)">+</button>
  </div>
</template>

<style scoped>
.quantite { display: flex; align-items: center; border: 1.5px solid var(--marine); border-radius: var(--arrondi-petit); overflow: hidden; }
.quantite button { width: 48px; height: 48px; border: 0; background: var(--blanc); color: var(--marine); font-size: 22px; }
.quantite button:disabled { opacity: 0.4; cursor: default; }
.quantite input { width: 56px; height: 48px; border: 0; text-align: center; font-size: 16px; background: var(--blanc); }
</style>
