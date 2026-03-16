const multer = require('multer');
const AppError = require('../utils/AppError');

// On stocke le fichier temporairement en memoire RAM
const storage = multer.memoryStorage();

// Filtre pour n'accepter que des images et des videos
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image') || file.mimetype.startsWith('video')) {
    cb(null, true);
  } else {
    cb(new AppError('Format de fichier non supporte. Veuillez envoyer une image ou une video.', 400), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // Limite a 500MB pour le MVP
  }
});

module.exports = upload;