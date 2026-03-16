const jwt = require('jsonwebtoken');
const env = require('../config/env');
const AppError = require('../utils/AppError');

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Vous n\'etes pas connecte.', 401));
    }

    // DIAGNOSTIC (A supprimer apres resolution)
    console.log('[DEBUG AUTH] Secret utilise:', env.JWT_ACCESS_SECRET);
    console.log('[DEBUG AUTH] Token recu:', token);

    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    // DIAGNOSTIC (A supprimer apres resolution)
    console.error('[DEBUG AUTH] Erreur JWT:', error.message);
    
    next(new AppError('Session invalide ou expiree. Veuillez vous reconnecter.', 401));
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Permission refusee.', 403));
    }
    next();
  };
};

module.exports = { protect, restrictTo };