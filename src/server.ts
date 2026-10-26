import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import http from 'http';
import mongoose, { Schema } from 'mongoose';
import { Server } from 'socket.io';
import { createTodosRouter } from './routes/todos';
import { configureSocket, leaveWorkspace } from './socket';
import { Todo } from './models/Todo';
import path from 'path';

dotenv.config();

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  },
});

const config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
};

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'client')));

const userSchema = new Schema(
  {
    username: { type: String, required: true, trim: true, unique: true },
    lastSeen: { type: Date, default: Date.now },
  },
  { timestamps: true, versionKey: false }
);

export const User = mongoose.model('User', userSchema);
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', '../client/src/App.jsx'));
});

app.use('/api/todos', createTodosRouter(io));

app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    method: req.method,
    path: req.originalUrl,
  });
});
app.use((error: unknown, req: Request, res: Response, next: NextFunction) => {
  console.error(error);
  const err = error as { status?: number; code?: number; message?: string };
  if (err.code === 11000) {
    res.status(400).json({ error: 'A record with these details already exists' });
    return;
  }
  const status = err.status && [400, 401, 404].includes(err.status) ? err.status : 500;
  res
    .status(status)
    .json({ error: status === 500 ? 'Internal server error' : err.message || 'Request failed' });
});

export const connectDB = async (
  uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/todos'
) => {
  await mongoose.connect(uri);
  console.log('MongoDB connected');
  await Todo.syncIndexes();
};


io.on('connection', socket => {
  console.log('🟢 Socket подключён:', socket.id);

  // Регистрируем обработчики задач, комнат и присутствия.
  configureSocket(io, socket);

  const broadcastPageCount = () => {
    io.emit('pages:count', io.of('/').sockets.size);
  };

  broadcastPageCount();

  socket.on('disconnect', reason => {
    console.log('🔴 Socket отключён:', socket.id, reason);
    broadcastPageCount();

    // Присутствие очищается в обработчике disconnect
    // внутри configureSocket. Повторно leaveWorkspace не вызываем.
  });
});


httpServer.listen(config.port, async () => {
  await connectDB();
  console.log(`Todos: http://localhost:${config.port}/api/todos in ${config.nodeEnv} mode`);
});

async function shutdown() {
  io.close();
  httpServer.close();
  await mongoose.disconnect();
  process.exit(0);
}
process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());
