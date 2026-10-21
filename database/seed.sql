-- =====================================================================
-- Données d'exemple (développement uniquement)
-- Les produits sont fictifs : noms, prix et stocks à remplacer par ceux de la boutique.
-- Les comptes (admin et client) sont créés plus tard par un script Node,
-- car le mot de passe doit être haché avec bcrypt (jamais en clair dans le SQL).
-- =====================================================================

USE nad_nely_shop;

INSERT INTO CATEGORIE (nom_categorie, description) VALUES
    ('Vêtements',          'Robes, hauts, pantalons'),
    ('Chaussures',         'Baskets, sandales'),
    ('Sacs',               'Sacs à main et sacs de voyage'),
    ('Parfums',            'Eaux de parfum'),
    ('Cosmétiques',        'Maquillage'),
    ('Produits de beauté', 'Soins du visage et du corps');

INSERT INTO PRODUIT (nom_produit, description, prix, stock, id_categorie, marque, origine, date_fabrication, date_expiration) VALUES
    ('Robe fleurie (exemple)',        'Robe légère, tissu fluide.',        29.90, 12, 1, NULL, NULL, NULL, NULL),
    ('T-shirt coton (exemple)',       'T-shirt basique en coton.',         14.90, 25, 1, NULL, NULL, NULL, NULL),
    ('Baskets blanches (exemple)',    'Baskets confortables.',             49.90,  8, 2, NULL, NULL, NULL, NULL),
    ('Sandales plates (exemple)',     'Sandales pour la saison chaude.',   24.90, 15, 2, NULL, NULL, NULL, NULL),
    ('Sac à main (exemple)',          'Sac à main grand format.',          39.90,  6, 3, NULL, NULL, NULL, NULL),
    ('Eau de parfum 100 ml (exemple)','Parfum floral.',                    59.90, 10, 4, '[Marque]', '[Pays]', '2026-01-15', '2029-01-15'),
    ('Rouge à lèvres mat (exemple)',  'Rouge à lèvres longue tenue.',      12.50, 30, 5, '[Marque]', '[Pays]', '2026-02-01', '2028-02-01'),
    ('Crème hydratante (exemple)',    'Soin hydratant visage (en rupture).', 18.50, 0, 6, '[Marque]', '[Pays]', '2026-03-01', '2028-03-01');
