const { PrismaClient } = require('@prisma/client');
const paymentService = require('../services/payment.service');
const AppError = require('../utils/AppError');
const crypto = require('crypto');

const prisma = new PrismaClient();

/**
 * Initialise une transaction de paiement
 */
const createPayment = async (req, res, next) => {
  try {
    const { movieId } = req.body;
    const userId = req.user.id;

    if (!movieId) {
      return next(new AppError('Veuillez fournir un ID de film.', 400));
    }

    const movie = await prisma.movie.findUnique({ where: { id: movieId } });
    if (!movie) return next(new AppError('Film non trouve.', 404));

    const completedPurchase = await prisma.purchase.findFirst({
      where: { userId, movieId, status: 'COMPLETED' }
    });
    if (completedPurchase) {
      return next(new AppError('Vous avez deja achete ce film.', 400));
    }

    const transactionId = `TRX-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

    await prisma.purchase.upsert({
      where: {
        userId_movieId_status: {
          userId,
          movieId,
          status: 'PENDING'
        }
      },
      update: {
        transactionId,
        amount: movie.price,
        updatedAt: new Date()
      },
      create: {
        userId,
        movieId,
        amount: movie.price,
        transactionId,
        status: 'PENDING'
      }
    });

    const paymentData = await paymentService.initPayment({
      transactionId,
      amount: movie.price,
      description: `Achat: ${movie.title}`,
      userId,
      userPhone: req.user.phone,
      movieId
    });

    res.status(200).json({
      status: 'success',
      data: {
        paymentUrl: paymentData.payment_url
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Gère les notifications de paiement (Réelles ou Simulées)
 */
const handleWebhook = async (req, res, next) => {
  try {
    const { cpm_trans_id, cpm_result } = req.body;
    
    console.log(`[WEBHOOK DEBUG] ID recu: "${cpm_trans_id}" | Resultat: ${cpm_result}`);

    if (cpm_result === '00') {
      const existingPurchase = await prisma.purchase.findUnique({
        where: { transactionId: cpm_trans_id }
      });

      if (!existingPurchase) {
        console.error(`[WEBHOOK ERROR] Transaction introuvable en base pour l'ID: ${cpm_trans_id}`);
        return res.status(200).send();
      }

      const purchase = await prisma.purchase.update({
        where: { transactionId: cpm_trans_id },
        data: { status: 'COMPLETED' },
        include: { movie: true }
      });

      await prisma.viewing.create({
        data: {
          userId: purchase.userId,
          movieId: purchase.movieId,
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000)
        }
      });

      console.log(`[PAYMENT SUCCESS] Transaction ${cpm_trans_id} validee. Film debloque.`);
    }

    res.status(200).send();
  } catch (error) {
    console.error('[WEBHOOK ERROR FATAL]', error.message);
    res.status(200).send();
  }
};

/**
 * Interface de simulation CinetPay pour les tests Staging/Production sans RCCM
 */
const renderMockGate = (req, res) => {
  const { trx, amount } = req.query;
  
  // Page HTML minimale alignée sur la charte graphique Espoir Video
  res.send(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Espoir Video - Simulateur de Paiement</title>
        <style>
            body { background: #0A0A0A; color: white; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: #1A1A1A; padding: 2.5rem; border-radius: 12px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.5); max-width: 400px; width: 90%; }
            h1 { color: #E50914; margin-bottom: 0.5rem; font-size: 1.5rem; }
            p { color: #A3A3A3; margin-bottom: 2rem; line-height: 1.5; }
            .amount { font-size: 2rem; font-weight: bold; color: white; display: block; margin-bottom: 2rem; }
            button { background: #E50914; color: white; border: none; padding: 12px 24px; border-radius: 6px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: background 0.2s; width: 100%; }
            button:hover { background: #B81D24; }
            .footer { margin-top: 1.5rem; font-size: 0.8rem; color: #525252; }
        </style>
    </head>
    <body>
        <div class="card">
            <h1>CinetPay Simulator</h1>
            <p>Test de paiement sécurisé pour la transaction<br><strong>${trx}</strong></p>
            <span class="amount">${amount} XOF</span>
            <button onclick="confirmPay()">CONFIRMER LE PAIEMENT</button>
            <div class="footer">Mode Sandbox actif - Aucune transaction réelle</div>
        </div>

        <script>
            async function confirmPay() {
                const btn = document.querySelector('button');
                btn.disabled = true;
                btn.innerText = 'Traitement...';
                
                try {
                    const response = await fetch('/api/payments/webhook', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: 'cpm_trans_id=${trx}&cpm_result=00'
                    });
                    
                    if (response.ok) {
                        alert('Paiement simulé avec succès !');
                        window.location.href = '/payment-success';
                    }
                } catch (err) {
                    alert('Erreur lors de la simulation');
                    btn.disabled = false;
                    btn.innerText = 'CONFIRMER LE PAIEMENT';
                }
            }
        </script>
    </body>
    </html>
  `);
};

module.exports = { createPayment, handleWebhook, renderMockGate };