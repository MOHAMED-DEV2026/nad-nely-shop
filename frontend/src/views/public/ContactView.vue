<script setup>
import { ref, onMounted } from "vue";
import { appelerApi } from "../../services/api.js";
import { estConnecte } from "../../stores/auth.js";

const nom = ref("");
const email = ref("");
const sujet = ref("");
const message = ref("");
// Champ piège invisible : seuls les robots le remplissent
const siteWeb = ref("");
const erreur = ref("");
const confirmation = ref("");
const envoi = ref(false);

const SUJETS = ["Question sur un produit", "Suivi de ma commande", "Livraison ou retrait", "Mon compte", "Autre demande"];

// Client connecté : son nom et son e-mail sont déjà remplis
onMounted(async () => {
  if (!estConnecte.value) return;
  try {
    const c = await appelerApi("/compte");
    nom.value = `${c.prenom} ${c.nom}`;
    email.value = c.email;
  } catch {
    // le visiteur remplira lui-même les champs
  }
});

function lireErreur(e) {
  const d = e.donnees || {};
  return (d.erreurs && d.erreurs[0] && d.erreurs[0].msg) || d.message || "Une erreur est survenue.";
}

async function envoyer() {
  erreur.value = "";
  envoi.value = true;
  try {
    const rep = await appelerApi("/contact", {
      method: "POST",
      corps: { nom: nom.value.trim(), email: email.value.trim(), sujet: sujet.value, message: message.value.trim(), site_web: siteWeb.value },
    });
    confirmation.value = rep.message;
    sujet.value = "";
    message.value = "";
  } catch (e) {
    erreur.value = lireErreur(e);
  } finally {
    envoi.value = false;
  }
}
</script>

<template>
  <section class="page">
    <h1>Nous contacter</h1>
    <p class="intro">Une question sur un produit, une commande ou une livraison ? Écrivez-nous, nous vous répondons par e-mail.</p>

    <div v-if="confirmation" class="carte">
      <p class="succes">{{ confirmation }}</p>
      <button class="bouton bouton-contour" type="button" @click="confirmation = ''">Envoyer un autre message</button>
      <RouterLink class="bouton" to="/catalogue">Retour à la boutique</RouterLink>
    </div>

    <form v-else class="carte" @submit.prevent="envoyer">
      <label for="nom">Nom et prénom</label>
      <input id="nom" type="text" v-model="nom" maxlength="100" autocomplete="name" required />

      <label for="email">Adresse e-mail</label>
      <input id="email" type="email" v-model="email" maxlength="100" autocomplete="email" required />

      <label for="sujet">Sujet</label>
      <select id="sujet" v-model="sujet" required>
        <option value="" disabled>Choisir un sujet</option>
        <option v-for="s in SUJETS" :key="s" :value="s">{{ s }}</option>
      </select>

      <label for="message">Message</label>
      <textarea id="message" v-model="message" rows="6" minlength="10" maxlength="3000" required></textarea>
      <p class="aide">{{ message.length }} / 3000 caractères</p>

      <!-- Piège anti-robots : caché aux visiteurs et aux lecteurs d'écran -->
      <div class="piege" aria-hidden="true">
        <label for="site_web">Site web</label>
        <input id="site_web" type="text" v-model="siteWeb" tabindex="-1" autocomplete="off" />
      </div>

      <p v-if="erreur" class="erreur">{{ erreur }}</p>
      <button class="bouton bouton-or" type="submit" :disabled="envoi">{{ envoi ? "Envoi en cours…" : "Envoyer le message" }}</button>
    </form>
  </section>
</template>

<style scoped>
.page { max-width: 560px; margin: 0 auto; padding: 32px 16px; }
h1 { text-align: center; font-size: 28px; margin-bottom: 8px; }
.intro { text-align: center; color: var(--texte-doux); margin: 0 0 24px; }
.carte { background: var(--blanc); border: 1px solid var(--bordure); border-radius: 16px; padding: 24px; display: flex; flex-direction: column; gap: 10px; }
label { font-size: 14px; font-weight: 500; }
input, select, textarea { min-height: 48px; padding: 0 14px; border: 1.5px solid var(--marine); border-radius: 8px; font-size: 16px; background: var(--creme); }
textarea { padding: 12px 14px; resize: vertical; line-height: 1.5; }
.aide { font-size: 13px; color: var(--texte-doux); margin: 0; text-align: right; }
.piege { position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden; }
.succes { background: var(--succes-fond); color: var(--succes-texte); padding: 12px; border-radius: 8px; margin: 0; }
.erreur { background: var(--erreur-fond); color: var(--erreur-texte); padding: 12px; border-radius: 8px; margin: 0; }
</style>
