import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const possibleEnvPaths = [
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../.env'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'backend/.env'),
];

for (const envPath of possibleEnvPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

// Fallback defaults for local development
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'traffic-routing-engine-super-secret-jwt-key-2026';
}
if (!process.env.POSTBACK_SECRET) {
  process.env.POSTBACK_SECRET = 'postback-secret-token-key-2026';
}
if (!process.env.REDIS_URL && process.env.REDIS_URI) {
  process.env.REDIS_URL = process.env.REDIS_URI;
}

export const validateEnvironment = () => {
  const requiredVariables = ['MONGO_URI'];
  const missingVariables = requiredVariables.filter((name) => !process.env[name]);

  if (missingVariables.length > 0) {
    console.warn(`[Warning] Missing environment variables: ${missingVariables.join(', ')}. Please check your .env file.`);
  }
};