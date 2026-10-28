// Envoi d'image produit : JPG, PNG ou WEBP, 2 Mo maximum
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const stockage = multer.diskStorage({
  destination: path.join(__dirname, '..', '..', 'uploads'),
  // Nom aléatoire : on ne garde jamais le nom du fichier envoyé par l'utilisateur
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, crypto.randomBytes(16).toString('hex') + ext);
  },
});

const upload = multer({
  storage: stockage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype);
    cb(ok ? null : new Error('FORMAT_IMAGE'), ok);
  },
});

module.exports = upload;
