import mongoose, { Document, QueryFilter } from 'mongoose';

export interface ITodo extends Document {
  id: string;
  text: string;
  description?: string;
  completed: boolean;
  createdAt: string;
  updatedAt?: string;
  category?: string;
  dueDate?: string;
  tags: string[];
}

export interface CreateTodoInput {
  text: string;
  description?: string;
  category?: string;
  dueDate?: string;
  tags: string[];
  username?: string;
}

export interface UpdateTodoInput {
  text?: string;
  description?: string;
  completed?: boolean;
  category?: string;
  dueDate?: string;
  tags: string[];
}

export interface TodoQuery {
  offset?: number;
  limit?: number;
  completed?: boolean;
  search?: string;
  category?: string;
  dueDate?: string;
  sort?: string;
}

export interface TodoMeta {
  offset: number;
  limit: number;
  total: number;
  totalPages: number;
  todos: number;
  filtered: number;
}

export interface TodoFilters {
  completed?: boolean;
  search?: string;
}

export interface TodoStats {
  total: number;
  completed: number;
  pending: number;
}

export interface ValidationDetail {
  field: string;
  message: string;
  value: unknown;
}

const transform = (_doc: unknown, ret: any) => {
  ret.id = ret._id.toString();
  delete ret._id;
  delete ret.__v;
  return ret;
};

const todoSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 500,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 200,
      default: undefined,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    category: {
      type: String,
      trim: true,
      maxlength: 100,
      default: undefined,
    },
    dueDate: {
      type: Date,
      default: undefined,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true, transform },
    toObject: { virtuals: true, transform },
  }
);

todoSchema.index({ completed: 1 });
todoSchema.index({ category: 1 });
todoSchema.index({ createdAt: -1 });

export const Todo = mongoose.model('Todo', todoSchema);

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: ValidationDetail[];
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
}

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const cleanTags = (tags?: string[]) =>
  Array.isArray(tags) ? tags.map(t => t.trim()).filter(Boolean) : [];

const ALLOWED_SORT_FIELDS = ['text', 'completed', 'category', 'dueDate', 'createdAt', 'updatedAt'];

const toITodo = (doc: any): ITodo => doc.toJSON() as ITodo;

export const getTodos = async (
  options: TodoQuery = {}
): Promise<{ todos: ITodo[]; total: number; filtered: number }> => {
  const { offset = 1, limit = 10, completed, search, category, dueDate, sort } = options;

  const filter: QueryFilter<any> = {};

  if (completed !== undefined) {
    filter.completed = completed;
  }

  if (category !== undefined) {
    filter.category = new RegExp(`^${escapeRegex(category.trim())}$`, 'i');
  }

  if (search) {
    filter.text = new RegExp(escapeRegex(search.trim()), 'i');
  }

  if (dueDate) {
    const start = new Date(dueDate);
    if (!isNaN(start.getTime())) {
      start.setUTCHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + 1);
      filter.dueDate = { $gte: start, $lt: end };
    }
  }

  let sorted: Record<string, 1 | -1> = { createdAt: -1 };
  if (sort) {
    const field = sort.startsWith('-') ? sort.substring(1) : sort;
    if (ALLOWED_SORT_FIELDS.includes(field)) {
      sorted = { [field]: sort.startsWith('-') ? -1 : 1 };
    }
  }

  const skip = (Math.max(offset, 1) - 1) * limit;

  const [docs, total, filtered] = await Promise.all([
    Todo.find(filter).sort(sorted).skip(skip).limit(limit),
    Todo.countDocuments(),
    Todo.countDocuments(filter),
  ]);

  return { todos: docs.map(toITodo), total, filtered };
};

export const getTodoById = async (id: string): Promise<ITodo | null> => {
  if (!mongoose.isValidObjectId(id)) return null;
  const doc = await Todo.findById(id);
  return doc ? toITodo(doc) : null;
};

export const createTodo = async (input: CreateTodoInput): Promise<ITodo> => {
  const doc = await Todo.create({
    text: input.text.trim(),
    description: input.description?.trim() || undefined,
    category: input.category?.trim() || undefined,
    dueDate: input.dueDate || undefined,
    tags: cleanTags(input.tags),
  });
  return toITodo(doc);
};

export const updateTodo = async (id: string, input: UpdateTodoInput): Promise<ITodo | null> => {
  if (!mongoose.isValidObjectId(id)) return null;

  const $set: Record<string, unknown> = {};
  const $unset: Record<string, 1> = {};

  if (input.text !== undefined) $set.text = input.text.trim();
  if (input.completed !== undefined) $set.completed = input.completed;
  if (input.tags !== undefined) $set.tags = cleanTags(input.tags);

  const optional: Array<'description' | 'category' | 'dueDate'> = [
    'description',
    'category',
    'dueDate',
  ];
  for (const key of optional) {
    const value = input[key];
    if (value === undefined) continue;
    const trimmed = value.trim();
    if (trimmed) $set[key] = trimmed;
    else $unset[key] = 1;
  }

  const update: Record<string, unknown> = {};
  if (Object.keys($set).length) update.$set = $set;
  if (Object.keys($unset).length) update.$unset = $unset;

  const doc = await Todo.findByIdAndUpdate(id, update, { new: true, runValidators: true });
  return doc ? toITodo(doc) : null;
};

export const deleteTodo = async (id: string): Promise<boolean> => {
  if (!mongoose.isValidObjectId(id)) return false;
  const result = await Todo.findByIdAndDelete(id);
  return result !== null;
};

export const getStats = async (): Promise<TodoStats> => {
  const [total, completed] = await Promise.all([
    Todo.countDocuments(),
    Todo.countDocuments({ completed: true }),
  ]);
  return { total, completed, pending: total - completed };
};
