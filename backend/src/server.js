// Démarrage du serveur (la configuration de l'application est dans app.js).
const app = require('./app');

// Sans clé secrète, les jetons de connexion ne peuvent pas être signés : on arrête tout de suite
if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET manquant dans le fichier .env : démarrage impossible.');
  process.exit(1);
}

const port = process.env.PORT || 3000;
app.listen(port, (erreur) => {
  // Express 5 transmet l'erreur de démarrage (par exemple port déjà utilisé) à cette fonction
  if (erreur) {
    console.error('Impossible de démarrer le serveur :', erreur.message);
    process.exit(1);
  }
  console.log(`API NAD-NELY Shop sur http://localhost:${port}`);
});
