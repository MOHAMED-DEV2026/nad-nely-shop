const STYLES = {
  en_attente: { background: "#FFE9CC", color: "#7A3E00" },
  confirmee: { background: "#DCE3F0", color: "#1B2A4A" },
  expediee: { background: "#E9E1CE", color: "#4D3B00" },
  livree: { background: "#DDF0DE", color: "#1B5E20" },
  annulee: { background: "#F8D9D9", color: "#8E1B1B" },
};

export function styleStatut(statut) {
  return STYLES[statut] || STYLES.en_attente;
}
