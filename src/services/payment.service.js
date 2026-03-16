const axios = require('axios');
const env = require('../config/env');
const AppError = require('../utils/AppError');

const initPayment = async (data) => {
  try {
    const payload = {
      apikey: env.CINETPAY_API_KEY,
      site_id: env.CINETPAY_SITE_ID,
      transaction_id: data.transactionId,
      amount: data.amount,
      currency: 'XOF',
      alternative_currency: '',
      description: data.description,
      customer_id: data.userId,
      customer_name: 'Client',
      customer_surname: 'Espoir Video',
      customer_email: 'client@espoirvideo.com',
      customer_phone_number: data.userPhone,
      customer_address: 'Abidjan',
      customer_city: 'Abidjan',
      customer_country: 'CI',
      customer_state: 'CI',
      customer_zip_code: '00225',
      notify_url: `${env.BACKEND_URL}/api/payments/webhook`,
      return_url: `${env.FRONTEND_URL}/payment-success`,
      channels: 'ALL',
      metadata: JSON.stringify({ movieId: data.movieId, userId: data.userId }),
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
    throw new AppError('Erreur lors de la communication avec CinetPay.', 500);
  }
};

module.exports = { initPayment };