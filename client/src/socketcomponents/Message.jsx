import { Server } from 'socket.io';
import sanitizeHtml from 'sanitize-html';

const io = new Server();

//Проверка ввода
export default function Message(){
  io.on('input-message', data => {
    // Validate before broadcasting
    if (!data.text || data.text.length > 1000) {
      io.emit('error', 'Invalid message');
      return;
    }

    // Sanitize
    const sanitized = {
      text: sanitizeHtml(data.text),
      timestamp: new Date(),
      userId: io.userId,
    };

    io.emit('input-message', sanitized);
  });
}