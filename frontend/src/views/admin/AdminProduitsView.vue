<script setup>
import { ref, computed, onMounted } from "vue";
import { appelerApi, urlImage } from "../../services/api.js";
import { formaterPrix } from "../../utils/format.js";

const produits = ref([]);
const recherche = ref("");
const categorie = ref("");
const etat = ref("tous");
const aRetirer = ref(null);
const message = ref("");
const erreur = ref("");

async function charger() {
  try {
    produits.value = await appelerApi("/admin/produits");
  } catch (e) {
    erreur.value = "Impossible de charger les produits.";
  }
}

onMounted(() => {
  try {
    const m = sessionStorage.getItem("messageAdmin");
    if (m) { message.value = m; sessionStorage.removeItem("messageAdmin"); }
  } catch (e) { /* stockage indisponible : pas de message */ }
  charger();
});

const categories = computed(() => [...new Set(produits.value.map((p) => p.categorie))].sort());

const affiches = computed(() => {
  const mot = recherche.value.trim().toLowerCase();
  return produits.value.filter((p) =>
    p.nom.toLowerCase().includes(mot) &&
    (!categorie.value || p.categorie === categorie.value) &&
    (etat.value === "tous" || (etat.value === "actifs") === Boolean(p.actif))
  );
});

async function confirmerRetrait() {
  const p = aRetirer.value;
  aRetirer.value = null;
  message.value = "";
  erreur.value = "";
  try {
    const rep = await appelerApi("/admin/produits/" + p.id_produit, { method: "DELETE" });
    message.value = rep.message;
    await charger();
  } catch (e) {
    erreur.value = (e.donnees && e.donnees.message) || "Impossible de retirer ce produit.";
  }
}
</script>

<template>
  <div class="page">
    <div class="entete">
      <h1>Produits</h1>
      <RouterLink class="bouton" to="/admin/produits/nouveau">+ Ajouter un produit</RouterLink>
    </div>

    <div class="filtres">
      <input type="search" v-model="recherche" placeholder="Rechercher par nom…" aria-label="Rechercher un produit" />
      <select v-model="categorie" aria-label="Catégorie"><option value="">Toutes les catégories</option><option v-for="c in categories" :key="c" :value="c">{{ c }}</option></select>
      <select v-model="etat" aria-label="État"><option value="tous">Actifs et inactifs</option><option value="actifs">Actifs</option><option value="inactifs">Inactifs</option></select>
    </div>

    <p v-if="message" class="succes">{{ message }}</p>
    <p v-if="erreur" class="erreur">{{ erreur }}</p>

    <section v-if="aRetirer" class="confirmation">
      <h2>Confirmation avant de retirer un produit</h2>
      <p>Voulez-vous vraiment retirer « {{ aRetirer.nom }} » ?</p>
      <ul>
        <li>Jamais commandé : supprimé définitivement, avec son image.</li>
        <li>Déjà commandé : désactivé, il disparaît du catalogue mais reste visible dans l'historique des commandes.</li>
      </ul>
      <div class="boutons">
        <button type="button" class="danger" @click="confirmerRetrait">Oui, retirer</button>
        <button type="button" class="neutre" @click="aRetirer = null">Annuler</button>
      </div>
    </section>

    <section class="carte">
      <p v-if="affiches.length === 0">Aucun produit ne correspond.</p>
      <div v-else class="defile">
        <table>
          <thead><tr><th>Produit</th><th>Catégorie</th><th>Prix</th><th>Stock</th><th>État</th><th>Actions</th></tr></thead>
          <tbody>
            <tr v-for="p in affiches" :key="p.id_produit">
              <td><div class="produit"><img v-if="p.image" :src="urlImage(p.image)" alt="" /><div v-else class="vide"></div><strong>{{ p.nom }}</strong></div></td>
              <td>{{ p.categorie }}</td>
              <td>{{ formaterPrix(p.prix) }}</td>
              <td :class="{ rupture: p.stock === 0 }">{{ p.stock === 0 ? "0 (rupture)" : p.stock }}</td>
              <td><span class="badge" :class="p.actif ? 'actif' : 'inactif'">{{ p.actif ? "Actif" : "Inactif" }}</span></td>
              <td><div class="boutons"><RouterLink class="petit" :to="'/admin/produits/' + p.id_produit">Modifier</RouterLink><button type="button" class="petit rouge" @click="aRetirer = p">Retirer</button></div></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; gap: 20px; }
.entete { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; }
h1 { margin: 0; font-size: 30px; }
.filtres { display: flex; flex-wrap: wrap; gap: 12px; }
.filtres input { flex: 1 1 240px; }
.filtres input, .filtres select { min-height: 44px; border: 1px solid var(--marine); border-radius: 8px; padding: 0 14px; font-size: 15px; background: var(--blanc); }
.succes { background: var(--succes-fond); color: var(--succes-texte); padding: 12px; border-radius: 8px; margin: 0; }
.erreur { background: var(--erreur-fond); color: var(--erreur-texte); padding: 12px; border-radius: 8px; margin: 0; }
.confirmation { background: var(--blanc); border: 1px solid var(--bordure); border-radius: 12px; padding: 20px; max-width: 640px; }
.confirmation h2 { margin: 0 0 8px; font-size: 22px; }
.confirmation ul { font-size: 13px; color: var(--texte-doux); padding-left: 20px; }
.boutons { display: flex; flex-wrap: wrap; gap: 8px; }
.danger { min-height: 44px; padding: 0 20px; border: 0; border-radius: 8px; background: var(--rouge); color: var(--sur-rouge); font-weight: 500; cursor: pointer; font-family: inherit; font-size: 15px; }
.neutre { min-height: 44px; padding: 0 20px; border: 1.5px solid var(--marine); border-radius: 8px; background: var(--blanc); color: var(--marine); font-weight: 500; cursor: pointer; font-family: inherit; font-size: 15px; }
.carte { background: var(--blanc); border: 1px solid var(--bordure); border-radius: 12px; padding: 8px 20px; }
.defile { overflow-x: auto; }
table { width: 100%; min-width: 760px; border-collapse: collapse; text-align: left; }
th { padding: 12px 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: var(--texte-doux); border-bottom: 2px solid var(--marine); }
td { padding: 10px 8px; border-bottom: 1px solid var(--bordure); }
.produit { display: flex; align-items: center; gap: 12px; }
.produit img, .vide { width: 48px; height: 48px; border-radius: 8px; object-fit: cover; flex: 0 0 48px; }
.vide { background: var(--rose); }
.rupture { color: var(--erreur-texte); font-weight: 600; }
.badge { display: inline-block; padding: 2px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; }
.actif { background: var(--succes-fond); color: var(--succes-texte); }
.inactif { background: var(--fond-desactive); color: var(--texte-doux); }
.petit { min-height: 44px; padding: 0 14px; display: inline-flex; align-items: center; border: 1.5px solid var(--marine); border-radius: 8px; background: var(--blanc); color: var(--marine); font-size: 14px; font-weight: 500; text-decoration: none; cursor: pointer; font-family: inherit; }
.rouge { border-color: var(--rouge); color: var(--rouge); }
</style>
