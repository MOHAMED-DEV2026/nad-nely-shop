import { reactive, computed } from "vue"

const CLE_JETON = "nadnely_jeton"
const CLE_UTILISATEUR = "nadnely_utilisateur"

// « Se souvenir de moi » coché : localStorage (la connexion reste après la fermeture du navigateur).
// Non coché : sessionStorage (la connexion disparait quand on ferme le navigateur).
function stockages() {
  const liste = []
  try { liste.push(localStorage) } catch { /* indisponible */ }
  try { liste.push(sessionStorage) } catch { /* indisponible */ }
  return liste
}

// Relit une valeur, d abord dans localStorage puis dans sessionStorage (null si absente)
function lire(cle) {
  for (const s of stockages()) {
    try {
      const valeur = s.getItem(cle)
      if (valeur !== null) return valeur
    } catch {
      // on essaie le stockage suivant
    }
  }
  return null
}

// Relit le client connecte enregistre dans le navigateur (null si personne)
function lireUtilisateur() {
  try {
    const brut = lire(CLE_UTILISATEUR)
    return brut ? JSON.parse(brut) : null
  } catch {
    return null
  }
}

function effacer() {
  for (const s of stockages()) {
    try {
      s.removeItem(CLE_JETON)
      s.removeItem(CLE_UTILISATEUR)
    } catch {
      // rien a faire
    }
  }
}

const etat = reactive({ utilisateur: lireUtilisateur() })

export const estConnecte = computed(() => etat.utilisateur !== null)
export const estAdmin = computed(() => etat.utilisateur !== null && etat.utilisateur.role === "admin")

// Jeton de connexion a envoyer a l API (null si personne n est connecte)
export function lireJeton() {
  return lire(CLE_JETON)
}

export const auth = {
  etat,
  // Enregistre la reponse de l API (jeton + utilisateur) apres connexion ou inscription
  ouvrirSession(reponse, seSouvenir = true) {
    effacer()
    try {
      const s = seSouvenir ? localStorage : sessionStorage
      s.setItem(CLE_JETON, reponse.token)
      s.setItem(CLE_UTILISATEUR, JSON.stringify(reponse.utilisateur))
    } catch {
      // la session reste en memoire si le navigateur refuse l ecriture
    }
    etat.utilisateur = reponse.utilisateur
  },
  fermerSession() {
    effacer()
    etat.utilisateur = null
  },
}
