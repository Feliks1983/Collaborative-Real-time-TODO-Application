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
    const originalJson = res.json.bind(res);

    res.json = ((body: any) => {
      if (event === 'todo:updated') {
        console.log('📡 PATCH/PUT response:', {
          status: res.statusCode,
          body,
        });
      }
      if (res.statusCode >= 200 && res.statusCode < 300) {
        if (event === 'todo:deleted') {
          io.to('workspace:default').emit(event, {
            id: req.params.id,
          });
        } else {
          const todo = body?.data?.todo ?? body?.todo ?? body?.data ?? body;

          if (todo && (todo._id || todo.id)) {
            io.to('workspace:default').emit(event, todo);
            console.log(`📡 Отправлено ${event}`, todo._id ?? todo.id);
          } else {
            console.warn(`Не удалось определить задачу для ${event}:`, body);
          }
        }
      }

      return originalJson(body);
    }) as Response['json'];

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
