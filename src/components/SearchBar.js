// src/components/SearchBar.js
import React, { useState } from "react";

const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState("");

  const handleInputChange = (e) => setQuery(e.target.value);
  const handleSearchClick = () => {
    if (onSearch) onSearch(query);
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearchClick();
  };

  return (
    <div
      className="search-bar"
      style={{ margin: "1rem 0", textAlign: "center" }}
    >
      <input
        type="text"
        placeholder="Search workouts or exercises..."
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        style={{
          padding: "0.5rem",
          width: "80%",
          maxWidth: "400px",
          border: "1px solid #ccc",
          borderRadius: "4px"
        }}
      />
      <button
        onClick={handleSearchClick}
        style={{
          marginLeft: "0.5rem",
          padding: "0.5rem 1rem",
          borderRadius: "4px",
          backgroundColor: "#2ecc71",
          color: "#fff",
          border: "none"
        }}
      >
        Search
      </button>
    </div>
  );
};

export default SearchBar;
