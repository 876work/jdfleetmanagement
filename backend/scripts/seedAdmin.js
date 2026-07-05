import dotenv from 'dotenv';
import mongoose from 'mongoose';

import User from '../src/models/User.js';

dotenv.config();

const requiredEnvVars = [
  'MONGO_URI',
  'SEED_ADMIN_USERNAME',
  'SEED_ADMIN_EMAIL',
  'SEED_ADMIN_PASSWORD'
];

const missingEnvVars = requiredEnvVars.filter((name) => !process.env[name]);

if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

const seedAdmin = async () => {
  const username = process.env.SEED_ADMIN_USERNAME.trim();
  const email = process.env.SEED_ADMIN_EMAIL.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!username || !email || !password) {
    throw new Error('Seed admin username, email, and password must not be empty.');
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const existingAdmin = await User.findOne({
    $or: [{ username }, { email }]
  });

  if (existingAdmin) {
    console.log('Admin seed skipped: a user with that username or email already exists.');
    return;
  }

  const admin = new User({
    username,
    email,
    passwordHash: password,
    role: 'admin'
  });

  await admin.save();
  console.log(`Admin user created for username "${username}" and email "${email}".`);
};

seedAdmin()
  .catch((error) => {
    console.error('Admin seed failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
