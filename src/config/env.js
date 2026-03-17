const { z } = require('zod');
const dotenv = require('dotenv');

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url(), 
  REDIS_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(20),
  JWT_REFRESH_SECRET: z.string().min(20),
  
  // CLOUDFLARE R2
  R2_BUCKET_NAME: z.string(),
  R2_ENDPOINT: z.string().url(),
  R2_ACCESS_KEY_ID: z.string(),
  R2_SECRET_ACCESS_KEY: z.string(),
  R2_PUBLIC_URL: z.string().url(),

  // CINETPAY
  CINETPAY_SITE_ID: z.string(),
  CINETPAY_API_KEY: z.string(),

  // SMS (TWILIO, TERMII, ETC.)
  SMS_API_KEY: z.string().default('votre_cle_api'),
  SMS_SENDER_ID: z.string().default('votre_cle_api'),

  // URLS DE REDIRECTION
  BACKEND_URL: z.string().url().default('http://localhost:5000'),
  
  // CORRECTION : Accepte une chaine separee par des virgules et la transforme en tableau
  FRONTEND_URL: z.string()
    .default('http://localhost:5173')
    .transform((str) => str.split(',').map((item) => item.trim())),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('[ERREUR FATALE] Variables d\'environnement manquantes ou invalides:', _env.error.format());
  process.exit(1);
}

module.exports = _env.data;