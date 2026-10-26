// Affiche un prix en euros, par exemple 35,00 €
export function formaterPrix(montant) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(Number(montant))
}
