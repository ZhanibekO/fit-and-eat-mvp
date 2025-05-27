// src/pages/Exercises.js

import React, { useState, useEffect, useRef } from "react";
import SearchBar from "../components/SearchBar";

const Exercises = () => {
  // Core state: list of exercises and recommended ones.
  const [exercises, setExercises] = useState([]);
  const [filteredExercises, setFilteredExercises] = useState([]);
  const [recommendedExercises, setRecommendedExercises] = useState([]);

  // Search and filter state.
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    difficulty: "all",
    muscleGroup: "all",
    equipment: "all",
    type: "all"
  });
  const [sortOption, setSortOption] = useState("default");

  // Pagination state.
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Loading and error states.
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modal for detailed exercise view.
  const [selectedExercise, setSelectedExercise] = useState(null);

  // Favorites: store exercise IDs.
  const [favorites, setFavorites] = useState([]);
  // Reviews: an object with key = exercise id and value = array of reviews.
  const [exerciseReviews, setExerciseReviews] = useState({});
  const [reviewInput, setReviewInput] = useState("");

  // For interactive checklist of instructions.
  const [checkedSteps, setCheckedSteps] = useState([]);

  // Reference for printing.
  const printRef = useRef();

  // -----------------------
  // Fetch exercise data from API.
  // -----------------------
  useEffect(() => {
    const fetchExercises = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/exercises");
        const data = await res.json();
        if (data && data.exercises) {
          setExercises(data.exercises);
          setFilteredExercises(data.exercises);
        } else {
          setError("No exercises data received.");
        }
      } catch (err) {
        console.error("Error fetching exercises:", err);
        setError("Failed to load exercises. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchExercises();
  }, []);

  // -----------------------
  // Fetch recommended exercises.
  // -----------------------
  useEffect(() => {
    const fetchRecommended = async () => {
      try {
        const res = await fetch("/api/exercises/recommendations");
        const data = await res.json();
        if (data && data.recommended) {
          setRecommendedExercises(data.recommended);
        }
      } catch (err) {
        console.error("Error fetching recommended exercises:", err);
      }
    };
    fetchRecommended();
  }, []);

  // -----------------------
  // Re-filter exercises when search query, filters, sort options, or exercises state changes.
  // -----------------------
  useEffect(() => {
    setCurrentPage(1);
    filterExercises(searchQuery, filters, sortOption);
  }, [searchQuery, filters, sortOption, exercises]);

  const handleSearch = (query) => setSearchQuery(query);
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };
  const handleSortChange = (e) => setSortOption(e.target.value);

  const filterExercises = (query, currentFilters, sortOpt) => {
    let filtered = exercises;
    // Search filter.
    if (query) {
      filtered = filtered.filter((ex) =>
        ex.name.toLowerCase().includes(query.toLowerCase())
      );
    }
    // Filter by difficulty.
    if (currentFilters.difficulty !== "all") {
      filtered = filtered.filter(
        (ex) =>
          ex.difficulty &&
          ex.difficulty.toLowerCase() === currentFilters.difficulty.toLowerCase()
      );
    }
    // Filter by muscle group.
    if (currentFilters.muscleGroup !== "all") {
      filtered = filtered.filter(
        (ex) =>
          ex.muscleGroup &&
          ex.muscleGroup.toLowerCase() === currentFilters.muscleGroup.toLowerCase()
      );
    }
    // Filter by equipment. (Assumes ex.equipment is an array of strings.)
    if (currentFilters.equipment !== "all") {
      filtered = filtered.filter(
        (ex) =>
          ex.equipment &&
          ex.equipment.map((eq) => eq.toLowerCase()).includes(currentFilters.equipment.toLowerCase())
      );
    }
    // Filter by exercise type.
    if (currentFilters.type !== "all") {
      filtered = filtered.filter(
        (ex) =>
          ex.type &&
          ex.type.toLowerCase() === currentFilters.type.toLowerCase()
      );
    }
    // Sorting.
    if (sortOpt === "popularity") {
      filtered.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    } else if (sortOpt === "rating") {
      filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortOpt === "duration") {
      filtered.sort((a, b) => (a.duration || 0) - (b.duration || 0));
    } else if (sortOpt === "newest") {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    setFilteredExercises(filtered);
  };

  // -----------------------
  // Pagination Logic
  // -----------------------
  const indexOfLastExercise = currentPage * itemsPerPage;
  const indexOfFirstExercise = indexOfLastExercise - itemsPerPage;
  const currentExercises = filteredExercises.slice(
    indexOfFirstExercise,
    indexOfLastExercise
  );
  const totalPages = Math.ceil(filteredExercises.length / itemsPerPage);
  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    return (
      <div style={{ textAlign: "center", marginTop: "1rem" }}>
        {Array.from({ length: totalPages }, (_, index) => (
          <button
            key={index + 1}
            onClick={() => handlePageChange(index + 1)}
            style={{
              margin: "0 0.25rem",
              padding: "0.5rem 1rem",
              backgroundColor: currentPage === index + 1 ? "#3498db" : "#eee",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            {index + 1}
          </button>
        ))}
      </div>
    );
  };

  // -----------------------
  // Modal: When an exercise is selected, initialize an interactive checklist of instructions.
  // -----------------------
  useEffect(() => {
    if (selectedExercise && selectedExercise.instructions) {
      setCheckedSteps(Array(selectedExercise.instructions.length).fill(false));
    } else {
      setCheckedSteps([]);
    }
  }, [selectedExercise]);

  // -----------------------
  // Modal Actions
  // -----------------------
  const openExerciseModal = (exercise) => setSelectedExercise(exercise);
  const closeExerciseModal = () => setSelectedExercise(null);

  const toggleStepCheck = (index) => {
    setCheckedSteps((prev) => {
      const newChecks = [...prev];
      newChecks[index] = !newChecks[index];
      return newChecks;
    });
  };

  const searchYouTubeVideo = (exerciseName) => {
    const query = encodeURIComponent(exerciseName + " exercise tutorial");
    window.open(`https://www.youtube.com/results?search_query=${query}`, "_blank");
  };

  const handleEquipmentTagClick = (eq) => {
    setFilters((prev) => ({ ...prev, equipment: eq.toLowerCase() }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleToggleFavorite = (exercise) => {
    setFavorites((prev) => {
      if (prev.includes(exercise.id)) {
        return prev.filter((id) => id !== exercise.id);
      } else {
        return [...prev, exercise.id];
      }
    });
  };

  const handleSubmitReview = () => {
    if (!selectedExercise) return;
    const id = selectedExercise.id;
    const newReview = { text: reviewInput, date: new Date().toLocaleString() };
    setExerciseReviews((prev) => ({
      ...prev,
      [id]: prev[id] ? [...prev[id], newReview] : [newReview]
    }));
    setReviewInput("");
  };

  const printExercise = () => {
    if (!selectedExercise) return;
    const printContent = document.getElementById("printableExercise").innerHTML;
    const printWindow = window.open("", "", "width=800,height=600");
    printWindow.document.write(`
      <html>
        <head>
          <title>${selectedExercise.name} - Exercise</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h2 { color: #34495e; }
            ul, ol { margin-left: 20px; }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  // -----------------------
  // Similar Exercises (based on matching muscleGroup)
  // -----------------------
  const similarExercises = selectedExercise
    ? exercises.filter((ex) =>
        ex.id !== selectedExercise.id &&
        ex.muscleGroup &&
        selectedExercise.muscleGroup &&
        ex.muscleGroup.toLowerCase() === selectedExercise.muscleGroup.toLowerCase()
      )
    : [];

  return (
    <div className="exercises-page" style={{ display: "flex", flexWrap: "wrap" }}>
      {/* Recommended Exercises Carousel */}
      {recommendedExercises.length > 0 && (
        <div style={{ width: "100%", marginBottom: "2rem", padding: "1rem" }}>
          <h2 style={{ color: "#34495e" }}>Recommended for You</h2>
          <div style={{ display: "flex", overflowX: "auto", gap: "1rem" }}>
            {recommendedExercises.map((ex) => (
              <div
                key={ex.id || ex.name}
                style={{
                  minWidth: "200px",
                  border: "1px solid #ccc",
                  borderRadius: "8px",
                  padding: "0.5rem",
                  backgroundColor: "#fff",
                  cursor: "pointer"
                }}
                onClick={() => openExerciseModal(ex)}
              >
                {ex.image && (
                  <img
                    src={ex.image}
                    alt={ex.name}
                    loading="lazy"
                    style={{ width: "100%", borderRadius: "6px" }}
                  />
                )}
                <h4 style={{ margin: "0.5rem 0", color: "#34495e" }}>
                  {ex.name}
                </h4>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Section */}
      <div style={{ flex: "1 1 600px", padding: "1rem" }}>
        <h2 style={{ color: "#34495e", marginBottom: "1rem" }}>
          Exercise Library
        </h2>
        <SearchBar onSearch={handleSearch} />

        {/* Inline Advanced Filters */}
        <div style={{ marginBottom: "1rem" }}>
          <div style={{ marginBottom: "0.5rem" }}>
            <label htmlFor="difficulty" style={{ marginRight: "0.5rem" }}>
              Difficulty:
            </label>
            <select
              name="difficulty"
              id="difficulty"
              value={filters.difficulty}
              onChange={handleFilterChange}
            >
              <option value="all">All</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <div style={{ marginBottom: "0.5rem" }}>
            <label htmlFor="muscleGroup" style={{ marginRight: "0.5rem" }}>
              Muscle Group:
            </label>
            <select
              name="muscleGroup"
              id="muscleGroup"
              value={filters.muscleGroup}
              onChange={handleFilterChange}
            >
              <option value="all">All</option>
              <option value="chest">Chest</option>
              <option value="back">Back</option>
              <option value="legs">Legs</option>
              <option value="core">Core</option>
              <option value="shoulders">Shoulders</option>
              <option value="arms">Arms</option>
            </select>
          </div>
          <div style={{ marginBottom: "0.5rem" }}>
            <label htmlFor="equipment" style={{ marginRight: "0.5rem" }}>
              Equipment:
            </label>
            <select
              name="equipment"
              id="equipment"
              value={filters.equipment}
              onChange={handleFilterChange}
            >
              <option value="all">All</option>
              <option value="none">None</option>
              <option value="dumbbells">Dumbbells</option>
              <option value="barbell">Barbell</option>
              <option value="machine">Machine</option>
              <option value="free weights">Free Weights</option>
              <option value="resistance bands">Resistance Bands</option>
              <option value="kettlebells">Kettlebells</option>
              <option value="medicine ball">Medicine Ball</option>
              <option value="cable machine">Cable Machine</option>
              <option value="trx">TRX Suspension Trainer</option>
              <option value="treadmill">Treadmill</option>
              <option value="elliptical">Elliptical</option>
              <option value="stationary bike">Stationary Bike</option>
              <option value="rowing machine">Rowing Machine</option>
              <option value="battle ropes">Battle Ropes</option>
              <option value="power rack">Power Rack</option>
              <option value="squat rack">Squat Rack</option>
              <option value="smith machine">Smith Machine</option>
              <option value="plyo box">Plyo Box</option>
              <option value="stability ball">Stability Ball</option>
              <option value="yoga mat">Yoga Mat</option>
              <option value="foam roller">Foam Roller</option>
              <option value="preacher bench">Preacher Bench</option>
              <option value="pull-up bar">Pull-Up Bar</option>
              <option value="chin-up bar">Chin-Up Bar</option>
              <option value="gymnastics rings">Gymnastics Rings</option>
              <option value="dip station">Dip Station</option>
              <option value="parallel bars">Parallel Bars</option>
              <option value="resistance tubes">Resistance Tubes</option>
              <option value="weight vest">Weight Vest</option>
              <option value="sandbag">Sandbag</option>
              <option value="weight plate">Weight Plate</option>
              <option value="bench">Weight Bench</option>
              <option value="leg press machine">Leg Press Machine</option>
              <option value="hack squat machine">Hack Squat Machine</option>
              <option value="cable crossover machine">Cable Crossover Machine</option>
              <option value="step platform">Step Platform</option>
              <option value="bosu ball">BOSU Ball</option>
              <option value="balance board">Balance Board</option>
              <option value="functional trainer">Functional Trainer</option>
              <option value="vertical climber">Vertical Climber</option>
              <option value="elliptical cross trainer">Elliptical Cross Trainer</option>
              <option value="stepper">Stepper</option>
              <option value="stair climber">Stair Climber</option>
              <option value="weighted sled">Weighted Sled</option>
              <option value="hand gripper">Hand Gripper</option>
              <option value="resistance loop bands">Resistance Loop Bands</option>
              <option value="stability disc">Stability Disc</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {loading && <p style={{ textAlign: "center" }}>Loading exercises...</p>}
        {error && <p style={{ textAlign: "center", color: "red" }}>{error}</p>}
        {!loading && !error && filteredExercises.length === 0 && (
          <p style={{ textAlign: "center" }}>No exercises found.</p>
        )}

        {/* Exercise Cards */}
        <div className="exercise-list" style={{ marginTop: "1rem" }}>
          {currentExercises.map((ex) => (
            <div
              key={ex.id || ex.name}
              className="exercise-card"
              style={{
                border: "1px solid #ccc",
                borderRadius: "8px",
                padding: "1rem",
                marginBottom: "1rem",
                backgroundColor: "#fff",
                cursor: "pointer"
              }}
              onClick={() => openExerciseModal(ex)}
            >
              {ex.image && (
                <img
                  src={ex.image}
                  alt={ex.name}
                  loading="lazy"
                  style={{ width: "100%", borderRadius: "6px", marginBottom: "0.5rem" }}
                />
              )}
              <h3 style={{ color: "#34495e" }}>{ex.name}</h3>
              {ex.description && <p>{ex.description}</p>}
              {ex.rating && (
                <p style={{ fontSize: "0.9rem", color: "#f39c12" }}>
                  Rating: {ex.rating} / 5
                </p>
              )}
            </div>
          ))}
        </div>
        {renderPagination()}
      </div>

      {/* Sidebar (Optional Advanced Filters Explanation) */}
      <div
        style={{
          width: "250px",
          minWidth: "200px",
          padding: "1rem",
          borderLeft: "1px solid #ccc",
          backgroundColor: "#f7f7f7"
        }}
      >
        <h3 style={{ color: "#34495e" }}>Advanced Filters</h3>
        <p>
          Refine your search by selecting difficulty, muscle group, equipment, and type.
        </p>
      </div>

      {/* Detailed Exercise Modal */}
      {selectedExercise && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000
          }}
          onClick={closeExerciseModal}
        >
          <div
            className="modal-content"
            id="printableExercise"
            ref={printRef}
            style={{
              backgroundColor: "#fff",
              padding: "2rem",
              borderRadius: "8px",
              maxWidth: "600px",
              width: "90%",
              position: "relative",
              maxHeight: "90vh",
              overflowY: "auto"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeExerciseModal}
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                backgroundColor: "transparent",
                border: "none",
                fontSize: "1.5rem",
                cursor: "pointer"
              }}
            >
              &times;
            </button>
            {selectedExercise.image && (
              <img
                src={selectedExercise.image}
                alt={selectedExercise.name}
                loading="lazy"
                style={{ width: "100%", borderRadius: "6px", marginBottom: "1rem" }}
              />
            )}
            <h2 style={{ color: "#34495e" }}>{selectedExercise.name}</h2>
            {/* Video Integration */}
            {selectedExercise.videoUrl ? (
              <div style={{ marginBottom: "1rem" }}>
                <h4>Video Tutorial:</h4>
                <iframe
                  width="100%"
                  height="315"
                  src={selectedExercise.videoUrl}
                  title="Video Tutorial"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            ) : (
              <button
                onClick={() => searchYouTubeVideo(selectedExercise.name)}
                style={{
                  marginBottom: "1rem",
                  padding: "0.5rem 1rem",
                  backgroundColor: "#2980b9",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Search YouTube for Video
              </button>
            )}
            {selectedExercise.description && <p>{selectedExercise.description}</p>}
            {/* Interactive Step-by-Step Instructions */}
            {selectedExercise.instructions && (
              <div>
                <h4>Instructions:</h4>
                <ol>
                  {selectedExercise.instructions.map((step, idx) => (
                    <li
                      key={idx}
                      style={{
                        textDecoration: checkedSteps[idx] ? "line-through" : "none"
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checkedSteps[idx] || false}
                        onChange={() => toggleStepCheck(idx)}
                        style={{ marginRight: "0.5rem" }}
                      />
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            )}
            {/* Required Equipment as Clickable Tags */}
            {selectedExercise.equipment && selectedExercise.equipment.length > 0 && (
              <div>
                <h4>Required Equipment:</h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {selectedExercise.equipment.map((eq, idx) => (
                    <span
                      key={idx}
                      onClick={() => handleEquipmentTagClick(eq)}
                      style={{
                        backgroundColor: "#eee",
                        padding: "0.3rem 0.6rem",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "0.9rem"
                      }}
                    >
                      {eq}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {/* Safety Tips */}
            {selectedExercise.safety && (
              <div>
                <h4>Safety Tips:</h4>
                <p>{selectedExercise.safety}</p>
              </div>
            )}
            {/* Ratings & Reviews */}
            {selectedExercise.rating && (
              <p style={{ fontSize: "0.9rem", color: "#f39c12" }}>
                Average Rating: {selectedExercise.rating} / 5
              </p>
            )}
            <div>
              <h4>User Reviews:</h4>
              {exerciseReviews[selectedExercise.id] ? (
                <ul>
                  {exerciseReviews[selectedExercise.id].map((rev, idx) => (
                    <li key={idx}>
                      {rev.text} <small>({rev.date})</small>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No reviews yet.</p>
              )}
              <textarea
                value={reviewInput}
                onChange={(e) => setReviewInput(e.target.value)}
                placeholder="Write your review here..."
                style={{ width: "100%", padding: "0.5rem", marginTop: "0.5rem" }}
              />
              <button
                onClick={handleSubmitReview}
                style={{
                  marginTop: "0.5rem",
                  padding: "0.5rem 1rem",
                  backgroundColor: "#27ae60",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Submit Review
              </button>
            </div>
            {/* Similar Exercises */}
            {similarExercises.length > 0 && (
              <div style={{ marginTop: "1rem" }}>
                <h4>More Like This:</h4>
                <div style={{ display: "flex", overflowX: "auto", gap: "0.5rem" }}>
                  {similarExercises.map((ex) => (
                    <div
                      key={ex.id || ex.name}
                      style={{
                        minWidth: "150px",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        padding: "0.5rem",
                        backgroundColor: "#fff",
                        cursor: "pointer"
                      }}
                      onClick={() => openExerciseModal(ex)}
                    >
                      {ex.image && (
                        <img
                          src={ex.image}
                          alt={ex.name}
                          loading="lazy"
                          style={{ width: "100%", borderRadius: "4px" }}
                        />
                      )}
                      <p style={{ fontSize: "0.9rem", textAlign: "center" }}>
                        {ex.name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Action Buttons */}
            <div
              style={{
                marginTop: "1rem",
                display: "flex",
                gap: "1rem",
                flexWrap: "wrap"
              }}
            >
              <button
                onClick={() => handleToggleFavorite(selectedExercise)}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: favorites.includes(selectedExercise.id)
                    ? "#c0392b"
                    : "#e67e22",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                {favorites.includes(selectedExercise.id)
                  ? "Remove Favorite"
                  : "Add to Favorites"}
              </button>
              <button
                onClick={() => alert(`Shared "${selectedExercise.name}"!`)}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "#2980b9",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Share Exercise
              </button>
              <button
                onClick={printExercise}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "#7f8c8d",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Print Exercise
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Exercises;
