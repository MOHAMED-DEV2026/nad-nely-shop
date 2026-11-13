<script setup>
import { ref, reactive } from "vue"
import { useRoute, useRouter } from "vue-router"
import { appelerApi } from "../../services/api"
import { auth } from "../../stores/auth"
import ChampMotDePasse from "../../components/ChampMotDePasse.vue"

const route = useRoute()
const router = useRouter()
const champs = reactive({ nom: "", prenom: "", email: "", telephone: "", motDePasse: "", confirmation: "", rgpd: false })
const erreurs = reactive({})
const erreurGenerale = ref("")
const envoi = ref(false)
const lienConnexion = { path: "/connexion", query: route.query }

// RG02 : 8 caracteres minimum, dont une majuscule, une minuscule et un chiffre
const REGLE_MDP = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/

function verifier() {
  for (const cle of Object.keys(erreurs)) delete erreurs[cle]
  if (!champs.nom.trim()) erreurs.nom = "Le nom est obligatoire."
  if (!champs.prenom.trim()) erreurs.prenom = "Le prénom est obligatoire."
  if (!champs.email.trim()) erreurs.email = "Saisissez votre adresse e-mail."
  if (!REGLE_MDP.test(champs.motDePasse)) erreurs.motDePasse = "Le mot de passe doit contenir au moins 8 caractères, dont une majuscule, une minuscule et un chiffre."
  else if (champs.confirmation !== champs.motDePasse) erreurs.confirmation = "La confirmation est différente du mot de passe."
  if (!champs.rgpd) erreurs.rgpd = "Vous devez accepter la politique de confidentialité."
  return Object.keys(erreurs).length === 0
}

async function sInscrire() {
  erreurGenerale.value = ""
  if (!verifier()) return
  envoi.value = true
  try {
    const reponse = await appelerApi("/auth/inscription", {
      method: "POST",
      corps: { nom: champs.nom.trim(), prenom: champs.prenom.trim(), email: champs.email.trim(), telephone: champs.telephone.trim(), mot_de_passe: champs.motDePasse },
    })
    auth.ouvrirSession(reponse)
    // Retour a la page d origine (adresse interne seulement), sinon accueil
    const retour = route.query.redirection
    const retourValide = typeof retour === "string" && retour.startsWith("/") && !retour.startsWith("//")
    router.push(retourValide ? retour : "/")
  } catch (e) {
    if (e.statut === 409) {
      erreurs.email = "Cette adresse e-mail est déjà utilisée."
    } else if (e.statut === 400 && e.donnees && e.donnees.erreurs) {
      for (const er of e.donnees.erreurs) erreurs[er.path === "mot_de_passe" ? "motDePasse" : er.path] = er.msg
    } else if (e.statut === 429) {
      erreurGenerale.value = "Trop de tentatives. Réessayez dans quelques minutes."
    } else {
      erreurGenerale.value = "Inscription impossible pour le moment. Réessayez plus tard."
    }
  } finally {
    envoi.value = false
  }
}
</script>

