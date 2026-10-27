import { reactive, computed } from "vue"

const CLE = "nadnely_panier"

// Lit le panier enregistre dans le navigateur (vide si rien ou si erreur)
function lire() {
  try {
    const brut = localStorage.getItem(CLE)
    const lignes = brut ? JSON.parse(brut) : []
    return Array.isArray(lignes) ? lignes : []
  } catch {
    return []
  }
}

export const etat = reactive({ lignes: lire() })

function sauver() {
  try {
    localStorage.setItem(CLE, JSON.stringify(etat.lignes))
  } catch {
    // le panier reste en memoire si le navigateur refuse l ecriture
  }
}

export const nombreArticles = computed(() => etat.lignes.reduce((somme, l) => somme + l.quantite, 0))
export const totalPanier = computed(() => etat.lignes.reduce((somme, l) => somme + l.quantite * Number(l.prix), 0))

export const panier = {
  etat,
  // Ajoute un produit (la quantite totale ne depasse jamais le stock)
  ajouter(produit, quantite) {
    const ligne = etat.lignes.find((l) => l.id_produit === produit.id_produit)
    if (ligne) {
      ligne.stock = produit.stock
      ligne.quantite = Math.min(ligne.quantite + quantite, produit.stock)
    } else {
      etat.lignes.push({ id_produit: produit.id_produit, nom: produit.nom, prix: produit.prix, image: produit.image, categorie: produit.categorie, stock: produit.stock, quantite: Math.min(quantite, produit.stock) })
    }
    sauver()
  },
  changerQuantite(id, quantite) {
    const ligne = etat.lignes.find((l) => l.id_produit === id)
    if (!ligne) return
    ligne.quantite = Math.min(Math.max(quantite, 1), ligne.stock)
    sauver()
  },
  retirer(id) {
    etat.lignes = etat.lignes.filter((l) => l.id_produit !== id)
    sauver()
  },
  vider() {
    etat.lignes = []
    sauver()
  },
}


