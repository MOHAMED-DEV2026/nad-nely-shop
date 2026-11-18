<script setup>
import { ref, onMounted } from "vue"
import { useRoute } from "vue-router"
import { appelerApi } from "../../services/api.js"
import { formaterPrix } from "../../utils/format.js"
import { styleStatut } from "../../utils/statuts.js"

const route = useRoute()
const id = route.params.id
const commande = ref(null)
const alerte = ref("")
const message = ref("")
const confirmation = ref(false)
const chargement = ref(true)

async function charger() {
  try {
    commande.value = await appelerApi("/admin/commandes/" + id)
  } catch (e) {
    alerte.value = e.message
  }
  chargement.value = false
}

onMounted(charger)

function dateComplete(d) {
  return new Date(d).toLocaleString("fr-FR")
}

function libelleSuivant() {
  const retrait = commande.value.mode_reception === "retrait"
  if (commande.value.etape_suivante === "expediee") return retrait ? "Marquer prête à retirer" : "Expédier"
  if (commande.value.etape_suivante === "livree") return retrait ? "Marquer retirée" : "Marquer livrée"
  return ""
}

function libellePaiement(p) {
  if (!p) return "Aucun paiement"
  if (p.statut === "valide") return "Validé (Stripe)"
  if (p.statut === "echoue") return "Échoué"
  return "En attente"
}

async function agir(action) {
  alerte.value = ""
  message.value = ""
  try {
    const r = await appelerApi("/admin/commandes/" + id + "/statut", { method: "PATCH", corps: { action } })
    message.value = r.message
    await charger()
  } catch (e) {
    alerte.value = e.message
  }
}

function avancer() {
  agir("avancer")
}

function annuler() {
  confirmation.value = false
  agir("annuler")
}
</script>

<template>
  <div>
    <p v-if="chargement">Chargement...</p>
    <p v-if="alerte" class="alerte">{{ alerte }}</p>
    <p v-if="message" class="succes">{{ message }}</p>
    <div v-if="commande">
      <div class="entete">
        <div>
          <nav class="ariane"><RouterLink to="/admin/commandes">Commandes</RouterLink> › Commande n° {{ commande.id_commande }}</nav>
          <h1>Commande n° {{ commande.id_commande }}</h1>
        </div>
        <span class="badge" :style="styleStatut(commande.statut)">{{ commande.statut_affiche }}</span>
      </div>
      <div class="deux">
        <section class="carte">
          <h2>Produits commandés</h2>
          <div class="defile">
            <table>
              <thead><tr><th>Produit</th><th>Prix unitaire</th><th>Quantité</th><th>Sous-total</th></tr></thead>
              <tbody>
                <tr v-for="l in commande.lignes" :key="l.id_produit">
                  <td>{{ l.produit }}</td><td>{{ formaterPrix(l.prix_unitaire) }}</td><td>{{ l.quantite }}</td><td class="gras">{{ formaterPrix(l.sous_total) }}</td>
                </tr>
              </tbody>
              <tfoot><tr><td colspan="3" class="droite gras">Total</td><td class="total">{{ formaterPrix(commande.montant_total) }}</td></tr></tfoot>
            </table>
          </div>
          <p class="aide">Les prix affichés sont ceux du jour de la commande.</p>
        </section>
        <aside class="colonne">
          <section class="carte">
            <h2>Client</h2>
            <dl>
              <dt>Nom</dt><dd>{{ commande.prenom }} {{ commande.nom }}</dd>
              <dt>E-mail</dt><dd>{{ commande.email }}</dd>
              <dt>Téléphone</dt><dd>{{ commande.telephone_contact || commande.telephone }}</dd>
            </dl>
          </section>
          <section class="carte">
            <h2>Réception et paiement</h2>
            <dl>
              <dt>Mode</dt><dd>{{ commande.mode_reception === "retrait" ? "Retrait" : "Livraison" }}</dd>
              <dt>Adresse</dt><dd>{{ commande.mode_reception === "retrait" ? "Retrait en boutique" : commande.adresse_livraison + ", " + commande.commune_livraison }}</dd>
              <dt>Date</dt><dd>{{ dateComplete(commande.date_commande) }}</dd>
              <dt>Paiement</dt><dd>{{ libellePaiement(commande.paiement) }}</dd>
            </dl>
          </section>
        </aside>
      </div>
      <section class="carte action">
        <h2>Faire évoluer la commande</h2>
        <p class="aide">Seul le bouton de la prochaine étape est proposé. Livrée et annulée sont des statuts définitifs.</p>
        <div class="ligne">
          <span class="badge" :style="styleStatut(commande.statut)">{{ commande.statut_affiche }}</span>
          <template v-if="commande.etape_suivante">
            <span aria-hidden="true">→</span>
            <button type="button" class="bouton" @click="avancer">{{ libelleSuivant() }}</button>
          </template>
          <span v-else class="aide">Aucune étape suivante</span>
          <span class="espace"></span>
          <button v-if="commande.annulable" type="button" class="annuler" @click="confirmation = true">Annuler la commande</button>
        </div>
      </section>
      <section v-if="confirmation" class="carte confirmation">
        <h2>Confirmation avant annulation</h2>
        <p>Annuler la commande n° {{ commande.id_commande }} ?</p>
        <p class="aide">Si la commande était payée, les quantités sont remises en stock. Le remboursement se fait manuellement depuis Stripe.</p>
        <div class="ligne">
          <button type="button" class="oui" @click="annuler">Oui, annuler la commande</button>
          <button type="button" class="bouton bouton-contour" @click="confirmation = false">Non, revenir</button>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
