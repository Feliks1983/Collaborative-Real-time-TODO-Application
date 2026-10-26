import { useState, useEffect } from 'react';
import NewTaskForm from './components/NewTaskForm';
import TaskList from './components/TaskList';
import Footer from './components/Footer';
import { ConnectionState } from './socket/ConnectionState';
import { socket } from './socket/socket';

const API_URL = '/api/todos';

export default function App() {
  const [todoList, setTodoList] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConnected, setConnected] = useState(socket.connected);
  const [message, setMessages] = useState([]);
console.log(setConnected);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(API_URL);
      const text = await response.text();
      if (!response.ok) {
        throw new Error(`Ошибка загрузки: ${response.status} ${text}`);
      }
      const data = text ? JSON.parse(text) : [];
      let todos = [];
      if (Array.isArray(data.todos)) {
        todos = data.todos;
      }
      setTodoList(todos);
    } catch (err) {
      console.error('Ошибка загрузки:', err);
      setError(err.message);
      setTodoList([]);
    } finally {
      setLoading(false);
    }
  };

  async function handleChangeTask(id) {
    if (id === undefined || id === null || id === '') {
      console.error('ОШИБКА: ID задачи отсутствует');
      return;
    }
    try {
      const task = todoList.find(task => task.id === id);
      if (!task) {
        console.error('Задача не найдена:', id);
        return;
      }
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          completed: !task.completed,
        }),
      });
      const text = await response.text();

      if (!response.ok) {
        throw new Error(`Ошибка обновления: ${response.status} ${text}`);
      }
      let result = null;

      if (text) {
        try {
          result = JSON.parse(text);
        } catch {
          result = null;
        }
      }
      const updatedTask = result?.data ?? result ?? null;
      setTodoList(tasks =>
        tasks.map(task => {
          if (task.id !== id) {
            return task;
          }
          return {
            ...task,
            ...(updatedTask || {}),
            completed: updatedTask?.completed ?? !task.completed,
          };
        })
      );
    } catch (error) {
      console.error('Ошибка изменения:', error);
    }
  }

  async function handleDeleteTask(id) {
    if (id === undefined || id === null || id === '') {
      console.error('ОШИБКА: невозможно удалить задачу без ID');
      return;
    }
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
      });
      const text = await response.text();

      if (!response.ok) {
        throw new Error(`Ошибка удаления: ${response.status} ${text}`);
      }
      setTodoList(tasks => tasks.filter(task => task.id !== id));
    } catch (err) {
      console.error('Ошибка удаления:', err);
    }
  }

  async function saveTask(id, newText) {
    if (id === undefined || id === null || id === '') {
      console.error('ОШИБКА: ID задачи отсутствует!');
      return;
    }
    if (!newText) {
      setTodoList(tasks =>
        tasks.map(task =>
          task.id === id
            ? {
                ...task,
                isEditing: false,
              }
            : task
        )
      );
      return;
    }
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: newText,
        }),
      });
      const text = await response.text();

      if (!response.ok) {
        throw new Error(`Ошибка сохранения: ${response.status} ${text}`);
      }
      let result = null;

      if (text) {
        try {
          result = JSON.parse(text);
        } catch {
          result = null;
        }
      }
      const updatedTask = result?.data ?? result ?? null;
      setTodoList(prevTasks =>
        prevTasks.map(task => {
          if (task.id !== id) {
            return task;
          }

          return {
            ...task,
            ...(updatedTask || {}),
            text: updatedTask?.text ?? newText,
            isEditing: false,
          };
        })
      );
    } catch (err) {
      console.error('Ошибка редактирования:', err);
    }
  }

  async function clearCompleted() {
    try {
      const response = await fetch(`${API_URL}/completed/clear`, {
        method: 'DELETE',
      });
      const text = await response.text();

      if (!response.ok) {
        throw new Error(`Ошибка удаления: ${response.status} ${text}`);
      }
      setTodoList(prevTasks => prevTasks.filter(task => !task.completed));
    } catch (err) {
      console.error('Ошибка:', err);
    }
  }

  const handleAddTask = async text => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          completed: false,
          priority: 'medium',
          tags: [],
        }),
      });
      const responseText = await response.text();
      let result = null;
      try {
        result = responseText ? JSON.parse(responseText) : null;
      } catch (parseError) {
        console.error('Ошибка JSON:', parseError);
        console.error('Ответ сервера:', responseText);
        return;
      }
      if (!response.ok) {
        console.error('Ошибка создания задачи:', result);
        return;
      }
      const newTask = result?.data ?? result;
      if (!newTask?.id) {
        console.error('Сервер не вернул ID задачи:', result);
        return;
      }
      setTodoList(prev => [...prev, newTask]);
    } catch (error) {
      console.error('Ошибка добавления задачи:', error);
    }
  };

  const activeCount = todoList.filter(task => !task.completed).length;
  const completedCount = todoList.filter(task => task.completed).length;
  const filteredTasks = todoList.filter(task => {
    if (filter === 'active') {
      return !task.completed;
    }
    if (filter === 'completed') {
      return task.completed;
    }
    return true;
  });

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  if (error) {
    return <div className="error">Ошибка: {error}</div>;
  }

  return (
    <section className="todoapp">
      <ConnectionState isConnected={isConnected} socket={socket} setTodoList={setTodoList} />
      <NewTaskForm handleAddTask={handleAddTask} />
      <section className="main">
        <TaskList
          tasks={filteredTasks}
          onToggle={handleChangeTask}
          onDelete={handleDeleteTask}
          onSave={saveTask}
          message={message}
          setMessages={setMessages}
        />
      </section>
      <Footer
        ActiveCount={activeCount}
        CompletedCount={completedCount}
        Filter={filter}
        FilterChange={setFilter}
        onClearCompleted={clearCompleted}
      />
    </section>
  );
}
