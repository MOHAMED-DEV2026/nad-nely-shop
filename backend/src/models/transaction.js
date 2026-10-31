// Exécute une suite d'opérations SQL dans une transaction : tout réussit ensemble, ou rien n'est enregistré.
// La fonction reçoit une connexion. Si elle renvoie { success: false }, ou si elle lève une erreur,
// la transaction est annulée (rollback). Sinon elle est validée (commit).
const db = require('../config/db');

async function enTransaction(fonction) {
  const connexion = await db.getConnection();
  try {
    await connexion.beginTransaction();
    const resultat = await fonction(connexion);
    if (resultat && resultat.success === false) await connexion.rollback();
    else await connexion.commit();
    return resultat;
  } catch (e) {
    await connexion.rollback();
    throw e;
  } finally {
    connexion.release();
  }
}

module.exports = { enTransaction };
