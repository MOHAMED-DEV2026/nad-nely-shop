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
const requeteSimple = require('./middlewares/requeteSimple');

const app = express();

app.use(cors({ origin: process.env.FRONT_URL }));
app.use(express.json());
app.use(requeteSimple);
app.use(requestLogger);

// Limite les tentatives sur l'inscription et la connexion (protection contre le piratage par essais)
const MESSAGE_TROP_DE_TENTATIVES = { message: 'Trop de tentatives, réessayez dans quelques minutes' };
const limiteAuth = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: MESSAGE_TROP_DE_TENTATIVES });
// BNF08 : 5 connexions ratées maximum par 15 minutes et par adresse IP (les connexions réussies ne comptent pas)
const limiteConnexion = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, skipSuccessfulRequests: true, message: MESSAGE_TROP_DE_TENTATIVES });

app.get('/api/sante', (req, res) => res.json({ ok: true }));
app.use('/api/auth/connexion', limiteConnexion);
app.use('/api/auth', limiteAuth, require('./routes/auth.routes'));
app.use('/api', require('./routes/catalogue.routes'));
app.use('/api/commandes', require('./routes/commande.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/paiements', require('./routes/paiement.routes'));
app.use('/api/compte', require('./routes/compte.routes'));

// Images des produits (fichiers du dossier uploads)
// Servies sous /api/uploads : en production (alwaysdata) seul le chemin /api est envoyé au backend
const dossierUploads = express.static(path.join(__dirname, '..', 'uploads'));
app.use('/api/uploads', dossierUploads);
app.use('/uploads', dossierUploads);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
