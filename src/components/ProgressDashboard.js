// src/components/ProgressDashboard.js
import React from "react";

// Utility functions to calculate percentages.
const calculateWorkoutPercentage = (completed, total) =>
  total > 0 ? Math.round((completed / total) * 100) : 0;

const calculateCaloriePercentage = (burned, goal) =>
  goal > 0 ? Math.round((burned / goal) * 100) : 0;

const ProgressDashboard = ({ progressData }) => {
  // Default values if progressData is not provided.
  const defaultProgress = {
    workoutsCompleted: 0,
    totalWorkouts: 7,
    caloriesBurned: 0,
    goalCalories: 0,
    currentStreak: 0, // in days
    totalWorkoutDuration: 0, // in minutes
  };

  const data = progressData || defaultProgress;
  const workoutPercentage = calculateWorkoutPercentage(
    data.workoutsCompleted,
    data.totalWorkouts
  );
  const caloriePercentage = calculateCaloriePercentage(
    data.caloriesBurned,
    data.goalCalories
  );

  return (
    <div
      className="progress-dashboard"
      style={{
        padding: "1rem",
        backgroundColor: "#f9f9f9",
        border: "1px solid #ccc",
        borderRadius: "8px",
        margin: "1rem 0",
      }}
    >
      <h2 style={{ marginBottom: "1rem", color: "#34495e" }}>
        Progress Dashboard
      </h2>

      {/* Workouts Completed Section */}
      <div style={{ marginBottom: "1rem" }}>
        <strong>Workouts Completed:</strong> {data.workoutsCompleted} /{" "}
        {data.totalWorkouts} ({workoutPercentage}%)
        <div
          style={{
            backgroundColor: "#ddd",
            width: "100%",
            height: "10px",
            borderRadius: "5px",
            marginTop: "5px",
          }}
        >
          <div
            style={{
              backgroundColor: "#2ecc71",
              width: `${workoutPercentage}%`,
              height: "10px",
              borderRadius: "5px",
            }}
          ></div>
        </div>
      </div>

      {/* Calories Burned Section (only visible if a goal is provided) */}
      {data.goalCalories > 0 && (
        <div style={{ marginBottom: "1rem" }}>
          <strong>Calories Burned:</strong> {data.caloriesBurned} kcal /{" "}
          {data.goalCalories} kcal ({caloriePercentage}%)
          <div
            style={{
              backgroundColor: "#ddd",
              width: "100%",
              height: "10px",
              borderRadius: "5px",
              marginTop: "5px",
            }}
          >
            <div
              style={{
                backgroundColor: "#e74c3c",
                width: `${caloriePercentage}%`,
                height: "10px",
                borderRadius: "5px",
              }}
            ></div>
          </div>
        </div>
      )}

      {/* Current Streak */}
      <div style={{ marginBottom: "1rem" }}>
        <strong>Current Streak:</strong> {data.currentStreak} days
      </div>

      {/* Total Workout Duration */}
      <div style={{ marginBottom: "1rem" }}>
        <strong>Total Workout Duration:</strong> {data.totalWorkoutDuration} minutes
      </div>
    </div>
  );
};

export default ProgressDashboard;
