import dotenv from 'dotenv';

dotenv.config();

export const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  API_URL: process.env.API_URL || 'http://localhost:5000',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',

  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || '',
  
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  CLAUDE_API_KEY: process.env.CLAUDE_API_KEY || '',

  GEOCODING_TIMEOUT: 3000,
  WEATHER_TIMEOUT: 2000,
};

export default config;
