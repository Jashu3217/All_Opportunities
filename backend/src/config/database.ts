import mongoose from 'mongoose';
import { ENV } from './app.config';

export async function connectMongoDB(): Promise<void> {
  if (!ENV.MONGODB_URI) {
    console.warn('⚠️  MONGODB_URI not set — running without persistence');
    return;
  }
  try {
    await mongoose.connect(ENV.MONGODB_URI);
    console.log('✅ MongoDB connected');
    mongoose.connection.on('error', (err) => console.error('MongoDB error:', err));
    mongoose.connection.on('disconnected', () => console.warn('MongoDB disconnected'));
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err);
    // Don't crash — app runs without DB (cache-only mode)
  }
}
