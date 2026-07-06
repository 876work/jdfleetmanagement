// config/db.js
import mongoose from 'mongoose';
import './env.js';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');
  } catch (err) {
    throw new Error(`MongoDB connection failed: ${err.message}`);
  }
};

export default connectDB;
