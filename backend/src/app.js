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
app.use('/api/auth', limiteAuth, require('./routes/auth'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/produits', require('./routes/produits'));
app.use('/api/commandes', require('./routes/commandes'));
app.use('/api/admin/produits', require('./routes/admin-produits'));
app.use('/api/admin/categories', require('./routes/admin-categories'));
app.use('/api/admin/commandes', require('./routes/admin-commandes'));
app.use('/api/paiements', require('./routes/paiements'));
app.use('/api/admin/tableau-de-bord', require('./routes/admin-tableau-de-bord'));
app.use('/api/admin/utilisateurs', require('./routes/admin-utilisateurs'));
app.use('/api/compte', require('./routes/compte'));

// Images des produits (fichiers du dossier uploads)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
