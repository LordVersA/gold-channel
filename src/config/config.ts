import dotenv from 'dotenv';

dotenv.config();

interface Config {
  botToken: string;
  databaseUrl: string;
  goldApiUrl: string;
  goldApiKey: string;
  priceCacheTtl: number;
  defaultDiscountPercentage: number;
  timezone: string;
  inviteTokenExpiry: number;
  nodeEnv: string;
}

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Invalid number for environment variable: ${key}`);
  }
  return parsed;
}

export const config: Config = {
  botToken: getEnvVar('BOT_TOKEN'),
  databaseUrl: getEnvVar('DATABASE_URL', 'file:./dev.db'),
  goldApiUrl: getEnvVar('GOLD_API_URL', 'https://api.example.com/gold-price'),
  goldApiKey: getEnvVar('GOLD_API_KEY', ''),
  priceCacheTtl: getEnvNumber('PRICE_CACHE_TTL', 120),
  defaultDiscountPercentage: getEnvNumber('DEFAULT_DISCOUNT_PERCENTAGE', 10),
  timezone: getEnvVar('TIMEZONE', 'Europe/Zurich'),
  inviteTokenExpiry: getEnvNumber('INVITE_TOKEN_EXPIRY', 7),
  nodeEnv: getEnvVar('NODE_ENV', 'development'),
};
