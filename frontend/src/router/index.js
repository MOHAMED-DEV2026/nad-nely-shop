import { createRouter, createWebHistory } from "vue-router";
import { estConnecte, estAdmin } from "../stores/auth.js";
import AccueilView from "../views/public/AccueilView.vue";
import CatalogueView from "../views/public/CatalogueView.vue";
import ProduitView from "../views/public/ProduitView.vue";
import PanierView from "../views/public/PanierView.vue";
import ConnexionView from "../views/public/ConnexionView.vue";
import InscriptionView from "../views/public/InscriptionView.vue";
import CommandeView from "../views/public/CommandeView.vue";
import AdminLayout from "../views/admin/AdminLayout.vue";
import AdminTableauView from "../views/admin/AdminTableauView.vue";
import AdminProduitsView from "../views/admin/AdminProduitsView.vue"
import AdminProduitForm from "../views/admin/AdminProduitForm.vue"
import AdminCategoriesView from "../views/admin/AdminCategoriesView.vue"
import AdminCommandesView from "../views/admin/AdminCommandesView.vue";
import IntrouvableView from "../views/public/IntrouvableView.vue";
import MentionsLegalesView from "../views/public/MentionsLegalesView.vue";
import ConfidentialiteView from "../views/public/ConfidentialiteView.vue";
import MotDePasseOublieView from "../views/public/MotDePasseOublieView.vue";
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
  { path: "/mot-de-passe-oublie", component: MotDePasseOublieView },
  { path: "/mentions-legales", component: MentionsLegalesView },
  { path: "/confidentialite", component: ConfidentialiteView },
  { path: "/:pathMatch(.*)*", component: IntrouvableView },
  { path: "/admin", component: AdminLayout, meta: { exigeAdmin: true }, children: [{ path: "", component: AdminTableauView }, { path: "produits", component: AdminProduitsView },
      { path: "produits/nouveau", component: AdminProduitForm },
      { path: "produits/:id", component: AdminProduitForm },
      { path: "categories", component: AdminCategoriesView },
      { path: "commandes", component: AdminCommandesView }] },
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
  if (to.meta.exigeAdmin) {
    if (!estConnecte.value) return { path: "/connexion", query: { redirection: to.fullPath } };
    if (!estAdmin.value) return "/";
  }
  if (to.meta.exigeConnexion && !estConnecte.value) {
    return { path: "/connexion", query: { redirection: to.fullPath } };
  }
});

export default router;








