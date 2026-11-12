// Si un paramètre d'adresse est répété (?marque=a&marque=b), on garde la dernière valeur :
// sans cela, la requête SQL recevrait un tableau et renverrait une erreur 500.
function requeteSimple(req, res, next) {
  const propre = {};
  for (const [cle, valeur] of Object.entries(req.query)) {
    propre[cle] = Array.isArray(valeur) ? valeur[valeur.length - 1] : valeur;
  }
  Object.defineProperty(req, 'query', { value: propre, writable: true, configurable: true });
  next();
}

module.exports = requeteSimple;
