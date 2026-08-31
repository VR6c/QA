import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import taskRoutes from './routes/tasks.js';
import ownerRoutes from './routes/owners.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import activityRoutes from './routes/activities.js';
import { seedDemoUsers } from './controllers/authController.js';
import { seedSuperAdminData } from './seed/superAdminSeed.js';
import { responseMiddleware } from './utils/responseFormatter.js';
import { globalErrorHandler } from './middleware/errorHandler.js';
import { apiRateLimiter, authRateLimiter } from './middleware/rateLimiter.js';
import { tenantMiddleware } from './middleware/tenantMiddleware.js';

dotenv.config();

const app = express();

// Base Middleware Architecture
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(responseMiddleware);
app.use(tenantMiddleware);

// Rate Limiting
app.use('/api/auth/login', authRateLimiter);
app.use('/api', apiRateLimiter);

// Health Check
app.get('/api/health', (req, res) => {
  res.success({
    status: 'ok',
    service: 'QA PECC Express Backend',
    timestamp: new Date().toISOString()
  }, null, 'Health check passed');
});

// API Routes
app.use('/api/tasks', taskRoutes);
app.use('/api/owners', ownerRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/activities', activityRoutes);

// Centralized Global Error Handler Middleware
app.use(globalErrorHandler);

let isConnected = false;

export const connectMongo = async () => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  const defaultLocalUri = 'mongodb://localhost:27017/qa_app';
  const mongoUri = process.env.MONGODB_URI || defaultLocalUri;

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`✅ Successfully connected to MongoDB [${mongoUri.includes('mongodb+srv') ? 'Production Atlas' : 'Local'}]`);
    if (!isConnected) {
      if (process.env.NODE_ENV !== 'production') {
        await seedDemoUsers();
      }
      await seedSuperAdminData();
      isConnected = true;
    }
  } catch (err) {
    console.error(`❌ MongoDB Connection Error (${mongoUri}): ${err.message}`);
    // Local fallback if primary connection fails in non-production environment
    if (process.env.NODE_ENV !== 'production' && mongoUri !== defaultLocalUri) {
      try {
        console.log(`🔄 Attempting fallback to local MongoDB: ${defaultLocalUri}`);
        await mongoose.connect(defaultLocalUri, { serverSelectionTimeoutMS: 3000 });
        console.log(`✅ Successfully connected to local MongoDB fallback`);
        if (!isConnected) {
          await seedDemoUsers();
          await seedSuperAdminData();
          isConnected = true;
        }
      } catch (fallbackErr) {
        console.error(`❌ Local MongoDB Fallback failed: ${fallbackErr.message}`);
      }
    }
  }
};

export default app;
