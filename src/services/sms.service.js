const env = require('../config/env');

const sendOTP = async (phone, otp) => {
  try {
    // Utilisation stricte des variables validees par Zod
    if (!env.SMS_API_KEY || env.SMS_API_KEY === 'votre_cle_api') {
      console.log('-----------------------------------------');
      console.log(`[SMS SIMULATION]`);
      console.log(`Destinataire : ${phone}`);
      console.log(`Expediteur (ID) : ${env.SMS_SENDER_ID}`);
      console.log(`Message : Votre code de verification est ${otp}`);
      console.log('-----------------------------------------');
      return { success: true, message: 'Simulated' };
    }

    // Ici, tu integreras plus tard l'appel reel (Twilio, Termii, etc.)
    // const response = await axios.post('URL_API_SMS', { ... });
    
    return { success: true };
  } catch (error) {
    console.error('[SMS SERVICE ERROR]', error.message);
    // On ne bloque pas le flux en dev/staging meme si le SMS echoue
    return { success: false };
  }
};

module.exports = { sendOTP };