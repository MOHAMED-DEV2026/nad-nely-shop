<script setup>
import { ref } from "vue"
import { panier, totalPanier } from "../../stores/panier"
import { urlImage } from "../../services/api"
import { formaterPrix } from "../../utils/format"
import SelecteurQuantite from "../../components/SelecteurQuantite.vue"

const confirmerVidage = ref(false)

function vider() {
  panier.vider()
  confirmerVidage.value = false
}
</script>

<template>
  <main class="page">
    <nav class="fil" aria-label="Fil d'Ariane"><RouterLink to="/">Accueil</RouterLink> › Panier</nav>
    <h1>Mon panier</h1>

    <div v-if="panier.etat.lignes.length === 0" class="vide">
      <p>Votre panier est vide.</p>
      <RouterLink to="/catalogue" class="bouton">Découvrir le catalogue</RouterLink>
    </div>

    <div v-else class="disposition">
      <section class="lignes">
        <div class="tableau-defilant">
          <table>
            <thead>
              <tr>
                <th>Produit</th>
                <th>Prix</th>
                <th>Quantité</th>
                <th>Sous-total</th>
                <th><span class="cache">Supprimer</span></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="l in panier.etat.lignes" :key="l.id_produit">
                <td>
                  <div class="produit">
                    <div class="vignette"><img v-if="l.image" :src="urlImage(l.image)" :alt="l.nom" /></div>
                    <div>
                      <RouterLink :to="`/produit/${l.id_produit}`" class="nom">{{ l.nom }}</RouterLink>
                      <div v-if="l.categorie" class="cat">{{ l.categorie }}</div>
                    </div>
                  </div>
                </td>
                <td>{{ formaterPrix(l.prix) }}</td>
                <td><SelecteurQuantite :model-value="l.quantite" :max="l.stock" @update:model-value="panier.changerQuantite(l.id_produit, $event)" /></td>
                <td class="sous">{{ formaterPrix(l.quantite * l.prix) }}</td>
                <td><button type="button" class="supprimer" @click="panier.retirer(l.id_produit)">Supprimer</button></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="pied-liste">
          <RouterLink to="/catalogue" class="continuer">‹ Continuer mes achats</RouterLink>
          <button type="button" class="supprimer" @click="confirmerVidage = true">Vider le panier</button>
        </div>
        <div v-if="confirmerVidage" class="confirmation" role="alertdialog" aria-label="Confirmation">
          <p>Voulez-vous vraiment vider votre panier ?</p>
          <div>
            <button type="button" class="oui" @click="vider">Oui, vider le panier</button>
            <button type="button" class="non" @click="confirmerVidage = false">Annuler</button>
          </div>
        </div>
      </section>

      <aside class="recap">
        <h2>Récapitulatif</h2>
        <div class="ligne-recap"><span>Sous-total</span><span>{{ formaterPrix(totalPanier) }}</span></div>
        <div class="ligne-recap"><span>Livraison</span><span>Gratuite</span></div>
        <div class="ligne-recap total"><span>Total</span><span>{{ formaterPrix(totalPanier) }}</span></div>
        <RouterLink to="/commande" class="commander">Commander</RouterLink>
        <p class="note">Les prix sont indicatifs : le serveur les recalcule au moment de la commande.</p>
      </aside>
    </div>
  </main>
</template>

<style scoped>
.page { max-width: var(--largeur-max); margin: 0 auto; padding: 24px; }
.fil { font-size: 13px; color: var(--texte-doux); }
.fil a { text-decoration: underline; }
.page h1 { margin: 8px 0 24px; font-size: 36px; }
.disposition { display: flex; flex-wrap: wrap; gap: 32px; align-items: flex-start; }
.lignes { flex: 2 1 560px; min-width: 0; background: var(--blanc); border: 1px solid var(--bordure); border-radius: var(--arrondi-moyen); padding: 8px 24px; }
.tableau-defilant { overflow-x: auto; }
table { width: 100%; min-width: 560px; border-collapse: collapse; text-align: left; }
th { padding: 12px 8px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color:var(--texte-doux); border-bottom: 2px solid var(--marine); }
td { padding: 16px 8px; border-bottom: 1px solid var(--bordure); vertical-align: middle; }
.produit { display: flex; align-items: center; gap: 12px; }
.vignette { width: 72px; height: 72px; flex: 0 0 72px; border-radius: 12px; background: var(--rose); overflow: hidden; }
.vignette img { width: 100%; height: 100%; object-fit: cover; display: block; }
.nom { font-weight: 600; }
.nom:hover { text-decoration: underline; }
.cat { font-size: 12px; color: var(--texte-doux); }
.sous { font-weight: 600; color: var(--marine); }
.supprimer { min-height: var(--hauteur-bouton); padding: 0 12px; border: 1.5px solid var(--rouge); border-radius:var(--arrondi-petit); background: var(--blanc); color: var(--rouge); font-size: 14px; font-weight: 500; }
.pied-liste { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px; padding: 16px 8px; }
.continuer { min-height: var(--hauteur-bouton); display: flex; align-items: center; color: var(--marine); font-weight: 600; text-decoration: underline; }
.confirmation { margin: 0 8px 16px; padding: 16px; border: 1px solid var(--bordure); border-radius: var(--arrondi-moyen); background: var(--creme); }
.confirmation p { margin: 0 0 12px; font-size: 14px; }
.confirmation div { display: flex; gap: 12px; flex-wrap: wrap; }
.oui { min-height: var(--hauteur-bouton); padding: 0 20px; border: 0; border-radius: var(--arrondi-petit); background: var(--rouge); color: var(--sur-rouge); font-weight: 500; }
.non { min-height: var(--hauteur-bouton); padding: 0 20px; border: 1.5px solid var(--marine); border-radius: var(--arrondi-petit); background: var(--blanc); color: var(--marine); font-weight: 500; }
.recap { flex: 1 1 300px; min-width: 0; background: var(--blanc); border: 1px solid var(--bordure); border-radius: var(--arrondi-moyen); padding: 24px; display: flex; flex-direction: column; gap: 12px; }
.recap h2 { margin: 0; font-size: 24px; }
.ligne-recap { display: flex; justify-content: space-between; }
.total { border-top: 2px solid var(--marine); padding-top: 12px; font-weight: 700; font-size: 20px; color: var(--marine); }
.commander { min-height: 52px; display: flex; align-items: center; justify-content: center; background: var(--marine); color: var(--blanc); border-radius: var(--arrondi-petit); font-weight: 600; }
.note { margin: 0; font-size: 12px; color: var(--texte-doux); }
.vide { background: var(--blanc); border: 1px dashed var(--marine); border-radius: var(--arrondi-moyen); padding:32px; text-align: center; }
.vide p { margin: 0 0 16px; font-size: 18px; }
.cache { position: absolute; left: -9999px; }

/* Téléphone : chaque produit devient une carte (plus de tableau à faire défiler de côté) */
@media (max-width: 640px) {
  .page { padding: 16px; }
  .lignes { padding: 8px 12px; }
  table { min-width: 0; }
  thead { position: absolute; left: -9999px; }
  table, tbody { display: block; }
  tr { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 12px; padding: 16px 0; border-bottom: 1px solid var(--bordure); }
  td { display: block; padding: 0; border: 0; }
  tr td:nth-child(1) { grid-column: 1 / -1; }
  tr td:nth-child(3), tr td:nth-child(5) { justify-self: end; }
  .sous { font-size: 18px; }
}
</style>
