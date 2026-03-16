const express = require('express');
const authController = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/send-otp', authController.sendOtp);
router.post('/verify-otp', authController.verifyOtp);

// Route protegee pour recuperer la session courante
router.get('/me', protect, authController.getMe);

module.exports = router;