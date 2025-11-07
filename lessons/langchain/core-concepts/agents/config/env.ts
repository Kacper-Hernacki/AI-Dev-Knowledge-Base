export const ENV = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  NODE_ENV: process.env.NODE_ENV || 'development',
} as const;

export function validateEnv() {
  if (!ENV.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }
}

export function isProduction(): boolean {
  return ENV.NODE_ENV === 'production';
}

export function isDevelopment(): boolean {
  return ENV.NODE_ENV === 'development';
}