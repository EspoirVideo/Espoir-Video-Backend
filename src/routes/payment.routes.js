const express = require('express');
const paymentController = require('../controllers/payment.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/buy', protect, paymentController.createPayment);
router.post('/webhook', paymentController.handleWebhook);

module.exports = router;