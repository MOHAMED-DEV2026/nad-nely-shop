<script setup>
import { ref } from "vue"
import { useRoute, useRouter } from "vue-router"
import { appelerApi } from "../../services/api"
import { auth } from "../../stores/auth"

const route = useRoute()
const router = useRouter()
const email = ref(typeof route.query.email === "string" ? route.query.email : "")
const code = ref("")
const erreur = ref("")
const info = ref(route.query.depuis === "connexion"
  ? "Votre adresse e-mail n'est pas encore vérifiée. Un nouveau code vient de vous être envoyé."
  : "Un code à 6 chiffres vient d'être envoyé à votre adresse e-mail.")
const envoi = ref(false)
const renvoi = ref(false)

function lireErreur(e) {
  if (e.statut === 429) return "Trop de tentatives. Réessayez dans quelques minutes."
  const d = e.donnees || {}
  return (d.erreurs && d.erreurs[0] && d.erreurs[0].msg) || d.message || "Une erreur est survenue."
}

async function verifier() {
  erreur.value = ""
  envoi.value = true
  try {
    const reponse = await appelerApi("/auth/verifier-email", { method: "POST", corps: { email: email.value.trim(), code: code.value.trim() } })
    auth.ouvrirSession(reponse)
    // Retour a la page d origine (adresse interne seulement), sinon accueil
    const retour = route.query.redirection
    const retourValide = typeof retour === "string" && retour.startsWith("/") && !retour.startsWith("//")
    router.push(retourValide ? retour : "/")
  } catch (e) {
    erreur.value = lireErreur(e)
  } finally {
    envoi.value = false
  }
}

async function renvoyer() {
  erreur.value = ""
  if (!email.value.trim()) {
    erreur.value = "Saisissez votre adresse e-mail."
    return
  }
  renvoi.value = true
  try {
    const rep = await appelerApi("/auth/renvoyer-code", { method: "POST", corps: { email: email.value.trim() } })
    info.value = rep.message
    code.value = ""
  } catch (e) {
    erreur.value = lireErreur(e)
  } finally {
    renvoi.value = false
  }
}
</script>

<template>
  <section class="page">
    <h1>Vérifier mon adresse e-mail</h1>
    <form class="carte" @submit.prevent="verifier">
      <p class="info" role="status">{{ info }}</p>
      <label for="email">Adresse e-mail</label>
      <input id="email" type="email" v-model="email" required autocomplete="email" />
      <label for="code">Code à 6 chiffres</label>
      <input id="code" class="code" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" v-model="code" required />
      <p class="aide">Le code est valable 15 minutes et ne sert qu'une fois. Pensez à regarder dans vos courriers indésirables.</p>
      <p v-if="erreur" class="erreur" role="alert">{{ erreur }}</p>
      <button class="bouton" type="submit" :disabled="envoi">Valider mon compte</button>
      <button class="lien" type="button" :disabled="renvoi" @click="renvoyer">Je n'ai rien reçu : renvoyer un code</button>
    </form>
  </section>
</template>

<style scoped>
.page { max-width: 440px; margin: 0 auto; padding: 32px 16px; }
h1 { text-align: center; font-size: 28px; }
.carte { background: var(--blanc); border: 1px solid var(--bordure); border-radius: 16px; padding: 24px; display: flex; flex-direction: column; gap: 10px; }
label { font-size: 14px; font-weight: 500; }
input { min-height: 48px; padding: 0 14px; border: 1.5px solid var(--marine); border-radius: 8px; font-size: 16px; background: var(--creme); }
.code { font-size: 20px; letter-spacing: 8px; text-align: center; }
.info { background: var(--fond-bleu-clair); color: var(--marine); padding: 12px; border-radius: 8px; font-size: 13px; margin: 0; }
.aide { font-size: 13px; color: var(--texte-doux); margin: 0; }
.erreur { background: var(--erreur-fond); color: var(--erreur-texte); padding: 12px; border-radius: 8px; margin: 0; }
.lien { background: none; border: 0; color: var(--marine); text-decoration: underline; font-weight: 500; font-size: 14px; padding: 8px; }
.lien:disabled { opacity: 0.6; cursor: wait; }
</style>
