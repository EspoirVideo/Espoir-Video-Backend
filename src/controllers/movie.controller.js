const { PrismaClient } = require('@prisma/client');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = require('../utils/s3.utils');
const env = require('../config/env');
const crypto = require('crypto');

const prisma = new PrismaClient();

const uploadToR2 = async (file, folder) => {
  const fileExtension = file.originalname.split('.').pop();
  const fileName = `${folder}/${crypto.randomBytes(16).toString('hex')}.${fileExtension}`;

  const params = {
    Bucket: env.R2_BUCKET_NAME,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  await s3Client.send(new PutObjectCommand(params));
  
  // Retourne l'URL publique ou la cle du fichier
  return fileName;
};

const createMovie = async (req, res, next) => {
  try {
    const { title, description, country, genre, price } = req.body;
    
    let posterUrl = null;
    let videoKey = null;

    // Si on a recu des fichiers
    if (req.files) {
      if (req.files.poster) {
        posterUrl = await uploadToR2(req.files.poster[0], 'posters');
      }
      if (req.files.video) {
        videoKey = await uploadToR2(req.files.video[0], 'videos');
      }
    }

    const movie = await prisma.movie.create({
      data: {
        title,
        description,
        country,
        genre,
        price: parseInt(price),
        posterUrl,
        videoKey,
        isPublished: true
      }
    });

    res.status(201).json({
      status: 'success',
      data: { movie }
    });
  } catch (error) {
    next(error);
  }
};

const getAllMovies = async (req, res, next) => {
  try {
    const movies = await prisma.movie.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      status: 'success',
      results: movies.length,
      data: { movies }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllMovies, createMovie };