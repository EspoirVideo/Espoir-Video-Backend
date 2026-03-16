const env = require('../config/env');

const sendOTP = async (phone, otp) => {
  try {
    // Si l'API KEY n'est pas definie, on passe en mode Simulation (Log)
    if (!process.env.SMS_API_KEY || process.env.SMS_API_KEY === 'votre_cle_api') {
      console.log('-----------------------------------------');
      console.log(`[SMS SIMULATION]`);
      console.log(`Destinataire : ${phone}`);
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