import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables:
// 1. Try process.cwd() (could be apps/api or workspace root)
dotenv.config();
// 2. Explicitly try root .env (relative to this file: apps/api/src/shared/config/env.ts)
dotenv.config({ path: path.resolve(__dirname, '../../../../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.preprocess((val) => (val ? Number(val) : undefined), z.number().default(3001)),
  FRONTEND_URL: z.string().min(1), // Allow simple local urls like http://localhost:5173
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
  AWS_REGION: z.string().min(1),
  AWS_S3_BUCKET: z.string().min(1),
  ACRCLOUD_HOST: z.string().min(1),
  ACRCLOUD_ACCESS_KEY: z.string().min(1),
  ACRCLOUD_ACCESS_SECRET: z.string().min(1),
  ACRCLOUD_BUCKET_NAME: z.string().min(1),
  FLUTTERWAVE_SECRET_KEY: z.string().min(1),
  FLUTTERWAVE_WEBHOOK_SECRET: z.string().min(1),
  SMILE_IDENTITY_API_KEY: z.string().min(1),
  SMILE_IDENTITY_PARTNER_ID: z.string().min(1),
  SMILE_IDENTITY_ENVIRONMENT: z.enum(['sandbox', 'production']).default('sandbox'),
  CERTIFICATE_BASE_URL: z.string().min(1),
  SENDGRID_API_KEY: z.string().min(1),
  AWS_SES_FROM_EMAIL: z.string().email(),
  FREETSA_URL: z.string().url().default('https://freetsa.org/tsr'),
  PAYSTACK_SECRET_KEY: z.string().min(1),
  PAYSTACK_PUBLIC_KEY: z.string().min(1),
  PAYSTACK_WEBHOOK_SECRET: z.string().default(''),
});


const parseEnv = () => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Invalid environment variables:', JSON.stringify(result.error.format(), null, 2));
    throw new Error('Invalid environment variables config');
  }
  return result.data;
};

export const config = parseEnv();
export type Config = typeof config;
export default config;
