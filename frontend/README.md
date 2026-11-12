# NAD-NELY Shop : frontend

Application Vue 3 (Vite). Elle appelle l'API du dossier `backend`.

```
npm install
npm run dev      # http://localhost:5173
npm run build    # version de production dans dist/
```

Avant de lancer, copier `.env.example` en `.env` (adresse de l'API, `VITE_API_URL`).

Organisation : `src/views/public` (pages client), `src/views/admin` (espace administrateur),
`src/components`, `src/stores`, `src/services/api.js`.