h1 { font-family: "Playfair Display", serif; color: var(--marine); margin: 0.25rem 0 0; }
h2 { font-family: "Playfair Display", serif; color: var(--marine); margin: 0 0 0.75rem; font-size: 1.25rem; }
.entete { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem; }
.ariane { font-size: 0.85rem; color: var(--texte-doux); }
.ariane a { color: inherit; text-decoration: underline; }
.deux { display: grid; grid-template-columns: 1fr; gap: 1.25rem; align-items: start; margin-bottom: 1.25rem; }
.colonne { display: flex; flex-direction: column; gap: 1rem; }
.carte { background: var(--blanc); border: 1px solid var(--bordure); border-radius: 12px; padding: 1.25rem; }
.action, .confirmation { margin-bottom: 1.25rem; }
.confirmation { max-width: 640px; }
.defile { overflow-x: auto; }
table { width: 100%; min-width: 480px; border-collapse: collapse; text-align: left; }
th { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; color: var(--texte-doux); padding: 0.6rem 0.5rem; border-bottom: 2px solid var(--marine); }
td { padding: 0.7rem 0.5rem; border-bottom: 1px solid var(--bordure); }
.gras { font-weight: 600; }
.droite { text-align: right; }
.total { font-weight: 700; font-size: 1.1rem; color: var(--marine); }
dl { margin: 0; display: grid; grid-template-columns: auto 1fr; gap: 0.25rem 1rem; font-size: 0.9rem; }
dt { color: var(--texte-doux); }
dd { margin: 0; font-weight: 500; }
.aide { margin: 0.5rem 0; font-size: 0.85rem; color: var(--texte-doux); }
.badge { display: inline-block; padding: 4px 16px; border-radius: 999px; font-size: 0.8rem; font-weight: 600; white-space: nowrap; }
.ligne { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; }
.espace { flex: 1; }
.annuler { min-height: 48px; padding: 0 24px; border: 1.5px solid var(--rouge); border-radius: 8px; background: var(--blanc); color: var(--rouge); font-weight: 500; cursor: pointer; }
.oui { min-height: 44px; padding: 0 20px; border: 0; border-radius: 8px; background: var(--rouge); color: var(--sur-rouge); font-weight: 500; cursor: pointer; }
.alerte { background: var(--erreur-fond); color: var(--erreur-texte); padding: 0.75rem 1rem; border-radius: 10px; }
.succes { background: var(--succes-fond); color: var(--succes-texte); padding: 0.75rem 1rem; border-radius: 10px; }
@media (min-width: 1024px) {
  .deux { grid-template-columns: 2fr 1fr; }
}
</style>
