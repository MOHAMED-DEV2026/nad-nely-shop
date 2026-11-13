<script setup>
import { reactive, ref, onMounted } from "vue";
import { appelerApi } from "../../services/api.js";
import NavCompte from "../../components/NavCompte.vue";
import ChampMotDePasse from "../../components/ChampMotDePasse.vue";

const infos = reactive({ nom: "", prenom: "", telephone: "", email: "" });
const messageInfos = ref("");
const erreurInfos = ref("");
const mdp = reactive({ ancien: "", nouveau: "", confirmation: "" });
const messageMdp = ref("");
const erreurMdp = ref("");

function lireErreur(e) {
  const d = e.donnees || {};
  return (d.erreurs && d.erreurs[0] && d.erreurs[0].msg) || d.message || "Une erreur est survenue.";
}

onMounted(async () => {
  try {
    const c = await appelerApi("/compte");
    infos.nom = c.nom;
    infos.prenom = c.prenom;
    infos.telephone = c.telephone || "";
    infos.email = c.email;
  } catch (e) {
    erreurInfos.value = "Impossible de charger vos informations.";
  }
});

async function enregistrer() {
  messageInfos.value = "";
  erreurInfos.value = "";
  try {
    await appelerApi("/compte", { method: "PUT", corps: { nom: infos.nom, prenom: infos.prenom, telephone: infos.telephone } });
    messageInfos.value = "Vos informations ont été enregistrées.";
  } catch (e) {
    erreurInfos.value = lireErreur(e);
  }
}

async function changerMotDePasse() {
  messageMdp.value = "";
  erreurMdp.value = "";
  if (mdp.nouveau !== mdp.confirmation) {
    erreurMdp.value = "La confirmation ne correspond pas au nouveau mot de passe.";
    return;
  }
  try {
    await appelerApi("/compte/mot-de-passe", { method: "PUT", corps: { ancien_mot_de_passe: mdp.ancien, nouveau_mot_de_passe: mdp.nouveau } });
    messageMdp.value = "Votre mot de passe a été modifié.";
    mdp.ancien = "";
    mdp.nouveau = "";
    mdp.confirmation = "";
  } catch (e) {
    erreurMdp.value = lireErreur(e);
  }
}
</script>

<template>
  <section class="page">
    <h1>Mon compte</h1>
    <NavCompte />
    <div class="deux">
      <form class="carte" @submit.prevent="enregistrer">
        <h2>Informations personnelles</h2>
        <label for="nom">Nom</label>
        <input id="nom" type="text" v-model="infos.nom" maxlength="50" />
        <label for="prenom">Prénom</label>
        <input id="prenom" type="text" v-model="infos.prenom" maxlength="50" />
        <label for="tel">Téléphone</label>
        <input id="tel" type="tel" v-model="infos.telephone" maxlength="20" />
        <label for="mail">Adresse e-mail</label>
        <input id="mail" type="email" :value="infos.email" disabled />
        <p class="aide">L'adresse e-mail n'est pas modifiable dans cette version.</p>
        <button class="bouton" type="submit">Enregistrer</button>
        <p v-if="messageInfos" class="succes">{{ messageInfos }}</p>
        <p v-if="erreurInfos" class="erreur">{{ erreurInfos }}</p>
      </form>
      <form class="carte" @submit.prevent="changerMotDePasse">
        <h2>Changer mon mot de passe</h2>
        <label for="ancien">Ancien mot de passe</label>
        <ChampMotDePasse id="ancien" v-model="mdp.ancien" autocomplete="current-password" />
        <label for="nouveau">Nouveau mot de passe</label>
        <ChampMotDePasse id="nouveau" v-model="mdp.nouveau" autocomplete="new-password" />
        <p class="aide">Au moins 8 caractères, dont une majuscule, une minuscule et un chiffre.</p>
        <label for="conf">Confirmation</label>
        <ChampMotDePasse id="conf" v-model="mdp.confirmation" autocomplete="new-password" />
        <button class="bouton" type="submit">Changer le mot de passe</button>
        <p v-if="messageMdp" class="succes">{{ messageMdp }}</p>
        <p v-if="erreurMdp" class="erreur">{{ erreurMdp }}</p>
      </form>
    </div>
  </section>
</template>

<style scoped>
.page { max-width: var(--largeur-max); margin: 0 auto; padding: 24px 16px; }
.deux { display: grid; gap: 24px; align-items: start; }
.carte { background: var(--blanc); border: 1px solid var(--bordure); border-radius: 16px; padding: 20px; display: flex; flex-direction: column; gap: 8px; }
label { font-size: 14px; font-weight: 500; }
input { min-height: 48px; padding: 0 14px; border: 1.5px solid var(--marine); border-radius: 8px; font-size: 16px; background: var(--creme); }
input:disabled { border-color: var(--bordure); background: #F4F1EC; color: var(--texte-doux); }
.aide { font-size: 13px; color: var(--texte-doux); margin: 0; }
.succes { background: #DDF0DE; color: #1B5E20; padding: 12px; border-radius: 8px; margin: 0; }
.erreur { background: var(--erreur-fond); color: var(--erreur-texte); padding: 12px; border-radius: 8px; margin: 0; }
@media (min-width: 768px) { .deux { grid-template-columns: 1fr 1fr; } }
</style>
