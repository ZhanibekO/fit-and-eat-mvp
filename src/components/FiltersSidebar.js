// src/components/FiltersSidebar.js
import React, { useState } from "react";

const FiltersSidebar = ({ onFilterChange }) => {
  const [selectedFilters, setSelectedFilters] = useState({
    difficulty: "all",
    type: "all",
    duration: "all"
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const updatedFilters = { ...selectedFilters, [name]: value };
    setSelectedFilters(updatedFilters);
    if (onFilterChange) {
      onFilterChange(updatedFilters);
    }
  };

  return (
    <div
      className="filters-sidebar"
      style={{
        padding: "1rem",
        borderRight: "1px solid #ccc",
        minWidth: "200px"
      }}
    >
      <h3 style={{ color: "#34495e" }}>Filters</h3>
      <div className="filter-group" style={{ marginBottom: "1rem" }}>
        <label htmlFor="difficulty" style={{ marginRight: "0.5rem" }}>
          Difficulty:
        </label>
        <select
          name="difficulty"
          id="difficulty"
          value={selectedFilters.difficulty}
          onChange={handleFilterChange}
        >
          <option value="all">All</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>
      <div className="filter-group" style={{ marginBottom: "1rem" }}>
        <label htmlFor="type" style={{ marginRight: "0.5rem" }}>
          Type:
        </label>
        <select
          name="type"
          id="type"
          value={selectedFilters.type}
          onChange={handleFilterChange}
        >
          <option value="all">All</option>
          <option value="strength">Strength</option>
          <option value="cardio">Cardio</option>
          <option value="flexibility">Flexibility</option>
          <option value="balance">Balance</option>
        </select>
      </div>
      <div className="filter-group">
        <label htmlFor="duration" style={{ marginRight: "0.5rem" }}>
          Duration:
        </label>
        <select
          name="duration"
          id="duration"
          value={selectedFilters.duration}
          onChange={handleFilterChange}
        >
          <option value="all">All</option>
          <option value="10-20">10-20 minutes</option>
          <option value="20-30">20-30 minutes</option>
          <option value="30-45">30-45 minutes</option>
          <option value="45-60">45-60 minutes</option>
        </select>
      </div>
    </div>
  );
};

export default FiltersSidebar;
