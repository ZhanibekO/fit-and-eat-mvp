// src/pages/MealPlans.js
import React, { useState, useEffect } from "react";
import SearchBar from "../components/SearchBar";

const MealPlans = () => {
  // Core data state
  const [recipes, setRecipes] = useState([]);
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [recommendedRecipes, setRecommendedRecipes] = useState([]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [mealFilters, setMealFilters] = useState({
    category: "all",
    difficulty: "all",
    dietary: "all",
    totalTime: "all",
    equipment: "all",
  });
  const [sortOption, setSortOption] = useState("default");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modal state for selected recipe
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  // -----------------------
  // Fetch recipes from API
  // -----------------------
  useEffect(() => {
    const fetchRecipes = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/mealplans");
        const data = await res.json();
        if (data && data.recipes) {
          setRecipes(data.recipes);
          setFilteredRecipes(data.recipes);
        } else {
          setError("No recipes data received.");
        }
      } catch (err) {
        console.error("Error fetching recipes:", err);
        setError("Failed to load recipes. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, []);

  // -----------------------
  // Fetch recommended recipes
  // -----------------------
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const res = await fetch("/api/mealplans/recommendations");
        const data = await res.json();
        if (data && data.recommended) {
          setRecommendedRecipes(data.recommended);
        }
      } catch (err) {
        console.error("Error fetching recommendations:", err);
      }
    };

    fetchRecommendations();
  }, []);

  // -----------------------
  // Filtering and Sorting
  // -----------------------
  useEffect(() => {
    setCurrentPage(1); // Reset page when filters or sorting change
    filterRecipes(searchQuery, mealFilters, sortOption);
  }, [searchQuery, mealFilters, sortOption, recipes]);

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setMealFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSortChange = (e) => {
    setSortOption(e.target.value);
  };

  // Apply filters & sorting
  const filterRecipes = (query, filters, sortOpt) => {
    let filtered = recipes;

    // Search filter (by recipe name)
    if (query) {
      filtered = filtered.filter((recipe) =>
        recipe.name.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Category filter
    if (filters.category !== "all") {
      filtered = filtered.filter((recipe) =>
        recipe.category
          ? recipe.category.toLowerCase() === filters.category.toLowerCase()
          : true
      );
    }

    // Difficulty filter
    if (filters.difficulty !== "all") {
      filtered = filtered.filter((recipe) =>
        recipe.difficulty
          ? recipe.difficulty.toLowerCase() === filters.difficulty.toLowerCase()
          : true
      );
    }

    // Dietary filter
    if (filters.dietary !== "all") {
      filtered = filtered.filter((recipe) =>
        recipe.dietary
          ? recipe.dietary.toLowerCase() === filters.dietary.toLowerCase()
          : true
      );
    }

    // Total Time filter (assuming recipe.totalTime in minutes)
    if (filters.totalTime !== "all") {
      if (filters.totalTime === "under30") {
        filtered = filtered.filter(
          (recipe) => recipe.totalTime && recipe.totalTime < 30
        );
      } else if (filters.totalTime === "30to60") {
        filtered = filtered.filter(
          (recipe) =>
            recipe.totalTime &&
            recipe.totalTime >= 30 &&
            recipe.totalTime <= 60
        );
      } else if (filters.totalTime === "over60") {
        filtered = filtered.filter(
          (recipe) => recipe.totalTime && recipe.totalTime > 60
        );
      }
    }

    // Equipment filter. If set, ensure the recipe's equipment array includes the chosen equipment.
    if (filters.equipment !== "all") {
      filtered = filtered.filter(
        (recipe) =>
          recipe.equipment &&
          recipe.equipment
            .map((eq) => eq.toLowerCase())
            .includes(filters.equipment.toLowerCase())
      );
    }

    // Sorting
    if (sortOpt === "popularity") {
      filtered.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    } else if (sortOpt === "rating") {
      filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortOpt === "prepTime") {
      filtered.sort((a, b) => (a.prepTime || 0) - (b.prepTime || 0));
    }

    setFilteredRecipes(filtered);
  };

  // -----------------------
  // Pagination Logic
  // -----------------------
  const indexOfLastRecipe = currentPage * itemsPerPage;
  const indexOfFirstRecipe = indexOfLastRecipe - itemsPerPage;
  const currentRecipes = filteredRecipes.slice(indexOfFirstRecipe, indexOfLastRecipe);
  const totalPages = Math.ceil(filteredRecipes.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

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
              backgroundColor: currentPage === index + 1 ? "#27ae60" : "#eee",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            {index + 1}
          </button>
        ))}
      </div>
    );
  };

  // -----------------------
  // Modal Actions & Helpers
  // -----------------------
  const openRecipeModal = (recipe) => {
    setSelectedRecipe(recipe);
  };

  const closeRecipeModal = () => {
    setSelectedRecipe(null);
  };

  // Equipment tag click => update the equipment filter
  const handleEquipmentTagClick = (equipment) => {
    setMealFilters((prev) => ({ ...prev, equipment: equipment.toLowerCase() }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Print recipe: opens a print-friendly window
  const printRecipe = () => {
    if (!selectedRecipe) return;
    const printContent = document.getElementById("printableRecipe").innerHTML;
    const printWindow = window.open("", "", "width=800,height=600");
    printWindow.document.write(`
      <html>
        <head>
          <title>${selectedRecipe.name} - Recipe</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h2 { color: #34495e; }
            img { max-width: 100%; border-radius: 6px; }
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

  // Video search: If no video URL is provided, open a YouTube search for the recipe
  const searchYouTubeVideo = (recipeName) => {
    const query = encodeURIComponent(recipeName + " recipe");
    window.open(`https://www.youtube.com/results?search_query=${query}`, "_blank");
  };

  // Placeholder action handlers
  const handleAddToFavorites = (recipe) => {
    alert(`Added "${recipe.name}" to favorites!`);
  };

  const handleShareRecipe = (recipe) => {
    alert(`Shared "${recipe.name}"!`);
  };

  const handleAddIngredientsToShoppingList = (recipe) => {
    alert(`Ingredients for "${recipe.name}" added to your shopping list!`);
  };

  // -----------------------
  // Render Component
  // -----------------------
  return (
    <div className="mealplans-page" style={{ display: "flex", flexWrap: "wrap" }}>
      {/* Main Content Column */}
      <div style={{ flex: "1 1 600px", padding: "1rem" }}>
        {/* Recommended Recipes Section */}
        {recommendedRecipes.length > 0 && (
          <div style={{ marginBottom: "2rem" }}>
            <h2 style={{ color: "#34495e" }}>Recommended for You</h2>
            <div style={{ display: "flex", overflowX: "auto", gap: "1rem" }}>
              {recommendedRecipes.map((recipe) => (
                <div
                  key={recipe.id || recipe.name}
                  style={{
                    minWidth: "200px",
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                    padding: "0.5rem",
                    backgroundColor: "#fff",
                    cursor: "pointer",
                  }}
                  onClick={() => openRecipeModal(recipe)}
                >
                  {recipe.image && (
                    <img
                      src={recipe.image}
                      alt={recipe.name}
                      style={{ width: "100%", borderRadius: "6px" }}
                    />
                  )}
                  <h4 style={{ margin: "0.5rem 0", color: "#34495e" }}>
                    {recipe.name}
                  </h4>
                </div>
              ))}
            </div>
          </div>
        )}

        <h2 style={{ color: "#34495e", marginBottom: "1rem" }}>
          Healthy Meal Library
        </h2>
        <SearchBar onSearch={handleSearch} />

        {/* Inline Advanced Filters */}
        <div style={{ marginBottom: "1rem" }}>
          <div style={{ marginBottom: "0.5rem" }}>
            <label htmlFor="category" style={{ marginRight: "0.5rem" }}>
              Category:
            </label>
            <select
              name="category"
              id="category"
              value={mealFilters.category}
              onChange={handleFilterChange}
            >
              <option value="all">All</option>
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
              <option value="dessert">Dessert</option>
              <option value="drink">Drink</option>
              <option value="smoothie">Smoothie</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div style={{ marginBottom: "0.5rem" }}>
            <label htmlFor="difficulty" style={{ marginRight: "0.5rem" }}>
              Difficulty:
            </label>
            <select
              name="difficulty"
              id="difficulty"
              value={mealFilters.difficulty}
              onChange={handleFilterChange}
            >
              <option value="all">All</option>
              <option value="easy">Easy</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <div style={{ marginBottom: "0.5rem" }}>
            <label htmlFor="dietary" style={{ marginRight: "0.5rem" }}>
              Dietary:
            </label>
            <select
              name="dietary"
              id="dietary"
              value={mealFilters.dietary}
              onChange={handleFilterChange}
            >
              <option value="all">All</option>
              <option value="vegan">Vegan</option>
              <option value="vegetarian">Vegetarian</option>
              <option value="gluten-free">Gluten-Free</option>
              <option value="keto">Keto</option>
              <option value="paleo">Paleo</option>
              <option value="low-carb">Low-Carb</option>
            </select>
          </div>
          <div style={{ marginBottom: "0.5rem" }}>
            <label htmlFor="totalTime" style={{ marginRight: "0.5rem" }}>
              Total Time:
            </label>
            <select
              name="totalTime"
              id="totalTime"
              value={mealFilters.totalTime}
              onChange={handleFilterChange}
            >
              <option value="all">All</option>
              <option value="under30">Under 30 minutes</option>
              <option value="30to60">30-60 minutes</option>
              <option value="over60">Over 60 minutes</option>
            </select>
          </div>
          <div style={{ marginBottom: "0.5rem" }}>
            <label htmlFor="equipment" style={{ marginRight: "0.5rem" }}>
              Equipment:
            </label>
            <select
              name="equipment"
              id="equipment"
              value={mealFilters.equipment}
              onChange={handleFilterChange}
            >
              <option value="all">All</option>
              <option value="blender">Blender</option>
              <option value="oven">Oven</option>
              <option value="stove">Stove</option>
              <option value="food processor">Food Processor</option>
              <option value="microwave">Microwave</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div style={{ marginBottom: "0.5rem" }}>
            <label htmlFor="sort" style={{ marginRight: "0.5rem" }}>
              Sort By:
            </label>
            <select name="sort" id="sort" value={sortOption} onChange={handleSortChange}>
              <option value="default">Default</option>
              <option value="popularity">Popularity</option>
              <option value="rating">Rating</option>
              <option value="prepTime">Preparation Time</option>
            </select>
          </div>
        </div>

        {loading && <p style={{ textAlign: "center" }}>Loading recipes...</p>}
        {error && <p style={{ textAlign: "center", color: "red" }}>{error}</p>}
        {!loading && !error && filteredRecipes.length === 0 && (
          <p style={{ textAlign: "center" }}>No recipes found.</p>
        )}

        {/* Recipe Cards List */}
        <div className="recipe-list" style={{ marginTop: "1rem" }}>
          {currentRecipes.map((recipe) => (
            <div
              key={recipe.id || recipe.name}
              className="recipe-card"
              style={{
                border: "1px solid #ccc",
                borderRadius: "8px",
                padding: "1rem",
                marginBottom: "1rem",
                backgroundColor: "#fff",
                cursor: "pointer",
              }}
              onClick={() => openRecipeModal(recipe)}
            >
              {recipe.image && (
                <img
                  src={recipe.image}
                  alt={recipe.name}
                  style={{ width: "100%", borderRadius: "6px", marginBottom: "0.5rem" }}
                />
              )}
              <h3 style={{ color: "#34495e" }}>{recipe.name}</h3>
              {recipe.category && (
                <p>
                  <strong>Category:</strong> {recipe.category}
                </p>
              )}
              {recipe.description && <p>{recipe.description}</p>}
              {recipe.macros && (
                <p style={{ fontSize: "0.9rem", color: "#555" }}>
                  Calories: {recipe.macros.calories} kcal, Protein: {recipe.macros.protein}g, Carbs: {recipe.macros.carbs}g, Fat: {recipe.macros.fat}g
                </p>
              )}
              {recipe.rating && (
                <p style={{ fontSize: "0.9rem", color: "#f39c12" }}>
                  Rating: {recipe.rating} / 5
                </p>
              )}
            </div>
          ))}
        </div>
        {renderPagination()}
      </div>

      {/* Optional Sidebar */}
      <div
        style={{
          width: "250px",
          minWidth: "200px",
          padding: "1rem",
          borderLeft: "1px solid #ccc",
          backgroundColor: "#f7f7f7",
        }}
      >
        <h3 style={{ color: "#34495e" }}>Advanced Filters</h3>
        <p>
          Adjust filters above to refine recipes by category, difficulty, dietary preferences, total time, and equipment.
        </p>
      </div>

      {/* Detailed Recipe Modal */}
      {selectedRecipe && (
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
            zIndex: 1000,
          }}
          onClick={closeRecipeModal}
        >
          <div
            className="modal-content"
            id="printableRecipe"
            style={{
              backgroundColor: "#fff",
              padding: "2rem",
              borderRadius: "8px",
              maxWidth: "600px",
              width: "90%",
              position: "relative",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeRecipeModal}
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                backgroundColor: "transparent",
                border: "none",
                fontSize: "1.5rem",
                cursor: "pointer",
              }}
            >
              &times;
            </button>
            {selectedRecipe.image && (
              <img
                src={selectedRecipe.image}
                alt={selectedRecipe.name}
                style={{ width: "100%", borderRadius: "6px", marginBottom: "1rem" }}
              />
            )}
            <h2 style={{ color: "#34495e" }}>{selectedRecipe.name}</h2>
            {selectedRecipe.videoUrl ? (
              <div style={{ marginBottom: "1rem" }}>
                <h4>Video Tutorial:</h4>
                <iframe
                  width="100%"
                  height="315"
                  src={selectedRecipe.videoUrl}
                  title="Video Tutorial"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            ) : (
              <button
                onClick={() => searchYouTubeVideo(selectedRecipe.name)}
                style={{
                  marginBottom: "1rem",
                  padding: "0.5rem 1rem",
                  backgroundColor: "#2980b9",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Search YouTube for Video
              </button>
            )}
            {selectedRecipe.description && <p>{selectedRecipe.description}</p>}
            {selectedRecipe.ingredients && (
              <div>
                <h4>Ingredients:</h4>
                <ul>
                  {selectedRecipe.ingredients.map((ing, idx) => (
                    <li key={idx}>{ing}</li>
                  ))}
                </ul>
              </div>
            )}
            {selectedRecipe.instructions && (
              <div>
                <h4>Instructions:</h4>
                <ol>
                  {selectedRecipe.instructions.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </div>
            )}
            {selectedRecipe.macros && (
              <div>
                <h4>Nutrition:</h4>
                <p>
                  <strong>Calories:</strong> {selectedRecipe.macros.calories} kcal
                  <br />
                  <strong>Protein:</strong> {selectedRecipe.macros.protein} g
                  <br />
                  <strong>Carbs:</strong> {selectedRecipe.macros.carbs} g
                  <br />
                  <strong>Fat:</strong> {selectedRecipe.macros.fat} g
                  {selectedRecipe.servings && (
                    <span>, Servings: {selectedRecipe.servings}</span>
                  )}
                </p>
              </div>
            )}
            {selectedRecipe.difficulty && (
              <p>
                <strong>Difficulty:</strong> {selectedRecipe.difficulty}
              </p>
            )}
            {selectedRecipe.equipment && selectedRecipe.equipment.length > 0 && (
              <div>
                <h4>Required Equipment:</h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {selectedRecipe.equipment.map((eq, idx) => (
                    <span
                      key={idx}
                      onClick={() => handleEquipmentTagClick(eq)}
                      style={{
                        backgroundColor: "#eee",
                        padding: "0.3rem 0.6rem",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "0.9rem",
                      }}
                    >
                      {eq}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {selectedRecipe.substitutions && selectedRecipe.substitutions.length > 0 && (
              <div>
                <h4>Ingredient Substitutions:</h4>
                <ul>
                  {selectedRecipe.substitutions.map((sub, idx) => (
                    <li key={idx}>{sub}</li>
                  ))}
                </ul>
              </div>
            )}
            {/* Action Buttons */}
            <div
              style={{
                marginTop: "1rem",
                display: "flex",
                gap: "1rem",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={() => handleAddToFavorites(selectedRecipe)}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "#e67e22",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Add to Favorites
              </button>
              <button
                onClick={() => handleShareRecipe(selectedRecipe)}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "#2980b9",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Share Recipe
              </button>
              <button
                onClick={() => handleAddIngredientsToShoppingList(selectedRecipe)}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "#27ae60",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Add Ingredients to Shopping List
              </button>
              <button
                onClick={printRecipe}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "#7f8c8d",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Print Recipe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MealPlans;
