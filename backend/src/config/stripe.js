const Stripe = require('stripe');

// La clé secrète vient du fichier .env (jamais écrite dans le code). Mode test : elle commence par sk_test_
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Crée une page de paiement Stripe Checkout pour une commande et renvoie la session (id et adresse) (BF18)
// RG36 : le montant payé est égal au montant total de la commande (en centimes pour Stripe)
// RG40 : aucune donnée bancaire n'est stockée, seule la référence de la session Stripe est enregistrée
async function creerSessionPaiement(idCommande, montant) {
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    client_reference_id: String(idCommande),
    metadata: { id_commande: String(idCommande) },
    line_items: [{
      quantity: 1,
      price_data: {
        currency: 'eur',
        unit_amount: Math.round(Number(montant) * 100),
        product_data: { name: `Commande NAD-NELY Shop n° ${idCommande}` },
      },
    }],
    success_url: `${process.env.FRONT_URL}/paiement/succes?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONT_URL}/paiement/annule?commande=${idCommande}`,
  });
  return session;
}

module.exports = { stripe, creerSessionPaiement };