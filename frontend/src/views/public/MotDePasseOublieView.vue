<script setup>
import { ref } from "vue";
import { appelerApi } from "../../services/api.js";
import ChampMotDePasse from "../../components/ChampMotDePasse.vue";

const etape = ref(1);
const email = ref("");
const code = ref("");
const nouveau = ref("");
const confirmation = ref("");
const info = ref("");
const erreur = ref("");
const termine = ref(false);
const envoi = ref(false);

function lireErreur(e) {
  const d = e.donnees || {};
  return (d.erreurs && d.erreurs[0] && d.erreurs[0].msg) || d.message || "Une erreur est survenue.";
}

async function demanderCode() {
  erreur.value = "";
  envoi.value = true;
  try {
    const rep = await appelerApi("/auth/mot-de-passe-oublie", { method: "POST", corps: { email: email.value.trim() } });
    info.value = rep.message;
    etape.value = 2;
  } catch (e) {
    erreur.value = lireErreur(e);
  } finally {
    envoi.value = false;
  }
}

async function reinitialiser() {
  erreur.value = "";
  envoi.value = true;
  try {
    await appelerApi("/auth/reinitialiser-mot-de-passe", { method: "POST", corps: { email: email.value.trim(), code: code.value.trim(), nouveau_mot_de_passe: nouveau.value, confirmation: confirmation.value } });
    termine.value = true;
  } catch (e) {
    erreur.value = lireErreur(e);
  } finally {
    envoi.value = false;
  }
}
</script>

<template>
  <section class="page">
    <h1>Réinitialiser mon mot de passe</h1>
    <div v-if="termine" class="carte">
      <p class="succes">Mot de passe réinitialisé. Vous pouvez vous connecter.</p>
      <RouterLink class="bouton" to="/connexion">Se connecter</RouterLink>
    </div>
    <form v-else-if="etape === 1" class="carte" @submit.prevent="demanderCode">
      <span class="etape">Étape 1</span>
      <h2>Saisir mon e-mail</h2>
      <label for="email">Adresse e-mail</label>
      <input id="email" type="email" v-model="email" required />
      <p v-if="erreur" class="erreur">{{ erreur }}</p>
      <button class="bouton" type="submit" :disabled="envoi">Recevoir un code</button>
    </form>
    <form v-else class="carte" @submit.prevent="reinitialiser">
      <span class="etape">Étape 2</span>
      <h2>Code et nouveau mot de passe</h2>
      <p class="info">{{ info }}</p>
      <label for="code">Code à 6 chiffres</label>
      <input id="code" class="code" type="text" inputmode="numeric" maxlength="6" v-model="code" />
      <p class="aide">Le code est valable 15 minutes et ne sert qu'une fois.</p>
      <label for="nouveau">Nouveau mot de passe</label>
      <ChampMotDePasse id="nouveau" v-model="nouveau" autocomplete="new-password" />
      <label for="conf">Confirmation</label>
      <ChampMotDePasse id="conf" v-model="confirmation" autocomplete="new-password" />
      <p class="aide">Au moins 8 caractères, dont une majuscule, une minuscule et un chiffre.</p>
      <p v-if="erreur" class="erreur">{{ erreur }}</p>
      <button class="bouton" type="submit" :disabled="envoi">Enregistrer</button>
    </form>
  </section>
</template>

<style scoped>
.page { max-width: 440px; margin: 0 auto; padding: 32px 16px; }
h1 { text-align: center; font-size: 28px; }
.carte { background: var(--blanc); border: 1px solid var(--bordure); border-radius: 16px; padding: 24px; display: flex; flex-direction: column; gap: 10px; }
.etape { align-self: flex-start; background: var(--marine); color: var(--blanc); border-radius: 999px; padding: 2px 14px; font-size: 13px; font-weight: 600; }
h2 { font-size: 22px; margin: 0; }
label { font-size: 14px; font-weight: 500; }
input { min-height: 48px; padding: 0 14px; border: 1.5px solid var(--marine); border-radius: 8px; font-size: 16px; background: var(--creme); }
.code { font-size: 20px; letter-spacing: 8px; text-align: center; }
.info { background: var(--fond-bleu-clair); color: var(--marine); padding: 12px; border-radius: 8px; font-size: 13px; margin: 0; }
.aide { font-size: 13px; color: var(--texte-doux); margin: 0; }
.succes { background: #DDF0DE; color: #1B5E20; padding: 12px; border-radius: 8px; margin: 0; }
.erreur { background: var(--erreur-fond); color: var(--erreur-texte); padding: 12px; border-radius: 8px; margin: 0; }
</style>
