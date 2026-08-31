import mongoose from 'mongoose';
import app, { connectMongo } from './app.js';

const PORT = process.env.PORT || 5001;

// Launch Express Server immediately
const server = app.listen(PORT, () => {
  console.log(`🚀 QA Control Center Express Server running on http://localhost:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is currently in use.`);
  } else {
    console.error('Server error:', err);
  }
});

connectMongo();

const gracefulShutdown = () => {
  server.close(() => {
    if (mongoose.connection.readyState !== 0) {
      mongoose.connection.close(false, () => {
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  });
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
