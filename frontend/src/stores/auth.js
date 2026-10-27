import { reactive, computed } from "vue"

const CLE_JETON = "nadnely_jeton"
const CLE_UTILISATEUR = "nadnely_utilisateur"

// Relit le client connecte enregistre dans le navigateur (null si personne)
function lireUtilisateur() {
  try {
    const brut = localStorage.getItem(CLE_UTILISATEUR)
    return brut ? JSON.parse(brut) : null
  } catch {
    return null
  }
}

const etat = reactive({ utilisateur: lireUtilisateur() })

export const estConnecte = computed(() => etat.utilisateur !== null)
export const estAdmin = computed(() => etat.utilisateur !== null && etat.utilisateur.role === "admin")

export const auth = {
  etat,
  // Enregistre la reponse de l API (jeton + utilisateur) apres connexion ou inscription
  ouvrirSession(reponse) {
    try {
      localStorage.setItem(CLE_JETON, reponse.token)
      localStorage.setItem(CLE_UTILISATEUR, JSON.stringify(reponse.utilisateur))
    } catch {
      // la session reste en memoire si le navigateur refuse l ecriture
    }
    etat.utilisateur = reponse.utilisateur
  },
  fermerSession() {
    try {
      localStorage.removeItem(CLE_JETON)
      localStorage.removeItem(CLE_UTILISATEUR)
    } catch {
      // rien a faire
    }
    etat.utilisateur = null
  },
}
