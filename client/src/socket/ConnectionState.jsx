import '../css/ConnectionManager.css';
import { UseLiveWorkspace } from '../socketcomponents/UseLiveWorkpace';

export const ConnectionState = ({ isConnected, socket, setTodoList }) => {
  const { online, users } = UseLiveWorkspace(setTodoList, 'Alice');
  return (
    <div className="connection-state-container">
      <h2 className="connection-state">
        Статус соединения: {socket?.connected || isConnected ? '🟢 Подключен' : '🔴 Отключен'}
      </h2>

      <p className="pages-count">
        <div>
          <strong>Онлайн: {online}</strong>
          <p>Участники: {users.join(', ') || 'Пока никого нет'}</p>
        </div>
      </p>
    </div>
  );
};
