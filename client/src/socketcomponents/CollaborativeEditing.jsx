import { Socket } from 'socket.io';

const socket = Socket();

//Совместное редактирование
export default function CollaborativeEditing(){
  socket.on('document-change', async ({ docId, changes }) => {
    // Save to database
    await Document.update(docId, changes);

    // Broadcast to others editing same document
    socket.to(`doc-${docId}`).emit('document-updated', changes);
  });
}