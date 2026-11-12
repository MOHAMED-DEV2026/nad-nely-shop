# NAD-NELY Shop

Boutique en ligne basée à Mamoudzou (Mayotte) : vêtements, chaussures, sacs, parfums et cosmétiques.
Projet de fin de formation Développeur Web & Web Mobile (promotion 2026, Aloalo Mayotte Compétences).

## Technologies

- Frontend : Vue 3 + Vite
- Backend : Node.js + Express 5 (API REST)
- Base de données : MySQL / MariaDB
- Paiement : Stripe Checkout (mode test) — E-mails de test : Mailtrap

## Organisation du dépôt

```
backend/    API : routes → middlewares → controllers → services → models
database/   schema.sql (tables) et seed.sql (catégories de départ)
frontend/   Application Vue (pages publiques et espace administrateur)
```

## Installation

Prérequis : Node.js 20 ou plus, MySQL ou MariaDB.

1. **Base de données** (depuis le dossier du projet) :
   ```
   mysql -u root -p --default-character-set=utf8mb4 -e "source database/schema.sql"
   mysql -u root -p --default-character-set=utf8mb4 -e "source database/seed.sql"
   ```
2. **Backend** :
   ```
   cd backend
   npm install
   ```
   Copier `.env.example` en `.env`, puis remplir les valeurs (base, `JWT_SECRET`, clé Stripe de test, Mailtrap).
   Créer le compte administrateur : `npm run creer-admin`
3. **Frontend** :
   ```
   cd frontend
   npm install
   ```
   Copier `.env.example` en `.env` (adresse de l'API).

## Lancement

Deux terminaux :

```
cd backend  && npm run dev     # API sur http://localhost:3000
cd frontend && npm run dev     # site sur http://localhost:5173
```

Paiement de test Stripe : carte `4242 4242 4242 4242`, date future, code `123`.
