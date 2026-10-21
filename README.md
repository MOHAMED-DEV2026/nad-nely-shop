# NAD-NELY Shop

Site e-commerce (vêtements, chaussures, sacs, parfums, cosmétiques, beauté) - Mamoudzou, Mayotte.
Projet de fin de formation DWWM 2026 - SAID ATTOUMANE Mohamed.

## Structure

- `database/` : `schema.sql` (6 tables) et `seed.sql` (données d'exemple)
- `backend/`  : API REST Node.js / Express (phase 6)
- `frontend/` : application Vue.js 3 + Vite (phase 7)

## Phase 5 - Créer la base de données

1. Installer MySQL ou MariaDB, puis DBeaver.
2. Dans un terminal, depuis ce dossier :

```
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

3. Dans DBeaver, ouvrir la base `nad_nely_shop` : 6 tables, 6 catégories, 8 produits d'exemple.

## Git

```
git init
git add .
git commit -m "Phase 5 : base de données"
```
