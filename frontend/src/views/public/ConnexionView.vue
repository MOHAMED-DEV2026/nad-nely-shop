<script setup>
import { ref } from "vue"
import { useRoute, useRouter } from "vue-router"
import { appelerApi } from "../../services/api"
import { auth } from "../../stores/auth"

const route = useRoute()
const router = useRouter()
const email = ref("")
const motDePasse = ref("")

// Message laisse par le site quand la session a expire (voir services/api.js), affiche une seule fois
function lireMessageSession() {
  try {
    const message = sessionStorage.getItem("messageConnexion") || ""
    sessionStorage.removeItem("messageConnexion")
    return message
  } catch {
    return ""
  }
}

const erreur = ref(lireMessageSession())
const envoi = ref(false)
const lienInscription = { path: "/inscription", query: route.query }

async function seConnecter() {
  erreur.value = ""
  envoi.value = true
  try {
    const reponse = await appelerApi("/auth/connexion", { method: "POST", corps: { email: email.value, mot_de_passe: motDePasse.value } })
    auth.ouvrirSession(reponse)
    // Retour a la page d origine (adresse interne seulement), sinon accueil ou administration
    const retour = route.query.redirection
    const retourValide = typeof retour === "string" && retour.startsWith("/") && !retour.startsWith("//")
    router.push(retourValide ? retour : (reponse.utilisateur.role === "admin" ? "/admin" : "/"))
  } catch (e) {
    if (e.statut === 429) erreur.value = "Trop de tentatives. Réessayez dans quelques minutes."
    else if (e.statut === 400 || e.statut === 401) erreur.value = "E-mail ou mot de passe incorrect."
    else erreur.value = "Connexion impossible pour le moment. Réessayez plus tard."
  } finally {
    envoi.value = false
  }
}
</script>

<template>
  <main class="page">
    <section class="carte">
      <h1>Se connecter</h1>
      <p class="sous-titre">Accédez à votre compte client.</p>
      <p v-if="erreur" class="message-erreur" role="alert">{{ erreur }}</p>
      <form @submit.prevent="seConnecter">
        <div class="champ">
          <label for="email">Adresse e-mail</label>
          <input id="email" v-model="email" type="email" required autocomplete="email" />
        </div>
        <div class="champ">
          <label for="mdp">Mot de passe</label>
          <input id="mdp" v-model="motDePasse" type="password" required autocomplete="current-password" />
        </div>
        <button type="submit" class="valider" :disabled="envoi">Se connecter</button>
        <p class="bas"><RouterLink to="/mot-de-passe-oublie">Mot de passe oublié ?</RouterLink></p>
        <p class="bas">Pas encore de compte ? <RouterLink :to="lienInscription">Créer un compte</RouterLink></p>
      </form>
    </section>
  </main>
</template>

<style scoped>
.page { max-width: var(--largeur-max); margin: 0 auto; padding: 40px 24px; display: flex; justify-content: center; }
.carte { flex: 0 1 480px; min-width: 0; background: var(--blanc); border: 1px solid var(--bordure); border-radius: var(--arrondi-grand); padding: 32px; }
.carte h1 { margin: 0 0 4px; font-size: 34px; }
.sous-titre { margin: 0 0 24px; color: var(--texte-doux); font-size: 14px; }
.message-erreur { background: var(--erreur-fond); color: var(--erreur-texte); border-radius: var(--arrondi-petit); padding: 12px 16px; font-size: 14px; font-weight: 500; margin: 0 0 16px; }
form { display: flex; flex-direction: column; gap: 16px; }
.champ { display: flex; flex-direction: column; gap: 4px; }
.champ label { font-size: 14px; font-weight: 500; }
.champ input { min-height: var(--hauteur-champ); border: 1.5px solid var(--marine); border-radius: var(--arrondi-petit); padding: 0 14px; font-size: 16px; background: var(--creme); }
.oublie { min-height: var(--hauteur-bouton); display: flex; align-items: center; font-size: 14px; color: var(--marine);font-weight: 500; text-decoration: underline; }
.valider { min-height: 52px; border: 0; border-radius: var(--arrondi-petit); background: var(--marine); color: var(--blanc); font-weight: 600; font-size: 16px; }
.valider:disabled { opacity: 0.6; cursor: wait; }
.bas { margin: 0; text-align: center; font-size: 14px; }
.bas a { color: var(--marine); font-weight: 600; text-decoration: underline; }
</style>
