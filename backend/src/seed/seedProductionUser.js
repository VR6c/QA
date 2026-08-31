import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { seedSuperAdminData } from './superAdminSeed.js';

dotenv.config();

const seedProduction = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/qa_app';
  console.log(`🔌 Connecting to MongoDB at ${mongoUri}...`);

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      family: 4
    });
    console.log('✅ Connected to MongoDB.');

    console.log('\n🚀 Starting Production User & System Initialization Seeder...');
    await seedSuperAdminData();
    console.log('🎉 Production seeding completed successfully!');

    await mongoose.disconnect();
    console.log('👋 MongoDB disconnected cleanly.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Production seeding failed:', error);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
};

seedProduction();
