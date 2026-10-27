<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { appelerApi } from "../../services/api.js";
import { panier } from "../../stores/panier.js";

const route = useRoute();
const chargement = ref(true);
const erreur = ref("");
const numero = ref(null);

onMounted(async () => {
  try {
    const rep = await appelerApi("/paiements/verification", { method: "POST", corps: { session_id: route.query.session_id } });
    numero.value = rep.id_commande;
    panier.vider();
  } catch (e) {
    erreur.value = (e.donnees && e.donnees.message) || "Impossible de vérifier le paiement.";
  } finally {
    chargement.value = false;
  }
});
</script>

<template>
  <section class="page">
    <p v-if="chargement">Vérification du paiement...</p>
    <template v-else-if="numero">
      <h1>Paiement réussi</h1>
      <p>Merci pour votre commande ! Votre numéro de commande est le <strong>{{ numero }}</strong>.</p>
      <RouterLink class="bouton" to="/catalogue">Continuer mes achats</RouterLink>
    </template>
    <template v-else>
      <h1>Paiement non confirmé</h1>
      <p class="erreur">{{ erreur }}</p>
      <RouterLink class="bouton" to="/panier">Retour au panier</RouterLink>
    </template>
  </section>
</template>

<style scoped>
.page { max-width: 640px; margin: 0 auto; padding: 32px 16px; display: flex; flex-direction: column; gap: 16px; align-items: flex-start; }
.erreur { background: var(--erreur-fond); color: var(--erreur-texte); padding: 12px; border-radius: 8px; }
</style>
