import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Task from '../models/Task.js';

dotenv.config();

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/qa_app';
  console.log('Connecting to Mongo at:', uri);
  
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
  console.log('Connected to MongoDB.');

  const res = await Task.deleteMany({});
  console.log(`Deleted ${res.deletedCount} tasks from DB.`);

  await mongoose.disconnect();
  console.log('Disconnected.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Error clearing database:', err);
  process.exit(1);
});
