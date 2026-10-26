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

const { Router } = require('express');

export const router = Router();

export function createTodosRouter(io: Server) {
  const router = Router();

  router.get('/', getAllTodos);
  router.get('/stats', getTodoStats);
  router.get('/:id', getTodoById);
  router.put('/:id', updateTodo);
  router.patch('/:id', patchTodo);
  router.post('/', createTodo);
  router.delete('/:id', deleteTodo);

  return router;
}
