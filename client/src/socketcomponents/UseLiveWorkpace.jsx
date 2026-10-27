import { useEffect, useState } from 'react';
import { socket } from '../socket/socket';

export const UseLiveWorkspace = (setTasks, username = 'Guest') => {
  const [online, setOnline] = useState(0);
  const [users, setUsers] = useState([]);
  const getTaskId = task => String(task?._id ?? task?.id ?? '');

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
      const newId = getTaskId(todo);

      if (!newId) {
        console.warn('У задачи отсутствует id:', todo);
        return;
      }

      setTasks(previous => {
        const exists = previous.some(task => getTaskId(task) === newId);

        if (exists) {
          return previous;
        }

        return [todo, ...previous];
      });
    };

 const onUpdated = todo => {
   const updatedId = String(todo?.id ?? todo?._id ?? '');

   console.log('Получено todo:updated:', {
     id: updatedId,
     completed: todo?.completed,
   });

   if (!updatedId) return;

   setTasks(previous =>
     previous.map(task =>
       String(task?.id ?? task?._id ?? '') === updatedId ? { ...task, ...todo } : task
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
};
