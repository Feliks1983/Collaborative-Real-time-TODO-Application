import { Server, Socket } from 'socket.io';

const io = new Server();
const socket = Socket();

//Система присутствия
export default function PresenceSystem() {
  const presence = new Map();

  socket.on('activity', () => {
    presence.set(socket.userId, {
      lastSeen: Date.now(),
      status: 'active',
    });
  });

  // Check inactive users
  setInterval(() => {
    const now = Date.now();
    presence.forEach((user, userId) => {
      if (now - user.lastSeen > 30000) {
        user.status = 'idle';
        io.emit('user-idle', userId);
      }
    });
  }, 10000);
}
