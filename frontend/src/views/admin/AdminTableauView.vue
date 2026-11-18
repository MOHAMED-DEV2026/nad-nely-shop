<script setup>
import { ref, computed, onMounted } from "vue";
import { appelerApi } from "../../services/api.js";
import { formaterPrix } from "../../utils/format.js";
import { styleStatut } from "../../utils/statuts.js";

const stats = ref(null);
const commandes = ref([]);
const produits = ref([]);
const erreur = ref("");

onMounted(async () => {
  try {
    const [s, c, p] = await Promise.all([appelerApi("/admin/tableau-de-bord"), appelerApi("/admin/commandes"), appelerApi("/admin/produits")]);
    stats.value = s;
    commandes.value = c.commandes.slice(0, 6);
    produits.value = p;
  } catch (e) {
    erreur.value = "Impossible de charger le tableau de bord.";
  }
});

const kpis = computed(() => {
  const s = stats.value;
  if (!s) return [];
  return [
    { label: "Commandes à traiter", valeur: s.a_traiter, lien: "Voir les commandes confirmées", to: "/admin/commandes?statut=confirmee", accent: "#C62828" },
    { label: "Commandes du mois", valeur: s.commandes_mois, lien: "Voir la liste", to: "/admin/commandes", accent: "var(--marine)" },
    { label: "Chiffre d'affaires du mois", valeur: formaterPrix(s.ca_mois), lien: "Voir les commandes", to: "/admin/commandes", accent: "#C9A44C" },
    { label: "Produits en rupture", valeur: s.ruptures, lien: "Voir les produits", to: "/admin/produits", accent: "#ED6C02" },
    { label: "Expirent sous 30 jours", valeur: s.bientot_expires, lien: "Voir les produits", to: "/admin/produits", accent: "#ED6C02" },
    { label: "Clients inscrits", valeur: s.clients, lien: "Voir les utilisateurs", to: "/admin/utilisateurs", accent: "#2E7D32" },
  ];
});

function etatProduit(p) {
  if (p.stock === 0) return { texte: "Rupture de stock", fond: "#F8D9D9", couleur: "#8E1B1B" };
  if (p.date_expiration) {
    const jours = Math.ceil((new Date(p.date_expiration) - new Date()) / 86400000);
    if (jours >= 0 && jours <= 30) return { texte: "Expire dans " + jours + " jours", fond: "#FFE9CC", couleur: "#7A3E00" };
  }
  if (p.stock <= 5) return { texte: "Stock faible : " + p.stock, fond: "#FFE9CC", couleur: "#7A3E00" };
  return null;
}

const alertes = computed(() => produits.value.filter((p) => p.actif).map((p) => ({ id: p.id_produit, nom: p.nom, etat: etatProduit(p) })).filter((a) => a.etat).slice(0, 5));

function reception(c) {
  return c.mode_reception === "retrait" ? "Retrait" : "Livraison · " + c.commune_livraison;
}

const RACCOURCIS = [
  { texte: "Ajouter un produit", to: "/admin/produits/nouveau" },
  { texte: "Ajouter une catégorie", to: "/admin/categories" },
  { texte: "Commandes à traiter", to: "/admin/commandes?statut=confirmee" },
  { texte: "Gérer les utilisateurs", to: "/admin/utilisateurs" },
];
</script>

