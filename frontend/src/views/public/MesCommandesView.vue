<script setup>
import { ref, onMounted } from "vue";
import { appelerApi } from "../../services/api.js";
import { formaterPrix } from "../../utils/format.js";
import { styleStatut } from "../../utils/statuts.js";
import NavCompte from "../../components/NavCompte.vue";

const commandes = ref([]);
const chargement = ref(true);
const erreur = ref("");

onMounted(async () => {
  try {
    commandes.value = await appelerApi("/commandes");
  } catch (e) {
    erreur.value = "Impossible de charger vos commandes.";
  } finally {
    chargement.value = false;
  }
});

function formaterDate(d) {
  return new Date(d).toLocaleDateString("fr-FR");
}
</script>

<template>
  <section class="page">
    <h1>Mon compte</h1>
    <NavCompte />
    <div class="carte">
      <h2>Historique de mes commandes</h2>
      <p v-if="chargement">Chargement...</p>
      <p v-else-if="erreur" class="erreur">{{ erreur }}</p>
      <p v-else-if="commandes.length === 0">Vous n'avez pas encore passé de commande. <RouterLink to="/catalogue">Voir le catalogue</RouterLink></p>
      <div v-else class="defile">
        <table>
          <thead><tr><th>N°</th><th>Date</th><th>Total</th><th>Statut</th><th>Actions</th></tr></thead>
          <tbody>
            <tr v-for="c in commandes" :key="c.id_commande">
              <td class="num">#{{ c.id_commande }}</td>
              <td>{{ formaterDate(c.date_commande) }}</td>
              <td>{{ formaterPrix(c.montant_total) }}</td>
              <td><span class="badge" :style="styleStatut(c.statut)">{{ c.statut_affiche }}</span></td>
              <td><RouterLink class="voir" :to="'/mon-compte/commandes/' + c.id_commande">Voir le détail</RouterLink></td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="aide">Pour un retrait, « expédiée » s'affiche « Prête à retirer » et « livrée » s'affiche « Retirée ».</p>
    </div>
  </section>
</template>

<style scoped>
.page { max-width: var(--largeur-max); margin: 0 auto; padding: 24px 16px; }
.carte { background: var(--blanc); border: 1px solid var(--bordure); border-radius: 16px; padding: 20px; }
.defile { overflow-x: auto; }
table { width: 100%; min-width: 640px; border-collapse: collapse; text-align: left; }
th { padding: 10px 12px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: var(--texte-doux); border-bottom: 2px solid var(--marine); }
td { padding: 10px 12px; border-bottom: 1px solid var(--bordure); }
.num { font-weight: 600; color: var(--marine); }
.badge { display: inline-block; padding: 2px 12px; border-radius: 999px; font-size: 13px; font-weight: 600; }
.voir { min-height: 44px; padding: 0 14px; display: inline-flex; align-items: center; border: 1.5px solid var(--marine); border-radius: 8px; color: var(--marine); font-size: 14px; font-weight: 500; text-decoration: none; }
.aide { font-size: 13px; color: var(--texte-doux); }
.erreur { background: var(--erreur-fond); color: var(--erreur-texte); padding: 12px; border-radius: 8px; }
</style>

