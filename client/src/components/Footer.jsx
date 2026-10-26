import TasksFilter from "./TaskFilter";
import PropTypes from "prop-types";

export default function Footer({
  ActiveCount,
  CompletedCount,
  Filter,
  FilterChange,
  onClearCompleted,
}) {
  return (
    <footer className="footer">
      <span className="todo-count">
        {ActiveCount} {ActiveCount === 1 ? "item" : "items"} left
      </span>
      <TasksFilter Filter={Filter} FilterChange={FilterChange} />
      {CompletedCount > 0 && (
        <button className="clear-completed" onClick={onClearCompleted}>
          Clear completed
        </button>
      )}
    </footer>
  );
}

Footer.propTypes = {
  ActiveCount: PropTypes.number.isRequired,
  CompletedCount: PropTypes.number.isRequired,
  Filter: PropTypes.string.isRequired,
  FilterChange: PropTypes.func.isRequired,
  onClearCompleted: PropTypes.func.isRequired,
};

Footer.defaultProps = {
  ActiveCount: 0,
  CompletedCount: 0,
  Filter: "all",
  FilterChange: function () {},
  onClearCompleted: function () {},
};
