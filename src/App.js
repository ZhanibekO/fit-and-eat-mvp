// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Import shared layout components
import Header from "./components/Header";
import Footer from "./components/Footer";

// Import page components
import HomePage from "./pages/HomePage";
import Exercises from "./pages/Exercises";
import MealPlans from "./pages/MealPlans";
import Profile from "./pages/Profile";

// Import global styles
import "./style.css";

function App() {
  return (
    <Router>
      <div className="app-wrapper">
        <Header />
        <main className="app-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/exercises" element={<Exercises />} />
            <Route path="/meal-plans" element={<MealPlans />} />
            <Route path="/profile" element={<Profile />} />
            <Route
              path="*"
              element={
                <div style={{ padding: "2rem", textAlign: "center" }}>
                  Page Not Found
                </div>
              }
            />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
