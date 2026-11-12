import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from current directory or backend directory
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });

const envSchema = z.object({
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().default('*'),
  LOG_LEVEL: z.string().default('info'),
  DATABASE_URL: z.string().default(process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres'),
  DIRECT_URL: z.string().optional(),
  JWT_ACCESS_SECRET: z.string().default(process.env.JWT_ACCESS_SECRET || 'smartagri_access_super_secret_key_change_in_production_2026'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().default(process.env.JWT_REFRESH_SECRET || 'smartagri_refresh_super_secret_key_change_in_production_2026'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  MQTT_BROKER_URL: z.string().default('mqtt://broker.emqx.io:1883'),
  MQTT_USERNAME: z.string().optional().default(''),
  MQTT_PASSWORD: z.string().optional().default(''),
  MQTT_CLIENT_PREFIX: z.string().default('smartagri_backend'),
  OUTBOX_POLL_INTERVAL_MS: z.string().default('3000').transform((val) => parseInt(val, 10)),
  DEVICE_HEARTBEAT_TIMEOUT_MINUTES: z.string().default('10').transform((val) => parseInt(val, 10)),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
}

export const env = parsed.success ? parsed.data : (process.env as any);