<template>
  <main class="page">
    <section class="carte">
      <h1>Créer un compte</h1>
      <p class="sous-titre">Les champs marqués d'un astérisque (*) sont obligatoires.</p>
      <p v-if="erreurGenerale" class="message-erreur" role="alert">{{ erreurGenerale }}</p>
      <form novalidate @submit.prevent="sInscrire">
        <div class="rangee">
          <div class="champ">
            <label for="nom">Nom *</label>
            <input id="nom" v-model="champs.nom" type="text" autocomplete="family-name" :class="{ invalide: erreurs.nom }" />
            <span v-if="erreurs.nom" class="erreur">{{ erreurs.nom }}</span>
          </div>
          <div class="champ">
            <label for="prenom">Prénom *</label>
            <input id="prenom" v-model="champs.prenom" type="text" autocomplete="given-name" :class="{ invalide: erreurs.prenom }" />
            <span v-if="erreurs.prenom" class="erreur">{{ erreurs.prenom }}</span>
          </div>
        </div>
        <div class="champ">
          <label for="email">Adresse e-mail *</label>
          <input id="email" v-model="champs.email" type="email" autocomplete="email" :class="{ invalide: erreurs.email }" />
          <span v-if="erreurs.email" class="erreur">{{ erreurs.email }}</span>
        </div>
        <div class="champ">
          <label for="tel">Téléphone (facultatif)</label>
          <input id="tel" v-model="champs.telephone" type="tel" autocomplete="tel" :class="{ invalide: erreurs.telephone }" />
          <span v-if="erreurs.telephone" class="erreur">{{ erreurs.telephone }}</span>
        </div>
        <div class="champ">
          <label for="mdp">Mot de passe *</label>
          <ChampMotDePasse id="mdp" v-model="champs.motDePasse" autocomplete="new-password" :class="{ invalide: erreurs.motDePasse }" />
          <span v-if="erreurs.motDePasse" class="erreur">{{ erreurs.motDePasse }}</span>
          <span v-else class="aide">Au moins 8 caractères, dont une majuscule, une minuscule et un chiffre.</span>
        </div>
        <div class="champ">
          <label for="mdp2">Confirmation du mot de passe *</label>
          <ChampMotDePasse id="mdp2" v-model="champs.confirmation" autocomplete="new-password" :class="{ invalide: erreurs.confirmation }" />
          <span v-if="erreurs.confirmation" class="erreur">{{ erreurs.confirmation }}</span>
        </div>
        <div class="champ">
          <div class="accord">
            <input id="rgpd" v-model="champs.rgpd" type="checkbox" />
            <label for="rgpd">J'accepte la <RouterLink to="/confidentialite">politique de confidentialité</RouterLink> *</label>
          </div>
          <span v-if="erreurs.rgpd" class="erreur">{{ erreurs.rgpd }}</span>
        </div>
        <button type="submit" class="valider" :disabled="envoi">Créer mon compte</button>
        <p class="bas">Déjà un compte ? <RouterLink :to="lienConnexion">Se connecter</RouterLink></p>
      </form>
    </section>
  </main>
</template>

<style scoped>
.page { max-width: var(--largeur-max); margin: 0 auto; padding: 40px 24px; display: flex; justify-content: center; }
.carte { flex: 0 1 560px; min-width: 0; background: var(--blanc); border: 1px solid var(--bordure); border-radius: var(--arrondi-grand); padding: 32px; }
.carte h1 { margin: 0 0 4px; font-size: 34px; }
.sous-titre { margin: 0 0 24px; color: var(--texte-doux); font-size: 14px; }
.message-erreur { background: var(--erreur-fond); color: var(--erreur-texte); border-radius: var(--arrondi-petit); padding: 12px 16px; font-size: 14px; font-weight: 500; margin: 0 0 16px; }
form { display: flex; flex-direction: column; gap: 16px; }
.rangee { display: flex; flex-wrap: wrap; gap: 16px; }
.rangee .champ { flex: 1 1 220px; }
.champ { display: flex; flex-direction: column; gap: 4px; }
.champ label { font-size: 14px; font-weight: 500; }
.champ input[type="text"], .champ input[type="email"], .champ input[type="tel"], .champ input[type="password"] { min-height: var(--hauteur-champ); border: 1.5px solid var(--marine); border-radius: var(--arrondi-petit); padding: 0 14px; font-size: 16px; background: var(--creme); }
.champ input.invalide, .champ :deep(input.invalide) { border-color: var(--rouge); }
.erreur { color: var(--rouge); font-size: 13px; font-weight: 500; }
.aide { color: var(--texte-doux); font-size: 13px; }
.accord { display: flex; align-items: flex-start; gap: 12px; }
.accord input { width: 24px; height: 24px; margin: 2px 0 0; accent-color: var(--marine); flex: 0 0 24px; }
.accord label { font-size: 14px; }
.accord a { color: var(--marine); text-decoration: underline; font-weight: 500; }
.valider { min-height: 52px; border: 0; border-radius: var(--arrondi-petit); background: var(--marine); color: var(--blanc); font-weight: 600; font-size: 16px; }
.valider:disabled { opacity: 0.6; cursor: wait; }
.bas { margin: 0; text-align: center; font-size: 14px; }
.bas a { color: var(--marine); font-weight: 600; text-decoration: underline; }
</style>