<template>
  <div class="tableau">
    <div class="entete">
      <h1>Tableau de bord</h1>
      <div class="boutons">
        <RouterLink class="bouton" to="/admin/produits/nouveau">+ Ajouter un produit</RouterLink>
        <RouterLink class="bouton bouton-contour" to="/admin/categories">+ Ajouter une catégorie</RouterLink>
      </div>
    </div>
    <p v-if="erreur" class="erreur">{{ erreur }}</p>

    <section class="kpis">
      <RouterLink v-for="k in kpis" :key="k.label" :to="k.to" class="kpi" :style="{ borderTopColor: k.accent }">
        <span class="kpi-label">{{ k.label }}</span>
        <span class="kpi-valeur">{{ k.valeur }}</span>
        <span class="kpi-lien">{{ k.lien }}</span>
      </RouterLink>
    </section>

    <section class="carte">
      <div class="titre-carte"><h2>Dernières commandes</h2><RouterLink class="lien" to="/admin/commandes">Toutes les commandes</RouterLink></div>
      <p v-if="commandes.length === 0">Aucune commande pour le moment.</p>
      <div v-else class="defile">
        <table>
          <thead><tr><th>N°</th><th>Client</th><th>Réception</th><th>Total</th><th>Statut</th><th>Actions</th></tr></thead>
          <tbody>
            <tr v-for="o in commandes" :key="o.id_commande">
              <td class="num">#{{ o.id_commande }}</td>
              <td>{{ o.prenom }} {{ o.nom }}</td>
              <td>{{ reception(o) }}</td>
              <td>{{ formaterPrix(o.montant_total) }}</td>
              <td><span class="badge" :style="styleStatut(o.statut)">{{ o.statut_affiche }}</span></td>
              <td><RouterLink class="petit" :to="'/admin/commandes/' + o.id_commande">Détail</RouterLink></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div class="deux">
      <section class="carte">
        <h2>Produits à surveiller</h2>
        <p class="aide">Ruptures de stock, dates d'expiration proches et stock faible.</p>
        <p v-if="alertes.length === 0">Aucun produit à surveiller.</p>
        <div v-for="a in alertes" :key="a.id" class="alerte">
          <div><strong>{{ a.nom }}</strong><br /><span class="badge" :style="{ background: a.etat.fond, color: a.etat.couleur }">{{ a.etat.texte }}</span></div>
          <RouterLink class="petit" :to="'/admin/produits/' + a.id">Modifier</RouterLink>
        </div>
      </section>
      <section class="carte">
        <h2>Accès rapides</h2>
        <div class="raccourcis"><RouterLink v-for="r in RACCOURCIS" :key="r.texte" :to="r.to">{{ r.texte }}</RouterLink></div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.tableau { display: flex; flex-direction: column; gap: 24px; }
.entete { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; }
h1 { margin: 0; font-size: 30px; }
.boutons { display: flex; flex-wrap: wrap; gap: 12px; }
.erreur { background: var(--erreur-fond); color: var(--erreur-texte); padding: 12px; border-radius: 8px; }
.kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 16px; }
.kpi { background: var(--blanc); border: 1px solid var(--bordure); border-top: 4px solid; border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 4px; min-height: 120px; text-decoration: none; color: inherit; }
.kpi-label { font-size: 13px; color: var(--texte-doux); font-weight: 500; }
.kpi-valeur { font-family: "Playfair Display", serif; font-size: 34px; font-weight: 700; color: var(--marine); line-height: 1.2; }
.kpi-lien { margin-top: auto; font-size: 13px; color: var(--marine); font-weight: 600; text-decoration: underline; }
.carte { background: var(--blanc); border: 1px solid var(--bordure); border-radius: 12px; padding: 20px; }
.carte h2 { margin: 0 0 8px; font-size: 22px; }
.titre-carte { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px; }
.titre-carte h2 { margin: 0; }
.lien { color: var(--marine); font-weight: 600; text-decoration: underline; }
.defile { overflow-x: auto; }
table { width: 100%; min-width: 700px; border-collapse: collapse; text-align: left; }
th { background: var(--marine); color: var(--blanc); font-size: 13px; padding: 12px 16px; font-weight: 600; }
td { padding: 12px 16px; border-bottom: 1px solid var(--bordure); }
.num { font-weight: 600; color: var(--marine); }
.badge { display: inline-block; padding: 2px 12px; border-radius: 999px; font-size: 13px; font-weight: 600; }
.petit { min-height: 44px; padding: 0 14px; display: inline-flex; align-items: center; border: 1.5px solid var(--marine); border-radius: 8px; color: var(--marine); font-size: 14px; font-weight: 500; text-decoration: none; }
.deux { display: grid; gap: 24px; }
.aide { font-size: 13px; color: var(--texte-doux); margin: 0 0 12px; }
.alerte { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 0; border-top: 1px solid var(--bordure); }
.raccourcis { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.raccourcis a { min-height: 64px; padding: 12px; border-radius: 12px; background: var(--rose); color: var(--marine); display: flex; align-items: center; justify-content: center; text-align: center; font-weight: 500; font-size: 14px; text-decoration: none; }
@media (min-width: 1024px) { .deux { grid-template-columns: 3fr 2fr; } }
</style>

