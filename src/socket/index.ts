import { Socket, Server } from 'socket.io';
import mongoose, { Schema } from 'mongoose';

import { createTodo, deleteTodo, updateTodo } from '../models/Todo';

export const Guest = ['Guest-1', 'Guest-2'];

export const workspace = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    workspace: { type: String, required: true },
    username: { type: String, required: true },
    users: { type: String, required: true },
    online: { type: Number, required: true },
    isTyping: { type: Boolean },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

workspace.index({ userId: 1, createdAt: -1 });

export const Workspace = mongoose.model('Notification', workspace);

const activeUsers = new Map<string, { id: string; username: string | null; status: string }>();

const rooms = new Set(['general', 'random']);

type ChatSocket = Socket & {
  data: {
    userId?: string;
    username?: string;
  };
};

const workspaceUsers = new Map<string, Map<string, string>>();

function getUsers(workspace: string) {
  let users = workspaceUsers.get(workspace);
  if (!users) {
    users = new Map<string, string>();
    workspaceUsers.set(workspace, users);
  }
  return users;
}

function emitPresence(io: Server, workspace: string) {
  const users = workspaceUsers.get(workspace);
  io.to(`workspace:${workspace}`).emit('presence:update', {
    workspace,
    online: users?.size ?? 0,
    users: users ? [...users.values()] : [],
  });
}

export async function leaveWorkspace(io: Server, socket: ChatSocket, workspace: string) {
  const room = `workspace:${workspace}`;
  const users = workspaceUsers.get(workspace);

  users?.delete(socket.id);
  delete socket.data.workspace;

  await socket.leave(room);

  if (users) {
    emitPresence(io, workspace);
    if (users.size === 0) {
      workspaceUsers.delete(workspace);
    }
  }
}

export function configureSocket(io: Server, socket: ChatSocket): void {
  socket.on(
    'workspace:join',
    async ({
      workspace = 'default',
      username = 'Guest',
    }: {
      workspace?: string;
      username?: string;
    } = {}) => {
      if (workspace !== 'default') return;

      if (socket.data.workspace === workspace) {
        return;
      }

      const previousWorkspace = socket.data.workspace;

      if (previousWorkspace && previousWorkspace !== workspace) {
        leaveWorkspace(io, socket, previousWorkspace);
      }

      const room = `workspace:${workspace}`;
      await socket.join(room);

      socket.data.workspace = workspace;
      socket.data.username = username.trim() || 'Guest';

      if (!workspaceUsers.has(workspace)) {
        workspaceUsers.set(workspace, new Map());
      }

      workspaceUsers.get(workspace)!.set(socket.id, socket.data.username);

      emitPresence(io, workspace);
    }
  );

  socket.on('workspace:leave', async ({ workspace = 'default' }: { workspace?: string } = {}) => {
    if (socket.data.workspace !== workspace) return;

    await leaveWorkspace(io, socket, workspace);
  });

  socket.on('typing', ({ workspace = 'default', isTyping }) => {
    if (socket.data.workspace !== workspace) return;

    socket.to(`workspace:${workspace}`).emit('typing', {
      workspace,
      username: socket.data.username ?? 'Guest',
      isTyping: Boolean(isTyping),
    });
  });

  socket.on('chat:send', (text: string) => {
    if (typeof text !== 'string' || !text.trim()) return;

    const message = {
      id: `${Date.now()}-${socket.id}`,
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };

    io.emit('chat:message', message);
  });

  activeUsers.set(socket.id, {
    id: socket.id,
    username: socket.data.username ?? null,
    status: 'online',
  });

  socket.on('set-username', (username: string) => {
    const user = activeUsers.get(socket.id);
    if (!user) return;

    user.username = username;
    socket.data.username = username;

    io.emit('user-online', user);
  });

  socket.on('join-room', async (roomId: string) => {
    if (!rooms.has(roomId) && roomId !== 'workspace:default') {
      socket.emit('chat:error', { message: 'Unknown room' });
      return;
    }

    await socket.join(roomId);
    socket.emit('room-joined', { roomId });
  });

  socket.on('set-massage', async (roomId: string) => {
    if (typeof roomId !== 'string') return;

    if (rooms.has(roomId) || roomId === 'workspace:default') {
      await socket.join(roomId);
    }
  });

  socket.on('input-message', (data: { message: string }) => {
    const room = Array.from(socket.rooms).find(r => r !== socket.id) ?? 'general';

    io.to(room).emit('input message', {
      username: socket.data.username ?? 'Guest',
      message: data.message,
      timestamp: new Date().toISOString(),
      room,
    });
  });

  socket.on('room-message', ({ roomId, message }: { roomId: string; message: string }) => {
    if (!socket.rooms.has(roomId)) return;

    io.to(roomId).emit('new-message', {
      username: socket.data.username ?? 'Guest',
      message,
      timestamp: new Date().toISOString(),
      room: roomId,
    });
  });

  socket.on('leave-room', async (roomId: string) => {
    await socket.leave(roomId);
    socket.to(roomId).emit('user-left', socket.id);
  });

  socket.on('todo:create', async data => {
    try {
      const todo = await createTodo({
        text: data.text,
        description: data.description,
        category: data.category,
        dueDate: data.dueDate || undefined,
        tags: data.tags,
      });

      io.to('workspace:default').emit('todo:created', todo);
    } catch (error) {
      console.error('Socket todo:create error:', error);
      socket.emit('todo:error', {
        message: 'Failed to create todo',
      });
    }
  });

  socket.on(
    'todo:update',
    async ({
      id,
      changes,
    }: {
      id: string;
      changes: {
        text?: string;
        description?: string;
        completed?: boolean;
        category?: string;
        dueDate?: string;
        tags?: string[];
      };
    }) => {
      try {
        const todo = await updateTodo(id, {
          ...changes,
          tags: changes.tags ?? [],
        });

        if (!todo) {
          socket.emit('todo:error', { message: 'Todo not found' });
          return;
        }

        io.to('workspace:default').emit('todo:updated', todo);
      } catch (error) {
        console.error('Socket todo:update error:', error);
        socket.emit('todo:error', {
          message: 'Failed to update todo',
        });
      }
    }
  );

  socket.on('todo:delete', async (id: string) => {
    try {
      const deleted = await deleteTodo(id);

      if (!deleted) {
        socket.emit('todo:error', { message: 'Todo not found' });
        return;
      }

      io.to('workspace:default').emit('todo:deleted', { id });
    } catch (error) {
      console.error('Socket todo:delete error:', error);
      socket.emit('todo:error', {
        message: 'Failed to delete todo',
      });
    }
  });

  socket.on('todo task', msg => {
    io.emit('todo task', msg);
  });
}

export async function emitUnreadCount(io: Server, userId: string): Promise<void> {
  const unread = await Workspace.countDocuments({ userId });
  io.to(`user:${userId}`).emit('notification:count', { unread });
}
