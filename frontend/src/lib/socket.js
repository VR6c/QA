import { io } from 'socket.io-client';

let socket = null;

export const getSocket = () => socket;

const getSocketServerUrl = () => {
  if (typeof window === 'undefined') return 'http://localhost:5001';
  if (window.location.hostname === 'localhost' && window.location.port !== '5001') {
    return 'http://localhost:5001';
  }
  return window.location.origin;
};

export const connectSocket = (token) => {
  if (socket && socket.connected) return socket;

  if (socket) {
    socket.disconnect();
  }

  const targetUrl = getSocketServerUrl();

  // Socket.io v4 client connection
  socket = io(targetUrl, {
    auth: { token },
    query: { token },
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    transports: ['websocket', 'polling']
  });

  socket.on('connect', () => {
    console.log('⚡ Socket.io connected:', socket.id);
  });

  socket.on('connect_error', (err) => {
    console.warn('⚠️ Socket.io connection error:', err.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('🔌 Socket.io disconnected:', reason);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
