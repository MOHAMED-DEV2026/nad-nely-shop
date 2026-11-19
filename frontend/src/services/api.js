import { auth, lireJeton } from "../stores/auth"

const URL_API = import.meta.env.VITE_API_URL

// Session expiree (jeton de 2 h depasse) : on efface la session et on renvoie vers la connexion,
// avec un message, puis retour sur la page ou le client etait
function sessionExpiree() {
  auth.fermerSession()
  try {
    sessionStorage.setItem("messageConnexion", "Votre session a expiré, veuillez vous reconnecter.")
  } catch {
    // le message ne sera pas affiche, la redirection se fait quand meme
  }
  const retour = window.location.pathname + window.location.search
  window.location.assign("/connexion?redirection=" + encodeURIComponent(retour))
}

// Fonction unique pour parler a l API (ajoute le jeton de connexion si le client est connecte)
export async function appelerApi(chemin, options = {}) {
  const jeton = lireJeton()
  const estFormulaire = options.corps instanceof FormData
  const entetes = estFormulaire ? {} : { "Content-Type": "application/json" }
  if (jeton) entetes.Authorization = `Bearer ${jeton}`
  const reponse = await fetch(URL_API + chemin, {
    method: options.method || "GET",
    headers: entetes,
    body: options.corps ? (estFormulaire ? options.corps : JSON.stringify(options.corps)) : undefined,
  })
  const donnees = await reponse.json().catch(() => null)
  if (!reponse.ok) {
    // 401 pour un client connecte (hors connexion/inscription, ou 401 = mauvais mot de passe) : jeton expire
    if (reponse.status === 401 && jeton && !chemin.startsWith("/auth/")) sessionExpiree()
    const erreur = new Error((donnees && donnees.message) || "Erreur du serveur")
    erreur.statut = reponse.status
    erreur.donnees = donnees
    throw erreur
  }
  return donnees
}

// Adresse complete de l image d un produit (fichier range par l API)
export function urlImage(nomFichier) {
  return URL_API + "/uploads/" + nomFichier
}
