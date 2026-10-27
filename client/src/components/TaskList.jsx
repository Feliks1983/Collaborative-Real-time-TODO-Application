import Task from "./Task";
import PropTypes from "prop-types";

export default function TaskList({
  tasks,
  onToggle,
  onDelete,
  onSave,
  message,
  setMessages,
}) {
  return (
    <ul className="todo-list">
      {tasks.map(task => (
        <Task
          key={String(task._id ?? task.id)}
          task={task}
          onToggle={onToggle}
          onDelete={onDelete}
          onSave={onSave}
          message={message}
          setMessages={setMessages}
        />
      ))}
    </ul>
  );
}

TaskList.propTypes = {
  tasks: PropTypes.shape({
    id: PropTypes.number.isRequired,
    text: PropTypes.string.isRequired,
    completed: PropTypes.bool.isRequired,
    created: PropTypes.oneOfType([PropTypes.number, PropTypes.instanceOf(Date)])
      .isRequired,
  }).isRequired,
  onToggle: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
};

Task.defaultProps = {
  tasks: [],
  onToggle: function () {},
  onDelete: function () {},
  onSave: function () {},
};
