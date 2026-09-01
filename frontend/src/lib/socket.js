import { io } from 'socket.io-client';

let socket = null;

export const getSocket = () => socket;

export const connectSocket = (token) => {
  if (socket && socket.connected) return socket;

  if (socket) {
    socket.disconnect();
  }

  // Socket.io v4 client connection
  socket = io(window.location.origin, {
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
