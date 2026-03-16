const express = require('express');
const movieController = require('../controllers/movie.controller');
const { protect, restrictTo } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

const router = express.Router();

// Liste des films (tous les connectes)
router.get('/', protect, movieController.getAllMovies);

// Creation d'un film (Admin seulement + Upload fichiers)
router.post(
  '/', 
  protect, 
  restrictTo('ADMIN'), 
  upload.fields([
    { name: 'poster', maxCount: 1 },
    { name: 'video', maxCount: 1 }
  ]),
  movieController.createMovie
);

module.exports = router;