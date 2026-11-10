<script setup>
import { ref, onMounted } from "vue";
import { appelerApi } from "../../services/api.js";
import CarteProduit from "../../components/CarteProduit.vue";
// Photo du hero : pour en changer, remplacer hero1.jpg par hero2.jpg ou hero3.jpg
import photoHero from "../../assets/hero2.jpg";

const categories = ref([]);
const nouveautes = ref([]);
const TEINTES = ["var(--rose)", "var(--fond-beige)", "var(--fond-bleu-clair)"];

const GARANTIES = [
  { titre: "Paiement sécurisé", texte: "Règlement par carte via Stripe. Aucune donnée bancaire n'est stockée sur le site." },
  { titre: "Livraison ou retrait", texte: "Livraison dans les 17 communes de Mayotte, ou retrait (lieu et horaire convenus par téléphone)." },
  { titre: "Suivi de commande", texte: "Suivez chaque étape depuis votre compte, de la confirmation à la livraison." },
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
      <div class="garanties">
        <div v-for="g in GARANTIES" :key="g.titre"><h3>{{ g.titre }}</h3><p>{{ g.texte }}</p></div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* Photo en fond, voile bleu marine par-dessus pour que le texte reste lisible sur n'importe quelle photo */
.hero { min-height: 400px; display: flex; align-items: center; color: var(--blanc); background: linear-gradient(rgba(27, 42, 74, 0.72), rgba(27, 42, 74, 0.72)), var(--photo) center 10% / cover no-repeat; }
.interieur { width: 100%; max-width: var(--largeur-max); margin: 0 auto; padding: 40px 16px; }
.lieu { margin: 0 0 8px; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: var(--or); font-weight: 600; }
.hero h1 { font-size: 32px; line-height: 1.15; margin: 0 0 12px; color: var(--blanc); max-width: 620px; }
.texte { margin: 0 0 24px; max-width: 520px; color: var(--creme); }
.hero .bouton-contour { color: var(--blanc); border-color: var(--blanc); background: transparent; }
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
.garanties { display: grid; gap: 16px; background: var(--blanc); border: 1px solid var(--bordure); border-radius: 16px;padding: 20px; }
.garanties h3 { margin: 0 0 4px; font-size: 18px; }
.garanties p { margin: 0; font-size: 14px; color: var(--texte-doux); }
@media (min-width: 768px) { .hero { min-height: 480px; background: linear-gradient(90deg, rgba(27, 42, 74, 0.85) 0%, rgba(27, 42, 74, 0.6) 55%, rgba(27, 42, 74, 0.2) 100%), var(--photo) center 10% / cover no-repeat; } .hero h1 { font-size: 44px; } .interieur { padding: 64px 32px; } .categories { grid-template-columns: repeat(3, 1fr); } .produits { grid-template-columns: repeat(3, 1fr); gap: 24px; } .garanties { grid-template-columns: repeat(3, 1fr); padding: 32px; } }
@media (min-width: 1024px) { .hero { min-height: 540px; } .hero h1 { font-size: 52px; } .categories { grid-template-columns: repeat(6, 1fr); } }
</style>
