const env = require('../config/env');

const sendOTP = async (phone, otp) => {
  try {
    // 1. SONDE DE DÉBOGAGE (S'affichera obligatoirement)
    console.log(`[DEBUG SMS] Appel declenche pour le numero : ${phone}`);
    console.log(`[DEBUG SMS] Valeur de env.SMS_API_KEY lue par le serveur : "${env.SMS_API_KEY}"`);

    // 2. Condition de simulation elargie (securise les espaces ou mots cles parasites)
    const isSimulationMode = 
      !env.SMS_API_KEY || 
      env.SMS_API_KEY === 'votre_cle_api' || 
      env.SMS_API_KEY.trim() === '' || 
      env.SMS_API_KEY === 'null';

    if (isSimulationMode) {
      console.log('-----------------------------------------');
      console.log(`[SMS SIMULATION ACTUVE]`);
      console.log(`Destinataire : ${phone}`);
      console.log(`Expediteur (ID) : ${env.SMS_SENDER_ID}`);
      console.log(`Message : Votre code de verification est ${otp}`);
      console.log('-----------------------------------------');
      return { success: true, message: 'Simulated' };
    }

    // 3. Cas où une vraie clé est détectée (S'affichera si on saute la simulation)
    console.log('[DEBUG SMS] Vraie cle API detectee. Le mode simulation est ignore.');
    // const response = await axios.post('URL_API_SMS', { ... });
    
    return { success: true };
  } catch (error) {
    console.error('[SMS SERVICE ERROR]', error.message);
    return { success: false };
  }
};

module.exports = { sendOTP };