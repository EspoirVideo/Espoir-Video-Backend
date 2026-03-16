const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const redisClient = require('../config/redis');
const { sendOTP } = require('../services/sms.service');
const AppError = require('../utils/AppError');
const env = require('../config/env');

const prisma = new PrismaClient();

const sendOtp = async (req, res, next) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return next(new AppError('Le numero de telephone est requis.', 400));
    }

    // Generation d'un code a 4 chiffres (1000 a 9999)
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // Stockage dans Redis avec expiration stricte a 300 secondes (5 minutes)
    await redisClient.set(`otp:${phone}`, otp, 'EX', 300);

    // Envoi du code via le service
    await sendOTP(phone, otp);

    res.status(200).json({
      status: 'success',
      message: 'Code OTP envoye avec succes'
    });
  } catch (error) {
    next(error);
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return next(new AppError('Le numero de telephone et le code OTP sont requis.', 400));
    }

    // 1. Verification dans Redis
    const storedOtp = await redisClient.get(`otp:${phone}`);

    if (!storedOtp) {
      return next(new AppError('Code OTP expire ou inexistant.', 401));
    }

    if (storedOtp !== otp) {
      return next(new AppError('Code OTP incorrect.', 401));
    }

    // 2. Destruction de l'OTP (Securite anti-rejeu)
    await redisClient.del(`otp:${phone}`);

    // 3. Upsert Utilisateur (Le chercher, sinon le creer)
    let user = await prisma.user.findUnique({
      where: { phone }
    });

    if (!user) {
      user = await prisma.user.create({
        data: { phone }
      });
    }

    // 4. Generation des cles de securite (JWT)
    const accessToken = jwt.sign(
      { id: user.id, role: user.role },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' } // Duree de vie courte pour la securite
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' } // Duree de vie longue pour le confort utilisateur
    );

    // 5. Envoi du Refresh Token dans un cookie blinde
    res.cookie('jwt', refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 jours en millisecondes
    });

    // 6. Reponse finale
    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          phone: user.phone,
          role: user.role
        },
        accessToken
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendOtp,
  verifyOtp
};