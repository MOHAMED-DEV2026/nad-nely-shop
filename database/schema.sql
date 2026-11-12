-- NAD-NELY Shop : schéma de la base de données (MySQL / MariaDB)
-- Installation : mysql -u root -p < database/schema.sql
CREATE DATABASE IF NOT EXISTS nadnely_shop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE nadnely_shop;
SET FOREIGN_KEY_CHECKS = 0;
CREATE TABLE IF NOT EXISTS `categorie` (
  `id_categorie` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `nom` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id_categorie`),
  UNIQUE KEY `uq_categorie_nom` (`nom`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `commande` (
  `id_commande` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `date_commande` datetime NOT NULL DEFAULT current_timestamp(),
  `statut` enum('en_attente','confirmee','expediee','livree','annulee') NOT NULL DEFAULT 'en_attente',
  `mode_reception` enum('livraison','retrait') NOT NULL,
  `adresse_livraison` varchar(255) DEFAULT NULL,
  `commune_livraison` varchar(50) DEFAULT NULL,
  `telephone_contact` varchar(20) NOT NULL,
  `montant_total` decimal(10,2) NOT NULL,
  `id_utilisateur` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id_commande`),
  KEY `fk_commande_utilisateur` (`id_utilisateur`),
  KEY `idx_commande_statut` (`statut`),
  KEY `idx_commande_date` (`date_commande`),
  CONSTRAINT `fk_commande_utilisateur` FOREIGN KEY (`id_utilisateur`) REFERENCES `utilisateur` (`id_utilisateur`) ON UPDATE CASCADE,
  CONSTRAINT `chk_commande_montant` CHECK (`montant_total` > 0),
  CONSTRAINT `chk_commande_reception` CHECK (`mode_reception` = 'livraison' and `adresse_livraison` is not null and `commune_livraison` is not null or `mode_reception` = 'retrait' and `adresse_livraison` is null and `commune_livraison` is null)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `ligne_commande` (
  `id_commande` int(10) unsigned NOT NULL,
  `id_produit` int(10) unsigned NOT NULL,
  `quantite` int(11) NOT NULL,
  `prix_unitaire` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id_commande`,`id_produit`),
  KEY `fk_ligne_produit` (`id_produit`),
  CONSTRAINT `fk_ligne_commande` FOREIGN KEY (`id_commande`) REFERENCES `commande` (`id_commande`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ligne_produit` FOREIGN KEY (`id_produit`) REFERENCES `produit` (`id_produit`) ON UPDATE CASCADE,
  CONSTRAINT `chk_ligne_quantite` CHECK (`quantite` > 0),
  CONSTRAINT `chk_ligne_prix` CHECK (`prix_unitaire` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `paiement` (
  `id_paiement` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `montant` decimal(10,2) NOT NULL,
  `statut` enum('en_attente','valide','echoue','rembourse') NOT NULL DEFAULT 'en_attente',
  `moyen` varchar(30) NOT NULL DEFAULT 'carte',
  `reference_transaction` varchar(255) DEFAULT NULL,
  `date_paiement` datetime DEFAULT NULL,
  `id_commande` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id_paiement`),
  UNIQUE KEY `uq_paiement_commande` (`id_commande`),
  CONSTRAINT `fk_paiement_commande` FOREIGN KEY (`id_commande`) REFERENCES `commande` (`id_commande`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_paiement_montant` CHECK (`montant` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `produit` (
  `id_produit` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `nom` varchar(100) NOT NULL,
  `description` text NOT NULL,
  `prix` decimal(10,2) NOT NULL,
  `stock` int(11) NOT NULL DEFAULT 0,
  `image` varchar(255) DEFAULT NULL,
  `marque` varchar(50) DEFAULT NULL,
  `origine` varchar(50) DEFAULT NULL,
  `public_cible` enum('femme','homme','mixte') NOT NULL DEFAULT 'mixte',
  `date_fabrication` date DEFAULT NULL,
  `date_expiration` date DEFAULT NULL,
  `actif` tinyint(1) NOT NULL DEFAULT 1,
  `date_ajout` datetime NOT NULL DEFAULT current_timestamp(),
  `id_categorie` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id_produit`),
  KEY `fk_produit_categorie` (`id_categorie`),
  KEY `idx_produit_nom` (`nom`),
  CONSTRAINT `fk_produit_categorie` FOREIGN KEY (`id_categorie`) REFERENCES `categorie` (`id_categorie`) ON UPDATE CASCADE,
  CONSTRAINT `chk_produit_prix` CHECK (`prix` > 0),
  CONSTRAINT `chk_produit_stock` CHECK (`stock` >= 0),
  CONSTRAINT `chk_produit_dates` CHECK (`date_fabrication` is null or `date_expiration` is null or `date_fabrication` < `date_expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `utilisateur` (
  `id_utilisateur` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `nom` varchar(50) NOT NULL,
  `prenom` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `mot_de_passe` varchar(255) NOT NULL,
  `telephone` varchar(20) DEFAULT NULL,
  `role` enum('client','admin') NOT NULL DEFAULT 'client',
  `code_reinitialisation` varchar(255) DEFAULT NULL,
  `expiration_code` datetime DEFAULT NULL,
  `date_inscription` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_utilisateur`),
  UNIQUE KEY `uq_utilisateur_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


SET FOREIGN_KEY_CHECKS = 1;
