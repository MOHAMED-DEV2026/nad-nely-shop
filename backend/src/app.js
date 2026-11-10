// Configuration de l'application Express : middlewares, routes, gestion des erreurs.
// (Le démarrage du serveur est dans server.js.)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

const requestLogger = require('./middlewares/requestLogger');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(cors({ origin: process.env.FRONT_URL }));
app.use(express.json());
app.use(requestLogger);

// Limite les tentatives sur l'inscription et la connexion (protection contre le piratage par essais)
const limiteAuth = rateLimit({ windowMs: 15 * 60 * 1000, max: 30 });

app.get('/api/sante', (req, res) => res.json({ ok: true }));
app.use('/api/auth', limiteAuth, require('./routes/auth.routes'));
app.use('/api', require('./routes/catalogue.routes'));
app.use('/api/commandes', require('./routes/commande.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/paiements', require('./routes/paiement.routes'));
app.use('/api/compte', require('./routes/compte.routes'));

// Images des produits (fichiers du dossier uploads)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
