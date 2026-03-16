const app = require('./src/app');
const env = require('./src/config/env');

const startServer = async () => {
  try {
    app.listen(env.PORT, () => {
      console.log(`[SERVEUR] Actif sur le port ${env.PORT} en mode ${env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('[SERVEUR] Erreur critique au démarrage:', error);
    process.exit(1);
  }
};

startServer();