-- Vérification de l'adresse e-mail à l'inscription (code à 6 chiffres envoyé par e-mail).
-- À exécuter une seule fois sur une base existante (en local et sur alwaysdata).
-- Les comptes déjà créés sont considérés comme vérifiés ; les nouveaux comptes ne le sont pas.
ALTER TABLE utilisateur
  ADD COLUMN email_verifie TINYINT(1) NOT NULL DEFAULT 1 AFTER role,
  ADD COLUMN code_verification VARCHAR(255) NULL AFTER email_verifie,
  ADD COLUMN expiration_verification DATETIME NULL AFTER code_verification;
ALTER TABLE utilisateur ALTER COLUMN email_verifie SET DEFAULT 0;
