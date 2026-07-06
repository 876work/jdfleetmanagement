import dotenv from 'dotenv';

dotenv.config();

const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];

export const getMissingRequiredEnvVars = () => requiredEnvVars.filter((name) => !process.env[name]);

export const validateRequiredEnvVars = () => {
  const missingEnvVars = getMissingRequiredEnvVars();

  if (missingEnvVars.length > 0) {
    throw new Error(`Missing required environment variable(s): ${missingEnvVars.join(', ')}`);
  }
};
