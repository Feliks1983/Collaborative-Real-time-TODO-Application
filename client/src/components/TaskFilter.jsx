import PropTypes from "prop-types";

export default function TasksFilter({ Filter, FilterChange }) {
  const filters = ["all", "active", "completed"];

  return (
    <ul className="filters">
      {filters.map((filter) => (
        <li key={filter}>
          <button
            className={Filter === filter ? "selected" : ""}
            onClick={() => FilterChange(filter)}
          >
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </button>
        </li>
      ))}
    </ul>
  );
}

TasksFilter.propTypes = {
  Filter: PropTypes.string.isRequired,
  FilterChange: PropTypes.func.isRequired,
};

TasksFilter.defaultProps = {
  onFilter: "all",
  onFilterChange: function () {},
};