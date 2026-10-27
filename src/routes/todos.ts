import { Router, Request, Response, NextFunction } from 'express';
import { Server } from 'socket.io';

import {
  createTodo,
  deleteTodo,
  getAllTodos,
  getTodoById,
  getTodoStats,
  patchTodo,
  updateTodo,
} from '../services/todoService';


function broadcastAfterSuccess(
  io: Server,
  event: 'todo:created' | 'todo:updated' | 'todo:deleted'
) {
  return (req: Request, res: Response, next: NextFunction) => {
    let emitted = false;

    const emitEvent = (body?: any) => {
      if (emitted || res.statusCode < 200 || res.statusCode >= 300) {
        return;
      }

      emitted = true;

      if (event === 'todo:deleted') {
        const id = String(req.params.id ?? '');

        if (!id) {
          console.warn('Не удалось определить ID удалённой задачи');
          return;
        }

        io.to('workspace:default').emit('todo:deleted', { id });
        console.log('📡 Отправлено todo:deleted:', id);
        return;
      }

      const todo = body?.data?.todo ?? body?.todo ?? body?.data ?? body;

      if (todo && (todo._id || todo.id)) {
        io.to('workspace:default').emit(event, todo);
        console.log(`📡 Отправлено ${event}:`, todo._id ?? todo.id);
      } else {
        console.warn(`Не удалось определить задачу для ${event}:`, body);
      }
    };

    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);
    const originalEnd = res.end.bind(res);

    res.json = ((body?: any) => {
      emitEvent(body);
      return originalJson(body);
    }) as Response['json'];

    res.send = ((body?: any) => {
      emitEvent(body);
      return originalSend(body);
    }) as Response['send'];

    res.end = ((...args: any[]) => {
      emitEvent();
      return (originalEnd as any)(...args);
    }) as Response['end'];

    next();
  };
}


export function createTodosRouter(io: Server) {
  const router = Router();

  router.get('/', getAllTodos);
  router.get('/stats', getTodoStats);
  router.get('/:id', getTodoById);

  router.post('/', broadcastAfterSuccess(io, 'todo:created'), createTodo);
  router.put('/:id', broadcastAfterSuccess(io, 'todo:updated'), updateTodo);
  router.patch('/:id', broadcastAfterSuccess(io, 'todo:updated'), patchTodo);
  router.delete('/:id', broadcastAfterSuccess(io, 'todo:deleted'), deleteTodo);

  return router;
}
