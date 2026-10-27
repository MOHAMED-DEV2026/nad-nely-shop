<script setup>
import { ref } from "vue";
import { useRoute } from "vue-router";
import { appelerApi } from "../../services/api.js";

const route = useRoute();
const envoi = ref(false);
const erreur = ref("");

async function reessayer() {
  envoi.value = true;
  erreur.value = "";
  try {
    const rep = await appelerApi("/commandes/" + route.query.commande + "/paiement", { method: "POST" });
    if (rep.url_paiement) window.location.href = rep.url_paiement;
    else erreur.value = "Le paiement est indisponible pour le moment.";
  } catch (e) {
    erreur.value = (e.donnees && e.donnees.message) || "Impossible de relancer le paiement.";
  } finally {
    envoi.value = false;
  }
}
</script>

<template>
  <section class="page">
    <h1>Paiement non abouti</h1>
    <p>Le paiement a été annulé. Votre commande est enregistrée mais pas encore payée.</p>
    <p v-if="erreur" class="erreur">{{ erreur }}</p>
    <button class="bouton" :disabled="envoi" @click="reessayer">Réessayer</button>
    <RouterLink class="bouton-contour bouton" to="/panier">Retour au panier</RouterLink>
  </section>
</template>

<style scoped>
.page { max-width: 640px; margin: 0 auto; padding: 32px 16px; display: flex; flex-direction: column; gap: 16px; align-items: flex-start; }
.erreur { background: var(--erreur-fond); color: var(--erreur-texte); padding: 12px; border-radius: 8px; }
</style>
