import app, { connectMongo } from '../backend/src/app.js';

export default async function handler(req, res) {
  try {
    await connectMongo();
    return app(req, res);
  } catch (err) {
    console.error('Serverless DB Connection Error:', err.message);
    return res.status(503).json({
      success: false,
      error: 'Database connection failed. Please check MONGODB_URI configuration.',
      code: 'ERR_DATABASE_UNAVAILABLE'
    });
  }
}
