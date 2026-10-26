import { io } from 'socket.io-client';

const url = 'http://localhost:3000';

export const socket = io(url, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  timeout: 5000,
});

socket.on('connect', () => {
  console.log('🟢 Socket подключён:', socket.id);
});

socket.on('connect_error', error => {
  console.error('🔴 Socket connect_error:', error.message);
});

socket.on('disconnect', reason => {
  console.warn('🟠 Socket.IO отключён:', reason);
});
