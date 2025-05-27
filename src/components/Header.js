// src/components/Header.js
import React from "react";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header style={{ backgroundColor: "#34495e", padding: "1rem", color: "#fff" }}>
      <div
        className="container"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <h1 style={{ margin: 0 }}>AI Fitness App</h1>
        <nav>
          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "flex"
            }}
          >
            <li style={{ margin: "0 1rem" }}>
              <Link to="/" style={{ color: "#fff", textDecoration: "none" }}>
                Workouts
              </Link>
            </li>
            <li style={{ margin: "0 1rem" }}>
              <Link to="/exercises" style={{ color: "#fff", textDecoration: "none" }}>
                Exercises
              </Link>
            </li>
            <li style={{ margin: "0 1rem" }}>
              <Link to="/meal-plans" style={{ color: "#fff", textDecoration: "none" }}>
                Meal Plans
              </Link>
            </li>
            <li style={{ margin: "0 1rem" }}>
              <Link to="/profile" style={{ color: "#fff", textDecoration: "none" }}>
                Profile
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
