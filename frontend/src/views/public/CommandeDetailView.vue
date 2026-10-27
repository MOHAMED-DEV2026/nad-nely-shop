<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { appelerApi } from "../../services/api.js";
import { formaterPrix } from "../../utils/format.js";
import { styleStatut } from "../../utils/statuts.js";

const route = useRoute();
const commande = ref(null);
const erreur = ref("");
const erreurPaiement = ref("");
const envoi = ref(false);

const LIBELLES_PAIEMENT = { en_attente: "En attente", valide: "Payé", echoue: "Échoué" };

onMounted(async () => {
  try {
    commande.value = await appelerApi("/commandes/" + route.params.id);
  } catch (e) {
    erreur.value = "Commande introuvable.";
  }
});

async function payer() {
  envoi.value = true;
  erreurPaiement.value = "";
  try {
    const rep = await appelerApi("/commandes/" + route.params.id + "/paiement", { method: "POST" });
    if (rep.url_paiement) window.location.href = rep.url_paiement;
    else erreurPaiement.value = "Le paiement est indisponible pour le moment.";
  } catch (e) {
    erreurPaiement.value = (e.donnees && e.donnees.message) || "Impossible de lancer le paiement.";
  } finally {
    envoi.value = false;
  }
}
</script>

<template>
  <section class="page">
    <p v-if="erreur" class="erreur">{{ erreur }}</p>
    <div v-else-if="commande" class="carte">
      <div class="entete">
        <div>
          <p class="ariane"><RouterLink to="/mon-compte/commandes">Mes commandes</RouterLink> › Commande n° {{ commande.id_commande }}</p>
          <h1>Détail de la commande n° {{ commande.id_commande }}</h1>
        </div>
        <span class="badge" :style="styleStatut(commande.statut)">{{ commande.statut_affiche }}</span>
      </div>
      <div class="defile">
        <table>
          <thead><tr><th>Produit</th><th>Prix unitaire</th><th>Quantité</th><th>Sous-total</th></tr></thead>
          <tbody>
            <tr v-for="l in commande.lignes" :key="l.id_produit"><td>{{ l.nom }}</td><td>{{ formaterPrix(l.prix_unitaire) }}</td><td>{{ l.quantite }}</td><td class="fort">{{ formaterPrix(l.sous_total) }}</td></tr>
          </tbody>
          <tfoot><tr><td colspan="3" class="droite fort">Total</td><td class="total">{{ formaterPrix(commande.montant_total) }}</td></tr></tfoot>
        </table>
      </div>
      <p class="aide">Les prix affichés sont ceux du moment de l'achat.</p>
      <dl class="infos">
        <div><dt>Mode de réception</dt><dd>{{ commande.mode_reception === "retrait" ? "Retrait sur place" : "Livraison" }}</dd></div>
        <div v-if="commande.mode_reception === 'livraison'"><dt>Adresse et commune</dt><dd>{{ commande.adresse_livraison }}, {{ commande.commune_livraison }}</dd></div>
        <div><dt>Téléphone de contact</dt><dd>{{ commande.telephone_contact }}</dd></div>
        <div><dt>État du paiement</dt><dd>{{ commande.paiement ? LIBELLES_PAIEMENT[commande.paiement.statut] : "-" }}</dd></div>
      </dl>
      <p v-if="erreurPaiement" class="erreur">{{ erreurPaiement }}</p>
      <div class="actions">
        <button v-if="commande.statut === 'en_attente'" class="bouton" :disabled="envoi" @click="payer">Payer maintenant</button>
        <RouterLink class="bouton bouton-contour" to="/mon-compte/commandes">‹ Retour à mes commandes</RouterLink>
      </div>
    </div>
  </section>
</template>

<style scoped>
.page { max-width: var(--largeur-max); margin: 0 auto; padding: 24px 16px; }
.carte { background: var(--blanc); border: 1px solid var(--bordure); border-radius: 16px; padding: 20px; display: flex; flex-direction: column; gap: 16px; }
.entete { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px; }
.ariane { font-size: 13px; color: var(--texte-doux); margin: 0; }
.ariane a { text-decoration: underline; }
h1 { font-size: 24px; margin: 4px 0 0; }
.badge { padding: 4px 16px; border-radius: 999px; font-weight: 600; font-size: 14px; }
.defile { overflow-x: auto; }
table { width: 100%; min-width: 520px; border-collapse: collapse; text-align: left; }
th { padding: 10px 12px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: var(--texte-doux); border-bottom: 2px solid var(--marine); }
td { padding: 12px; border-bottom: 1px solid var(--bordure); }
.fort { font-weight: 600; }
.droite { text-align: right; }
.total { font-weight: 700; font-size: 18px; color: var(--marine); }
.aide { font-size: 13px; color: var(--texte-doux); margin: 0; }
.infos { margin: 0; display: grid; gap: 12px; font-size: 14px; }
.infos div { background: var(--creme); border-radius: 12px; padding: 14px; }
.infos dt { color: var(--texte-doux); }
.infos dd { margin: 0; font-weight: 600; }
.actions { display: flex; flex-wrap: wrap; gap: 12px; }
.erreur { background: var(--erreur-fond); color: var(--erreur-texte); padding: 12px; border-radius: 8px; margin: 0; }
@media (min-width: 768px) { .infos { grid-template-columns: repeat(2, 1fr); } }
</style>
