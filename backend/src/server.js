// Démarrage du serveur (la configuration de l'application est dans app.js).
const app = require('./app');

const port = process.env.PORT || 3000;
app.listen(port, (erreur) => {
  // Express 5 transmet l'erreur de démarrage (par exemple port déjà utilisé) à cette fonction
  if (erreur) {
    console.error('Impossible de démarrer le serveur :', erreur.message);
    process.exit(1);
  }
  console.log(`API NAD-NELY Shop sur http://localhost:${port}`);
});
