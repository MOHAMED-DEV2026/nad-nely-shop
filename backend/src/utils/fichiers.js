// Gestion des fichiers du dossier uploads (images des produits).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DOSSIER_UPLOADS = path.join(__dirname, '..', '..', 'uploads');

// Supprime une image du disque. Si le fichier n'existe plus, on ne fait rien (pas d'erreur).
function supprimerImage(nomFichier) {
  if (!nomFichier) return;
  fs.unlink(path.join(DOSSIER_UPLOADS, nomFichier), () => {});
}

// « Empreinte » d'une image : deux fichiers identiques (même photo) ont la même empreinte,
// même si leurs noms sont différents. Renvoie null si le fichier est introuvable.
function empreinte(nomFichier) {
  try {
    return crypto.createHash('sha256').update(fs.readFileSync(path.join(DOSSIER_UPLOADS, nomFichier))).digest('hex');
  } catch (e) {
    return null;
  }
}

module.exports = { supprimerImage, empreinte };
