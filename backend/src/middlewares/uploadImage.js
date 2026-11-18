// Envoi du fichier image d'un produit ou d'une catégorie, avec un message clair en cas de format ou de taille refusés.
const upload = require('./upload');

function envoyerImage(req, res, next) {
  upload.single('image')(req, res, (err) => {
    if (!err) return next();
    const message = err.message === 'FORMAT_IMAGE'
      ? 'Image : formats acceptés JPG, PNG ou WEBP'
      : 'Image : 2 Mo maximum';
    res.status(400).json({ message });
  });
}

module.exports = envoyerImage;
