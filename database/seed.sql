-- NAD-NELY Shop : données de départ (les 6 catégories de la boutique)
-- Utilisation : mysql -u root -p < database/seed.sql
-- Le compte administrateur se crée avec : npm run creer-admin (dans le dossier backend)
USE nadnely_shop;
INSERT IGNORE INTO categorie (id_categorie, nom, description) VALUES
 (1, 'Vêtements', 'Vêtements pour femme et homme'),
 (2, 'Chaussures', 'Chaussures pour femme et homme'),
 (3, 'Parfums', 'Parfums et eaux de toilette'),
 (4, 'Produits de beauté', 'Soins du visage et du corps'),
 (5, 'Cosmétiques', 'Maquillage et cosmétiques'),
 (6, 'Sacs', 'Sacs à main et accessoires');
