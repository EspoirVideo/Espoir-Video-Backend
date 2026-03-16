const env = require('../config/env');

const sendSms = async (phoneNumber, message) => {
  // En developpement ou sans API key, on simule l'envoi dans le terminal
  if (env.NODE_ENV === 'development' || env.SMS_API_KEY === 'A_REMPLIR_PLUS_TARD') {
    console.log(`\n[MOCK SMS] Destinataire: ${phoneNumber}`);
    console.log(`[MOCK SMS] Message: ${message}\n`);
    return true;
  }

  // Logique de production pour le fournisseur SMS
  try {
    // Le code d'appel a l'API du fournisseur ira ici
    return true;
  } catch (error) {
    console.error('[ERREUR SMS] Echec de l\'envoi:', error);
    throw new Error('Impossible d\'envoyer le SMS');
  }
};

module.exports = { sendSms };