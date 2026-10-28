const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/db');
const { stripe } = require('../config/stripe');
const { exigerConnexion } = require('../middlewares/auth');

// POST /api/paiements/verification : vérifie le paiement auprès de Stripe puis confirme la commande (BF18)
// Corps attendu : { "session_id": "cs_test_..." }
// Le navigateur ne décide de rien : c'est le serveur qui interroge Stripe (RG37).
router.post(
  '/verification',
  exigerConnexion,
  [body('session_id').isString().matches(/^cs_(test|live)_[A-Za-z0-9]+$/).withMessage('Identifiant de session invalide')],
  async (req, res, next) => {
    const erreurs = validationResult(req);
    if (!erreurs.isEmpty()) return res.status(400).json({ erreurs: erreurs.array() });

    try {
      // 1. On demande à Stripe l'état réel de la session de paiement
      let session;
      try {
        session = await stripe.checkout.sessions.retrieve(req.body.session_id);
      } catch (erreurStripe) {
        return res.status(404).json({ message: 'Session de paiement introuvable' });
      }

      const idCommande = Number(session.metadata && session.metadata.id_commande);
      if (!idCommande) return res.status(404).json({ message: 'Session de paiement introuvable' });

      const [rows] = await db.query(
        'SELECT id_utilisateur, montant_total, statut FROM commande WHERE id_commande = ?', [idCommande]
      );
      if (rows.length === 0) return res.status(404).json({ message: 'Commande introuvable' });
      // La commande doit appartenir au client connecté
      if (rows[0].id_utilisateur !== req.user.id) return res.status(403).json({ message: 'Accès refusé' });

      // 2. Le paiement doit être réussi, et le montant doit être exact (RG36, RG37)
      if (session.payment_status !== 'paid') {
        return res.status(409).json({ message: 'Le paiement n’a pas abouti', statut: rows[0].statut });
      }
      const montantAttendu = Math.round(Number(rows[0].montant_total) * 100);
      if (session.amount_total !== montantAttendu || session.currency !== 'eur') {
        return res.status(409).json({ message: 'Le montant payé ne correspond pas à la commande' });
      }

      // 3. Confirmation dans une transaction qui verrouille la commande et les produits
      const connexion = await db.getConnection();
      try {
        await connexion.beginTransaction();

        // Si la page est rechargée, on ne confirme pas deux fois (stock décrémenté une seule fois)
        const [[commande]] = await connexion.query(
          'SELECT statut FROM commande WHERE id_commande = ? FOR UPDATE', [idCommande]
        );
        if (commande.statut !== 'en_attente') {
          await connexion.commit();
          return res.json({ id_commande: idCommande, statut: commande.statut });
        }

        // Verrouille les produits et vérifie que le stock suffit encore (RG39)
        const [lignes] = await connexion.query(
          `SELECT lc.id_produit, lc.quantite, p.stock
             FROM ligne_commande lc JOIN produit p ON p.id_produit = lc.id_produit
            WHERE lc.id_commande = ? FOR UPDATE`,
          [idCommande]
        );
        const stockSuffisant = lignes.every((l) => l.stock >= l.quantite);

        // Le paiement est enregistré dans tous les cas : la référence Stripe sert au remboursement (RG40)
        await connexion.query(
          "UPDATE paiement SET statut = 'valide', date_paiement = NOW(), reference_transaction = ? WHERE id_commande = ?",
          [session.id, idCommande]
        );

        if (!stockSuffisant) {
          // RG39 : stock devenu insuffisant, la commande est annulée, remboursement manuel depuis Stripe
          await connexion.query("UPDATE commande SET statut = 'annulee' WHERE id_commande = ?", [idCommande]);
          await connexion.commit();
          return res.status(409).json({
            message: 'Stock devenu insuffisant : la commande est annulée. Le remboursement se fait manuellement depuis Stripe.',
            id_commande: idCommande,
            statut: 'annulee',
          });
        }

        // RG38 : le stock est décrémenté au moment de la confirmation
        for (const l of lignes) {
          await connexion.query('UPDATE produit SET stock = stock - ? WHERE id_produit = ?', [l.quantite, l.id_produit]);
        }
        await connexion.query("UPDATE commande SET statut = 'confirmee' WHERE id_commande = ?", [idCommande]);

        await connexion.commit();
        res.json({ id_commande: idCommande, statut: 'confirmee', message: 'Paiement confirmé' });
      } catch (e) {
        await connexion.rollback();
        throw e;
      } finally {
        connexion.release();
      }
    } catch (e) { next(e); }
  }
);

module.exports = router;