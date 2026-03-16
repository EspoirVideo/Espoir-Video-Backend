const { PrismaClient } = require('@prisma/client');
const paymentService = require('../services/payment.service');
const AppError = require('../utils/AppError');
const crypto = require('crypto');

const prisma = new PrismaClient();

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

module.exports = { createPayment, handleWebhook };