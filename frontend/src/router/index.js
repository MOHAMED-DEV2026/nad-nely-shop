import { createRouter, createWebHistory } from 'vue-router'
import AccueilView from '../views/public/AccueilView.vue'

const routes = [
  { path: '/', name: 'accueil', component: AccueilView },
]

export default createRouter({ history: createWebHistory(), routes })
