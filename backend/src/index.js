import http from 'http';
import mongoose from 'mongoose';
import app, { connectMongo } from './app.js';
import { setupChatSocket } from './socket/chatSocket.js';

const PORT = process.env.PORT || 5001;

// Create HTTP server wrapping Express app
const server = http.createServer(app);

// Initialize Socket.io chat server
setupChatSocket(server);

// Launch HTTP & Socket.io Server
server.listen(PORT, () => {
  console.log(`🚀 QA Control Center Backend & Socket.io running on http://localhost:${PORT}`);
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
