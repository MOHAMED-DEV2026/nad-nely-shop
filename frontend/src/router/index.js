import { createRouter, createWebHistory } from "vue-router";
import { estConnecte } from "../stores/auth.js";
import AccueilView from "../views/public/AccueilView.vue";
import CatalogueView from "../views/public/CatalogueView.vue";
import ProduitView from "../views/public/ProduitView.vue";
import PanierView from "../views/public/PanierView.vue";
import ConnexionView from "../views/public/ConnexionView.vue";
import InscriptionView from "../views/public/InscriptionView.vue";
import CommandeView from "../views/public/CommandeView.vue";
import MonCompteView from "../views/public/MonCompteView.vue";
import MesCommandesView from "../views/public/MesCommandesView.vue";
import CommandeDetailView from "../views/public/CommandeDetailView.vue";
import PaiementSuccesView from "../views/public/PaiementSuccesView.vue";
import PaiementAnnuleView from "../views/public/PaiementAnnuleView.vue";

const routes = [
  { path: "/", component: AccueilView },
  { path: "/catalogue", component: CatalogueView },
  { path: "/produit/:id", component: ProduitView },
  { path: "/panier", component: PanierView },
  { path: "/connexion", component: ConnexionView },
  { path: "/inscription", component: InscriptionView },
  { path: "/commande", component: CommandeView, meta: { exigeConnexion: true } },
  { path: "/mon-compte", component: MonCompteView, meta: { exigeConnexion: true } },
  { path: "/mon-compte/commandes", component: MesCommandesView, meta: { exigeConnexion: true } },
  { path: "/mon-compte/commandes/:id", component: CommandeDetailView, meta: { exigeConnexion: true } },
  { path: "/paiement/succes", component: PaiementSuccesView, meta: { exigeConnexion: true } },
  { path: "/paiement/annule", component: PaiementAnnuleView, meta: { exigeConnexion: true } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
});

router.beforeEach((to) => {
  if (to.meta.exigeConnexion && !estConnecte.value) {
    return { path: "/connexion", query: { redirection: to.fullPath } };
  }
});

export default router;




