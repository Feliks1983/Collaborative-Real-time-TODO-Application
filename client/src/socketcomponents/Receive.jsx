import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import socket from '../socket/socket';

export default function Receive() {
  const [receiveMessage, setReceiveMessage] = useState(' ');

  useEffect(() => {
    io.on('receive_message', data => {
      console.log(data);
      setReceiveMessage(data);
    });

    return () => {
      socket.off('receive_message');
    };
  }, []);

  return (
    <div>
      <p>Просмотр полученных сообщений: {receiveMessage}</p>
      {}
    </div>
  );
}
