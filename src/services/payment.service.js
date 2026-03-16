const axios = require('axios');
const env = require('../config/env');
const AppError = require('../utils/AppError');

const initPayment = async (data) => {
  try {
    // MODE SIMULATION : Si on n'a pas de vraies cles
    if (env.CINETPAY_SITE_ID === 'SANDBOX') {
      console.log('--- [CINETPAY SIMULATION MODE ACTIVE] ---');
      return {
        // On renvoie vers une route de notre propre backend qui simulera l'interface CinetPay
        payment_url: `${env.BACKEND_URL}/api/payments/mock-gate?trx=${data.transactionId}&amount=${data.amount}`,
        payment_token: 'mock_token_123'
      };
    }

    // APPEL REEL (Quand tu auras le RCCM)
    const payload = {
      apikey: env.CINETPAY_API_KEY,
      site_id: env.CINETPAY_SITE_ID,
      transaction_id: data.transactionId,
      amount: data.amount,
      currency: 'XOF',
      description: data.description,
      customer_id: data.userId,
      customer_phone_number: data.userPhone,
      notify_url: `${env.BACKEND_URL}/api/payments/webhook`,
      return_url: `${env.FRONTEND_URL}/payment-success`,
      channels: 'ALL',
      lang: 'fr'
    };

    const response = await axios.post('https://api-checkout.cinetpay.com/v2/payment', payload);

    if (response.data.code === '201') {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Erreur API CinetPay');
    }
  } catch (error) {
    console.error('[CINETPAY SERVICE ERROR]', error.response?.data || error.message);
    throw new AppError('Erreur de communication avec le service de paiement.', 500);
  }
};

module.exports = { initPayment };