-- Photo des catégories (affichée sur la page d'accueil), choisie depuis l'administration.
-- À exécuter une seule fois sur une base existante (en local et sur alwaysdata).
ALTER TABLE categorie ADD COLUMN image VARCHAR(255) NULL AFTER description;
