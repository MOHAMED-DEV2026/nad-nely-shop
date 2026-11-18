// Envoi d'image (produit ou catégorie) : JPG, PNG ou WEBP, 5 Mo maximum
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// L'extension vient du type du fichier (et non du nom choisi par l'utilisateur)
const EXTENSIONS = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

const stockage = multer.diskStorage({
  destination: path.join(__dirname, '..', '..', 'uploads'),
  // Nom aléatoire : on ne garde jamais le nom du fichier envoyé par l'utilisateur
  filename: (req, file, cb) => {
    cb(null, crypto.randomBytes(16).toString('hex') + EXTENSIONS[file.mimetype]);
  },
});

const upload = multer({
  storage: stockage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = Object.keys(EXTENSIONS).includes(file.mimetype);
    cb(ok ? null : new Error('FORMAT_IMAGE'), ok);
  },
});

module.exports = upload;
