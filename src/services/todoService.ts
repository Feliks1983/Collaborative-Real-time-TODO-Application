import { Request, Response, NextFunction } from "express";
import { isValidObjectId } from 'mongoose';
import {
  getTodos,
  getTodoById as findTodoById,
  createTodo as createTodoService,
  updateTodo as updateTodoService,
  deleteTodo as deleteTodoService,
  getStats,
} from "../models/Todo";

export const getAllTodos = async(
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const offset = Number(req.query.offset) || 1;
    const limit = Number(req.query.limit) || 10;

    const completed =
      req.query.completed !== undefined
        ? req.query.completed === "true"
        : undefined;

    const search =
      typeof req.query.search === "string" ? req.query.search : undefined;

    const category =
      typeof req.query.category === "string" ? req.query.category : undefined;

    const sort =
      typeof req.query.sort === "string" ? req.query.sort : undefined;

    const result = await getTodos({
      offset,
      limit,
      completed,
      search,
      category,
      sort,
    });

    return res.status(200).json({
      todos: result.todos,
      total: result.total,
      filtered: result.filtered,
    });
  } catch (error) {
    next(error);
  }
};

export const getTodoById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = String(req.params.id);

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid todo ID',
      });
    }

    const todo = await findTodoById(id);

    if (!todo) {
      return res.status(404).json({
        success: false,
        error: "Todo not found",
      });
    }

    return res.status(200).json(todo);
  } catch (error) {
    next(error);
  }
};

export const createTodo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const todo = await createTodoService({
      text: req.body.text,
      description: req.body.description,
      category: req.body.category,
      dueDate: req.body.dueDate || undefined,
      tags: req.body.tags,
    });

    return res.status(201).json({
      success: true,
      data: todo,
      message: "Todo created successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const updateTodo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid todo ID',
      });
    }

    const todo = await updateTodoService(id, {
      text: req.body.text,
      description: req.body.description,
      completed: req.body.completed,
      category: req.body.category,
      dueDate: req.body.dueDate || undefined,
      tags: req.body.tags,
    });

    if (!todo) {
      return res.status(404).json({
        success: false,
        error: "Todo not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: todo,
    });
  } catch (error) {
    next(error);
  }
};

export const patchTodo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const fields = [
      "title",
      "description",
      "completed",
      "category",
      "dueDate",
    ];

    const hasFields = fields.some((field) => req.body[field] !== undefined);

    if (!hasFields) {
      return res.status(400).json({
        success: false,
        error: "At least one field is required",
      });
    }

    const id = String(req.params.id);

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid todo ID',
      });
    }

    const todo = await updateTodoService(id, {
      text: req.body.text,
      description: req.body.description,
      completed: req.body.completed,
      category: req.body.category,
      dueDate: req.body.dueDate || undefined,
      tags: req.body.tags,
    });

    if (!todo) {
      return res.status(404).json({
        success: false,
        error: "Todo not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: todo,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTodo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid todo ID',
      });
    }

    const deleted = await deleteTodoService(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: "Todo not found",
      });
    }

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const getTodoStats = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const stats = await getStats();

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};
