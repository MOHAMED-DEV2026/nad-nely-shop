const jwt = require('jsonwebtoken');

// Vérifie que l'utilisateur est connecté (jeton valide dans l'en-tête Authorization: Bearer ...)
function exigerConnexion(req, res, next) {
  const entete = req.headers.authorization || '';
  const token = entete.startsWith('Bearer ') ? entete.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Connexion requise' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Session expirée ou invalide' });
  }
}

// Vérifie que l'utilisateur est administrateur (à utiliser après exigerConnexion)
function exigerAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Accès réservé à l’administrateur' });
  next();
}

module.exports = { exigerConnexion, exigerAdmin };
