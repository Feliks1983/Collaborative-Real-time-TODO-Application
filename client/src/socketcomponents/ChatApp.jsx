import { useEffect, useState } from 'react';
import io from 'socket.io-client';

export default function ChatApp() {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  
  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);
    
    newSocket.on('new-message', (message) => {
      setMessages(prev => [...prev, message]);
    });
    
    return () => newSocket.close();
  }, []);
  const id = 0;
  const currentUser = {id: id};
  
  const sendMessage = (text) => {
    socket.emit('message', {
      text,
      timestamp: new Date(),
      userId: currentUser.id
    });
  };
  
  return <><input type="text" name="" id="" message = {messages} onChange={sendMessage} /></>

}