-- =====================================================================
-- NAD-NELY Shop - création de la base de données (MPD v4)
-- SGBD : MySQL / MariaDB
-- Base sur le MPD v2 (6 tables), avec 4 ajouts demandés par les maquettes :
--   UTILISATEUR.telephone, CATEGORIE.description,
--   PRODUIT.actif (RG13 : un produit commandé est désactivé, jamais supprimé),
--   COMMANDE.commune_livraison (17 communes de Mayotte)
-- =====================================================================

DROP DATABASE IF EXISTS nad_nely_shop;

CREATE DATABASE nad_nely_shop
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE nad_nely_shop;

CREATE TABLE UTILISATEUR (
    id_utilisateur   INT AUTO_INCREMENT PRIMARY KEY,
    nom              VARCHAR(50)  NOT NULL,
    prenom           VARCHAR(50)  NOT NULL,
    email            VARCHAR(100) NOT NULL,
    telephone        VARCHAR(20)  NULL,
    mot_de_passe     VARCHAR(255) NOT NULL,
    role             ENUM('client', 'admin') NOT NULL DEFAULT 'client',
    date_inscription DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_utilisateur_email UNIQUE (email)
) ENGINE = InnoDB;

CREATE TABLE CATEGORIE (
    id_categorie  INT AUTO_INCREMENT PRIMARY KEY,
    nom_categorie VARCHAR(50) NOT NULL,
    description   VARCHAR(255) NULL,
    CONSTRAINT uq_categorie_nom UNIQUE (nom_categorie)
) ENGINE = InnoDB;

CREATE TABLE PRODUIT (
    id_produit       INT AUTO_INCREMENT PRIMARY KEY,
    nom_produit      VARCHAR(100) NOT NULL,
    description      TEXT NULL,
    prix             DECIMAL(10,2) NOT NULL,
    stock            INT NOT NULL DEFAULT 0,
    image            VARCHAR(255) NULL,
    actif            TINYINT(1) NOT NULL DEFAULT 1,
    id_categorie     INT NOT NULL,
    date_fabrication DATE NULL,
    date_expiration  DATE NULL,
    marque           VARCHAR(50) NULL,
    origine          VARCHAR(50) NULL,
    public_cible     ENUM('femme','homme','mixte') NOT NULL DEFAULT 'mixte',
    CONSTRAINT fk_produit_categorie
        FOREIGN KEY (id_categorie) REFERENCES CATEGORIE (id_categorie)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_produit_prix CHECK (prix >= 0),
    CONSTRAINT chk_produit_stock CHECK (stock >= 0),
    CONSTRAINT chk_produit_dates
        CHECK (date_fabrication IS NULL OR date_expiration IS NULL OR date_fabrication < date_expiration)
) ENGINE = InnoDB;

CREATE TABLE COMMANDE (
    id_commande       INT AUTO_INCREMENT PRIMARY KEY,
    id_utilisateur    INT NOT NULL,
    date_commande     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    mode_reception    ENUM('livraison', 'retrait') NOT NULL,
    adresse_livraison VARCHAR(255) NULL,
    commune_livraison VARCHAR(50)  NULL,
    montant_total     DECIMAL(10,2) NOT NULL,
    statut_commande   ENUM('en_attente', 'confirmee', 'expediee', 'livree', 'annulee')
                      NOT NULL DEFAULT 'en_attente',
    CONSTRAINT fk_commande_utilisateur
        FOREIGN KEY (id_utilisateur) REFERENCES UTILISATEUR (id_utilisateur)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_commande_montant CHECK (montant_total >= 0),
    CONSTRAINT chk_commande_adresse
        CHECK (mode_reception = 'retrait' OR (adresse_livraison IS NOT NULL AND commune_livraison IS NOT NULL))
) ENGINE = InnoDB;

CREATE TABLE LIGNE_COMMANDE (
    id_ligne_commande INT AUTO_INCREMENT PRIMARY KEY,
    id_commande       INT NOT NULL,
    id_produit        INT NOT NULL,
    quantite          INT NOT NULL,
    prix_unitaire     DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_ligne_commande
        FOREIGN KEY (id_commande) REFERENCES COMMANDE (id_commande)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_ligne_produit
        FOREIGN KEY (id_produit) REFERENCES PRODUIT (id_produit)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_ligne_quantite CHECK (quantite > 0),
    CONSTRAINT chk_ligne_prix CHECK (prix_unitaire >= 0)
) ENGINE = InnoDB;

CREATE TABLE PAIEMENT (
    id_paiement           INT AUTO_INCREMENT PRIMARY KEY,
    id_commande           INT NOT NULL,
    montant               DECIMAL(10,2) NOT NULL,
    statut_paiement       ENUM('en_attente', 'valide', 'echoue', 'rembourse')
                          NOT NULL DEFAULT 'en_attente',
    reference_transaction VARCHAR(100) NULL,
    date_paiement         DATETIME NULL,
    CONSTRAINT fk_paiement_commande
        FOREIGN KEY (id_commande) REFERENCES COMMANDE (id_commande)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT uq_paiement_commande UNIQUE (id_commande),
    CONSTRAINT chk_paiement_montant CHECK (montant >= 0)
) ENGINE = InnoDB;

CREATE INDEX idx_produit_nom ON PRODUIT (nom_produit);
CREATE INDEX idx_produit_categorie ON PRODUIT (id_categorie);
CREATE INDEX idx_commande_utilisateur ON COMMANDE (id_utilisateur);
CREATE INDEX idx_commande_statut ON COMMANDE (statut_commande);
