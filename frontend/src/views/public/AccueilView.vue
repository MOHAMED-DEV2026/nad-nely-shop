<script setup>
import { ref, onMounted } from "vue";
import { appelerApi } from "../../services/api.js";
import CarteProduit from "../../components/CarteProduit.vue";
// Photo du hero : pour en changer, remplacer le fichier hero1.jpg du dossier assets
import photoHero from "../../assets/hero1.jpg";

const categories = ref([]);
const nouveautes = ref([]);
const TEINTES = ["var(--rose)", "var(--fond-beige)", "var(--fond-bleu-clair)"];

// Chaque garantie a une icône dessinée en SVG (liste de tracés « d »)
const GARANTIES = [
  {
    titre: "Paiement sécurisé",
    texte: "Règlement par carte via Stripe. Aucune donnée bancaire n'est stockée sur le site.",
    icone: ["M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z", "M9 12l2 2 4-4"],
  },
  {
    titre: "Livraison ou retrait",
    texte: "Livraison dans les 17 communes de Mayotte, ou retrait (lieu et horaire convenus par téléphone).",
    icone: ["M2 6h12v10H2z", "M14 9h4l4 4v3h-8", "M6 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4z", "M18 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"],
  },
  {
    titre: "Suivi de commande",
    texte: "Suivez chaque étape depuis votre compte, de la confirmation à la livraison.",
    icone: ["M9 3h6v3H9z", "M8 4.5H5V21h14V4.5h-3", "M9 13l2 2 4-4"],
  },
];

onMounted(async () => {
  try {
    const [cats, produits] = await Promise.all([appelerApi("/categories"), appelerApi("/produits?tri=nouveautes")]);
    categories.value = cats;
    nouveautes.value = produits.produits;
  } catch (e) {
    categories.value = [];
    nouveautes.value = [];
  }
});
</script>

