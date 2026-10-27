import { createRouter, createWebHistory } from "vue-router"
import AccueilView from "../views/public/AccueilView.vue"
import CatalogueView from "../views/public/CatalogueView.vue"
import ProduitView from "../views/public/ProduitView.vue"
import PanierView from "../views/public/PanierView.vue"
import ConnexionView from "../views/public/ConnexionView.vue"

const routes = [
  { path: "/", name: "accueil", component: AccueilView },
  { path: "/catalogue", name: "catalogue", component: CatalogueView },
  { path: "/produit/:id", name: "produit", component: ProduitView },
  { path: "/panier", name: "panier", component: PanierView },
  { path: "/connexion", name: "connexion", component: ConnexionView },
]

export default createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})
