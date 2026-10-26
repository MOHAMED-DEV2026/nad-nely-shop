import { createRouter, createWebHistory } from "vue-router"
import AccueilView from "../views/public/AccueilView.vue"
import CatalogueView from "../views/public/CatalogueView.vue"

const routes = [
  { path: "/", name: "accueil", component: AccueilView },
  { path: "/catalogue", name: "catalogue", component: CatalogueView },
]

export default createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})
