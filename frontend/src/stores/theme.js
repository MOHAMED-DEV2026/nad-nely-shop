import { ref } from "vue"

const CLE = "nadnely_theme"

// Thème de départ : le choix enregistré, sinon celui de l appareil (mode sombre du telephone ou de l ordinateur)
function themeDeDepart() {
  try {
    const enregistre = localStorage.getItem(CLE)
    if (enregistre === "clair" || enregistre === "sombre") return enregistre
  } catch {
    // stockage indisponible : on suit l appareil
  }
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "sombre" : "clair"
}

export const theme = ref(themeDeDepart())

// Applique le thème a toute la page (les couleurs sont dans styles/variables.css)
function appliquer() {
  document.documentElement.dataset.theme = theme.value === "sombre" ? "dark" : "light"
}
appliquer()

// Passe du clair au sombre (ou l inverse) et retient le choix pour les prochaines visites
export function basculerTheme() {
  theme.value = theme.value === "sombre" ? "clair" : "sombre"
  appliquer()
  try {
    localStorage.setItem(CLE, theme.value)
  } catch {
    // le choix ne sera pas retenu, mais il s applique quand meme
  }
}
