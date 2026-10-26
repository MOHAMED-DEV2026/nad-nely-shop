const URL_API = import.meta.env.VITE_API_URL

// Fonction unique pour parler a l API (ajoute le jeton de connexion si le client est connecte)
export async function appelerApi(chemin, options = {}) {
  const jeton = localStorage.getItem("nadnely_jeton")
  const entetes = { "Content-Type": "application/json" }
  if (jeton) entetes.Authorization = `Bearer ${jeton}`
  const reponse = await fetch(URL_API + chemin, {
    method: options.method || "GET",
    headers: entetes,
    body: options.corps ? JSON.stringify(options.corps) : undefined,
  })
  const donnees = await reponse.json().catch(() => null)
  if (!reponse.ok) {
    const erreur = new Error((donnees && donnees.message) || "Erreur du serveur")
    erreur.statut = reponse.status
    erreur.donnees = donnees
    throw erreur
  }
  return donnees
}

// Adresse complete de l image d un produit (fichier range par l API)
export function urlImage(nomFichier) {
  return URL_API.replace(/\/api$/, "") + "/uploads/" + nomFichier
}
