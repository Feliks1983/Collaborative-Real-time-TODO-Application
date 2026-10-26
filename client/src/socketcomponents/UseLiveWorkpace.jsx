import { useEffect, useState } from 'react';
import { socket } from '../socket/socket';

export const UseLiveWorkspace = (setTasks, username = 'Guest') => {
  const [online, setOnline] = useState(0);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const joinWorkspace = () => {
      socket.emit('workspace:join', {
        workspace: 'default',
        username,
      });
    };

    const onPresence = data => {
      if (data.workspace !== 'default') return;

      setOnline(data.online);
      setUsers(data.users);
    };

    const onCreated = todo => {
      setTasks(previous => {
        const exists = previous.some(
          item => String(item._id ?? item.id) === String(todo._id ?? todo.id)
        );

        return exists ? previous : [todo, ...previous];
      });
    };

    const onUpdated = todo => {
      setTasks(previous =>
        previous.map(item =>
          String(item._id ?? item.id) === String(todo._id ?? todo.id) ? todo : item
        )
      );
    };

    const onDeleted = ({ id }) => {
      setTasks(previous => previous.filter(item => String(item._id ?? item.id) !== String(id)));
    };


    socket.on('connect', joinWorkspace);
    socket.on('presence:update', onPresence);
    socket.on('todo:created', onCreated);
    socket.on('todo:updated', onUpdated);
    socket.on('todo:deleted', onDeleted);

         if (!socket.connected) {
           socket.connect();
         } else {
           joinWorkspace();
         }


    return () => {
      socket.off('connect', joinWorkspace);
      socket.off('presence:update', onPresence);
      socket.off('todo:created', onCreated);
      socket.off('todo:updated', onUpdated);
      socket.off('todo:deleted', onDeleted);
    };
  }, [setTasks, username]);

  return { online, users };
}


