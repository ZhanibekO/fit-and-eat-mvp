// server.js
const path = require("path");
const dotenvResult = require("dotenv").config({ path: path.resolve(__dirname, ".env") });

if (dotenvResult.error) {
  console.error("Error loading .env file:", dotenvResult.error);
} else {
  console.log("Dotenv parsed:", dotenvResult.parsed);
}

// Debug log to verify OPENAI_API_KEY
console.log("OPENAI_API_KEY:", process.env.OPENAI_API_KEY);

const express = require("express");
const app = express();

// Middleware to parse JSON requests
app.use(express.json());

// Serve static files from the "build" folder (if your React build is there)
app.use(express.static(path.join(__dirname, "build")));

// Import routers from the project root (both workout and meals)
const workoutRouter = require("./workout");
const mealsRouter = require("./meals");

// Mount routers on respective endpoints
app.use("/api/workouts", workoutRouter);
app.use("/api/meals", mealsRouter);

// Submit goals endpoint (if needed in your app)
app.post("/submit-goals", (req, res) => {
  const { userGoals } = req.body;
  if (!userGoals) {
    console.error("User goals not provided.");
    return res.status(400).json({ success: false, message: "User goals are required." });
  }
  console.log("User goals received:", userGoals);
  res.status(200).json({ success: true, message: "Goals submitted successfully." });
});

// API-specific catch-all for undefined API routes.
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "Endpoint not found" });
  }
  next();
});

// Fallback: Serve index.html for all non-API GET requests.
app.get(/^\/(?!api\/).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
