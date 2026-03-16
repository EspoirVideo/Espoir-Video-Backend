const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const env = require('./config/env'); // IMPORT SECURISÉ AJOUTÉ
const AppError = require('./utils/AppError');
const globalErrorHandler = require('./middlewares/errorHandler');
require('./config/redis'); 

// IMPORT DES ROUTES
const authRoutes = require('./routes/auth.routes');
const movieRoutes = require('./routes/movie.routes');
const paymentRoutes = require('./routes/payment.routes');

const app = express();

// 1. Middlewares Globaux
app.use(helmet());
app.use(cors({
  origin: env.FRONTEND_URL, // CORRECTION : UTILISATION DE ZOD
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

// 2. Routes de base
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'API ESPOIR VIDEO Operationnelle' });
});

// 3. Routes Metier
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/payments', paymentRoutes);

// 4. Gestion des routes non trouvees
app.use((req, res, next) => {
  next(new AppError(`Impossible de trouver l'URL ${req.originalUrl} sur ce serveur.`, 404));
});

// 5. Middleware Global de gestion des erreurs
app.use(globalErrorHandler);

module.exports = app;