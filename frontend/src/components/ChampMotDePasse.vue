<script setup>
import { ref } from "vue"

// Champ mot de passe avec un bouton « œil », comme dans Windows :
// l'œil n'apparaît que lorsqu'on a commencé à écrire ; tant qu'on appuie dessus
// (souris, doigt ou touche Entrée/Espace), le mot de passe est visible ; on relâche, il se cache.
// Les attributs (id, autocomplete, required, minlength...) sont transmis au champ <input>.
defineOptions({ inheritAttrs: false })
defineProps({ modelValue: { type: String, default: "" } })
defineEmits(["update:modelValue"])

const visible = ref(false)
const montrer = () => { visible.value = true }
const cacher = () => { visible.value = false }
function toucheEnfoncee(e) {
  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); visible.value = true }
}
function toucheRelachee(e) {
  if (e.key === "Enter" || e.key === " ") visible.value = false
}
</script>

<template>
  <div class="mdp">
    <input
      v-bind="$attrs"
      :value="modelValue"
      :type="visible ? 'text' : 'password'"
      @input="$emit('update:modelValue', $event.target.value)"
    />
    <button
      v-if="modelValue"
      type="button"
      class="oeil"
      aria-label="Maintenir pour afficher le mot de passe"
      title="Maintenir pour afficher le mot de passe"
      @pointerdown.prevent="montrer"
      @pointerup="cacher"
      @pointerleave="cacher"
      @pointercancel="cacher"
      @blur="cacher"
      @contextmenu.prevent
      @keydown="toucheEnfoncee"
      @keyup="toucheRelachee"
    >
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M3 13.2C5.2 9.6 8.4 7.6 12 7.6s6.8 2 9 5.6" />
        <circle cx="12" cy="13.6" r="2.7" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.mdp { position: relative; display: flex; }
.mdp input { flex: 1 1 auto; min-width: 0; min-height: var(--hauteur-champ); border: 1.5px solid var(--marine); border-radius: var(--arrondi-petit); padding: 0 52px 0 14px; font-size: 16px; background: var(--creme); }
.oeil { position: absolute; top: 0; right: 0; width: 48px; height: 100%; min-height: 44px; display: flex; align-items: center; justify-content: center; border: 0; background: transparent; color: var(--texte-doux); cursor: pointer; border-radius: var(--arrondi-petit); touch-action: none; user-select: none; -webkit-user-select: none; }
.oeil:hover, .oeil:active { background: rgba(127, 127, 127, 0.18); }
</style>
