require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();

app.use(cors({ origin: process.env.FRONT_URL }));
app.use(express.json());

// Limite les tentatives sur l'inscription et la connexion (protection contre le piratage par essais)
const limiteAuth = rateLimit({ windowMs: 15 * 60 * 1000, max: 30 });

app.get('/api/sante', (req, res) => res.json({ ok: true }));
app.use('/api/auth', limiteAuth, require('./routes/auth'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/produits', require('./routes/produits'));
app.use('/api/commandes', require('./routes/commandes'));
app.use('/api/admin/produits', require('./routes/admin-produits'));
app.use('/api/admin/categories', require('./routes/admin-categories'));
app.use('/api/admin/commandes', require('./routes/admin-commandes'));
app.use('/api/admin/tableau-de-bord', require('./routes/admin-tableau-de-bord'));

// Images des produits (fichiers du dossier uploads)
app.use('/uploads', express.static(require('path').join(__dirname, '..', 'uploads')));

// Route inconnue
app.use((req, res) => res.status(404).json({ message: 'Route introuvable' }));

// Erreur inattendue : on ne montre jamais le détail technique au client
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Erreur du serveur' });
});

const port = process.env.PORT || 3000;
app.listen(port, (erreur) => {
  // Express 5 transmet l'erreur de démarrage (par exemple port déjà utilisé) à cette fonction
  if (erreur) {
    console.error('Impossible de démarrer le serveur :', erreur.message);
    process.exit(1);
  }
  console.log(`API NAD-NELY Shop sur http://localhost:${port}`);
});