<template>
  <div>
    <section class="hero" :style="{ '--photo': 'url(' + photoHero + ')' }">
      <div class="interieur">
        <p class="lieu">NAD-NELY SHOP</p>
        <h1>Votre style, Votre beauté, votre élégance</h1>
        <p class="texte">Vêtements, chaussures, sacs, parfums et cosmétiques. Commandez en ligne, payez en sécurité, recevez chez vous ou retirez en boutique.</p>
        <div class="boutons">
          <RouterLink class="bouton bouton-or" to="/catalogue">Découvrir le catalogue</RouterLink>
          <RouterLink class="bouton bouton-contour" to="/catalogue?tri=nouveautes">Voir les nouveautés</RouterLink>
        </div>
      </div>
    </section>

    <section class="bloc">
      <h2>Nos catégories</h2>
      <p class="sous">Choisissez un univers pour afficher le catalogue.</p>
      <div class="categories">
        <RouterLink v-for="(c, i) in categories" :key="c.id_categorie" class="tuile" :style="{ background: TEINTES[i % 3] }" :to="'/catalogue?categorie=' + c.id_categorie">
          <span class="initiale">{{ c.nom.charAt(0) }}</span>
          {{ c.nom }}
        </RouterLink>
      </div>
    </section>

    <section class="bloc">
      <div class="entete-bloc">
        <h2>Dernières nouveautés</h2>
        <RouterLink class="tout" to="/catalogue">Voir tout le catalogue</RouterLink>
      </div>
      <div class="produits">
        <CarteProduit v-for="p in nouveautes" :key="p.id_produit" :produit="p" />
      </div>
    </section>

    <section class="bloc">
      <h2>Nos engagements</h2>
      <p class="sous">Acheter en ligne en toute confiance, partout à Mayotte.</p>
      <div class="garanties">
        <div v-for="g in GARANTIES" :key="g.titre" class="garantie">
          <span class="icone">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path v-for="d in g.icone" :key="d" :d="d" /></svg>
          </span>
          <div>
            <h3>{{ g.titre }}</h3>
            <p>{{ g.texte }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* Photo en fond, voile bleu marine par-dessus pour que le texte reste lisible sur n'importe quelle photo */
.hero { min-height: 400px; display: flex; align-items: center; color: var(--sur-marque); background: linear-gradient(rgba(27, 42, 74, 0.72), rgba(27, 42, 74, 0.72)), var(--photo) center 10% / cover no-repeat; }
.interieur { width: 100%; max-width: var(--largeur-max); margin: 0 auto; padding: 40px 16px; }
.lieu { margin: 0 0 8px; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: var(--or); font-weight: 600; }
.hero h1 { font-size: 32px; line-height: 1.15; margin: 0 0 12px; color: var(--sur-marque); max-width: 620px; }
.texte { margin: 0 0 24px; max-width: 520px; color: var(--sur-marque); }
.hero .bouton-contour { color: var(--sur-marque); border-color: var(--sur-marque); background: transparent; }
.boutons { display: flex; flex-wrap: wrap; gap: 12px; }
.bloc { max-width: var(--largeur-max); margin: 0 auto; padding: 32px 16px 8px; }
.bloc h2 { font-size: 26px; margin: 0 0 8px; }
.sous { margin: 0 0 16px; color: var(--texte-doux); }
.categories { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.tuile { min-height: 96px; padding: 12px; border-radius: 16px; color: var(--marine); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; text-align: center; font-weight: 500; text-decoration: none; }
.initiale { width: 40px; height: 40px; border-radius: 50%; background: var(--blanc); display: flex; align-items: center; justify-content: center; font-family: "Playfair Display", serif; font-weight: 700; font-size: 20px; }
.entete-bloc { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
.entete-bloc h2 { margin: 0; }
.tout { min-height: 44px; display: flex; align-items: center; color: var(--marine); font-weight: 600; text-decoration: underline; }
.produits { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
/* Engagements : une carte par garantie, avec une icône dans une pastille dorée */
.garanties { display: grid; gap: 16px; }
.garantie { display: flex; align-items: flex-start; gap: 16px; padding: 20px; background: var(--blanc); border: 1px solid var(--bordure); border-top: 3px solid var(--or); border-radius: 16px; transition: transform 0.2s ease, box-shadow 0.2s ease; }
.garantie:hover { transform: translateY(-3px); box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08); }
.icone { flex: none; width: 52px; height: 52px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: color-mix(in srgb, var(--or) 20%, transparent); color: var(--marine); }
.garantie h3 { margin: 0 0 6px; font-size: 18px; }
.garantie p { margin: 0; font-size: 14px; line-height: 1.6; color: var(--texte-doux); }
@media (prefers-reduced-motion: reduce) { .garantie, .garantie:hover { transition: none; transform: none; } }
@media (min-width: 768px) { .hero { min-height: 480px; background: linear-gradient(90deg, rgba(27, 42, 74, 0.85) 0%, rgba(27, 42, 74, 0.6) 55%, rgba(27, 42, 74, 0.2) 100%), var(--photo) center 10% / cover no-repeat; } .hero h1 { font-size: 44px; } .interieur { padding: 64px 32px; } .categories { grid-template-columns: repeat(3, 1fr); } .produits { grid-template-columns: repeat(3, 1fr); gap: 24px; } .garanties { grid-template-columns: repeat(3, 1fr); gap: 24px; } .garantie { flex-direction: column; padding: 28px; } }
/* Grand écran : la photo entière (format 16/9) est placée à droite et se fond dans le bleu marine à gauche, là où se trouve le texte */
@media (min-width: 1024px) {
  .hero { min-height: min(560px, 56vw); background: #1B2A4A; position: relative; isolation: isolate; overflow: hidden; }
  .hero::before { content: ""; position: absolute; top: 0; right: 0; bottom: 0; aspect-ratio: 16 / 9; z-index: -2; background: var(--photo) right top / cover no-repeat; -webkit-mask-image: linear-gradient(90deg, transparent 0, #000 35%); mask-image: linear-gradient(90deg, transparent 0, #000 35%); }
  .hero::after { content: ""; position: absolute; inset: 0; z-index: -1; background: linear-gradient(90deg, rgba(27, 42, 74, 0.75) 0%, rgba(27, 42, 74, 0.4) 50%, rgba(27, 42, 74, 0) 80%); }
}
@media (min-width: 1024px) { .hero h1 { font-size: 52px; } .categories { grid-template-columns: repeat(6, 1fr); } }
</style>
