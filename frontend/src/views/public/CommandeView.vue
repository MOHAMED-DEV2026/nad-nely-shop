<script setup>
import { ref, reactive, onMounted } from "vue";
import { appelerApi } from "../../services/api.js";
import { etat, totalPanier } from "../../stores/panier.js";
import { formaterPrix } from "../../utils/format.js";

const COMMUNES = ["Acoua", "Bandraboua", "Bandrélé", "Bouéni", "Chiconi", "Chirongui", "Dembéni", "Dzaoudzi", "Kani-Kéli", "Koungou", "Mamoudzou", "Mtsamboro", "M'Tsangamouji", "Ouangani", "Pamandzi", "Sada", "Tsingoni"];

const mode = ref("livraison");
const compte = reactive({ prenom: "", nom: "", email: "" });
const adresse = ref("");
const commune = ref("");
const telephone = ref("");
const erreur = ref("");
const envoi = ref(false);
const commandeExistante = ref(false);

onMounted(async () => {
  try {
    const c = await appelerApi("/compte");
    compte.prenom = c.prenom;
    compte.nom = c.nom;
    compte.email = c.email;
    if (c.telephone) telephone.value = c.telephone;
  } catch (e) {
    erreur.value = "Impossible de charger vos informations.";
  }
});

async function valider() {
  erreur.value = "";
  commandeExistante.value = false;
  if (mode.value === "livraison" && (!adresse.value.trim() || !commune.value)) {
    erreur.value = "Indiquez votre adresse et votre commune.";
    return;
  }
  if (!/^[0-9+ .()-]{6,20}$/.test(telephone.value.trim())) {
    erreur.value = "Le téléphone de contact est invalide.";
    return;
  }
  envoi.value = true;
  try {
    const corps = {
      mode_reception: mode.value,
      telephone_contact: telephone.value.trim(),
      lignes: etat.lignes.map((l) => ({ id_produit: l.id_produit, quantite: l.quantite })),
    };
    if (mode.value === "livraison") {
      corps.adresse_livraison = adresse.value.trim();
      corps.commune_livraison = commune.value;
    }
    const rep = await appelerApi("/commandes", { method: "POST", corps });
    if (rep.url_paiement) {
      window.location.href = rep.url_paiement;
    } else {
      erreur.value = "Le paiement est indisponible pour le moment. Votre commande est enregistrée : vous pourrez la payer depuis Mes commandes.";
    }
  } catch (e) {
    const msg = (e.donnees && e.donnees.message) || "";
    if (e.donnees && e.donnees.code === "COMMANDE_EXISTANTE") {
      // La même commande attend déjà son paiement : on le dit au client au lieu d'en créer une deuxième
      erreur.value = msg;
      commandeExistante.value = true;
    } else {
      erreur.value = e.statut === 409 ? msg + ". Modifiez votre panier." : "Impossible de valider la commande.";
    }
  } finally {
    envoi.value = false;
  }
}
</script>

<template>
  <section class="commande">
    <h1>Commande</h1>
    <p v-if="etat.lignes.length === 0">Votre panier est vide. <RouterLink to="/catalogue">Voir le catalogue</RouterLink></p>
    <div v-else class="grille">
      <form class="formulaire" @submit.prevent="valider">
        <h2>Mode de réception</h2>
        <label class="carte-mode"><input type="radio" value="livraison" v-model="mode" /> Livraison à domicile</label>
        <label class="carte-mode"><input type="radio" value="retrait" v-model="mode" /> Retrait sur place</label>
        <template v-if="mode === 'livraison'">
          <label for="adresse">Adresse</label>
          <input id="adresse" type="text" v-model="adresse" maxlength="255" />
          <label for="commune">Commune</label>
          <select id="commune" v-model="commune">
            <option value="">Choisir une commune</option>
            <option v-for="c in COMMUNES" :key="c" :value="c">{{ c }}</option>
          </select>
        </template>
        <h2>Vos coordonnées</h2>
        <p class="info">{{ compte.prenom }} {{ compte.nom }} – {{ compte.email }}</p>
        <label for="tel">Téléphone de contact</label>
        <input id="tel" type="tel" v-model="telephone" />
        <p v-if="erreur" class="erreur">{{ erreur }} <RouterLink v-if="commandeExistante" to="/mon-compte/commandes">Voir mes commandes</RouterLink></p>
        <button class="bouton" type="submit" :disabled="envoi">{{ envoi ? "Un instant..." : "Payer " + formaterPrix(totalPanier) }}</button>
      </form>
      <aside class="recap">
        <h2>Récapitulatif</h2>
        <p v-for="l in etat.lignes" :key="l.id_produit" class="ligne"><span>{{ l.nom }} × {{ l.quantite }}</span><span>{{ formaterPrix(l.prix * l.quantite) }}</span></p>
        <p class="ligne"><span>Livraison</span><span>Gratuite</span></p>
        <p class="ligne total"><span>Total</span><span>{{ formaterPrix(totalPanier) }}</span></p>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.commande { max-width: var(--largeur-max); margin: 0 auto; padding: 24px 16px; }
.grille { display: grid; gap: 24px; }
.formulaire { display: flex; flex-direction: column; gap: 8px; }
.carte-mode { border: 1px solid var(--bordure); border-radius: 8px; padding: 12px; background: var(--blanc); }
input[type="text"], input[type="tel"], select { min-height: 48px; padding: 0 12px; border: 1px solid var(--bordure); border-radius: 8px; font-size: 16px; }
.info { color: var(--texte-doux); }
.erreur { background: var(--erreur-fond); color: var(--erreur-texte); padding: 12px; border-radius: 8px; }
.recap { background: var(--blanc); border: 1px solid var(--bordure); border-radius: 16px; padding: 16px; align-self: start; }
.ligne { display: flex; justify-content: space-between; gap: 12px; margin: 8px 0; }
.total { font-weight: 600; border-top: 1px solid var(--bordure); padding-top: 12px; }
@media (min-width: 768px) { .grille { grid-template-columns: 2fr 1fr; } }
</style>
