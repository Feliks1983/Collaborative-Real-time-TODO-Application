import { useState, useRef } from "react";
import PropTypes from "prop-types";

export default function NewTaskForm({ handleAddTask }) {
  const [text, setText] = useState("");
  const inputRef = useRef(null);
  const handleSubmit = (e) => {
    e.preventDefault();
    if (text) {
      handleAddTask(text);
      setText("");
    }
  };
  return (
    <header className="header">
      <h1>todos</h1>
      <form onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          className="new-todo"
          placeholder="What needs to be done?"
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </form>
    </header>
  );
}

NewTaskForm.propTypes = {
  handleAddTask: PropTypes.func.isRequired,
};

NewTaskForm.defaultProps = {
  handleAddTask: function () {},
};
