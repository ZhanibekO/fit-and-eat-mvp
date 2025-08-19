// src/pages/HomePage.js

import React, { useState } from "react";
import "../style.css"; // style.css is in the src folder
import CreatableSelect from "react-select/creatable";

// A small utility to remove extra whitespace from HTML, if needed.
function compressHTML(html) {
  return html.replace(/\n/g, "").replace(/>\s+</g, "><").trim();
}

// Equipment options by workout type
const equipmentOptions = {
  gym: [
    "Dumbbells",
    "Barbells",
    "Kettlebells",
    "Adjustable Bench",
    "Squat Rack / Power Rack",
    "Cable Machines",
    "Leg Press Machine",
    "Smith Machine",
    "Treadmill",
    "Elliptical Trainer",
    "Stationary Bike",
    "Rowing Machine",
    "Lat Pulldown Machine",
    "Chest Press Machine",
    "Pec Deck Machine",
    "Leg Extension Machine",
    "Leg Curl Machine",
    "Battle Ropes",
    "TRX Suspension Trainer",
    "Medicine Ball",
    "Weight Plates",
    "Cable Cross-Over Machine",
    "Multi-Station Training Machine"
  ],
  home: [
    "Yoga Mat",
    "Resistance Bands",
    "Stability Ball",
    "Pull-up Bar",
    "Adjustable Dumbbells",
    "Kettlebells",
    "Jump Rope",
    "Foam Roller",
    "Balance Board",
    "Step Bench",
    "Suspension Trainer (like TRX)",
    "Ab Wheel",
    "Pilates Ring",
    "Doorway Row Bar",
    "Mini Trampoline"
  ],
  bodyweight: [
    "No Equipment",
    "Pull-up Bar",
    "Parallettes",
    "Gymnastic Rings",
    "Ab Roller",
    "Suspension-Trainer (like TRX)"
  ]
};

// Common pantry options – extended list.
const commonPantryOptions = [
  "Rice (white, brown, jasmine, basmati)",
  "Pasta (spaghetti, penne, macaroni)",
  "Oats (rolled, steel-cut)",
  "Quinoa",
  "Couscous",
  "Bulgur wheat",
  "Lentils (red, green, brown)",
  "Dried black beans",
  "Dried kidney beans",
  "Dried chickpeas",
  "Dried pinto beans",
  "Dried black-eyed peas",
  "Canned black beans",
  "Canned cannellini beans",
  "Canned chickpeas",
  "Canned tomatoes (diced, crushed, whole peeled)",
  "Tomato paste",
  "Canned corn",
  "Canned tuna",
  "Canned salmon",
  "Canned coconut milk",
  "Chicken broth",
  "Beef broth",
  "Vegetable broth",
  "Stock cubes",
  "All-purpose flour",
  "Whole wheat flour",
  "Cornstarch",
  "Baking powder",
  "Baking soda",
  "Granulated sugar",
  "Brown sugar",
  "Powdered sugar",
  "Honey",
  "Maple syrup",
  "Salt",
  "Black pepper",
  "Oregano",
  "Basil",
  "Thyme",
  "Rosemary",
  "Sage",
  "Cumin",
  "Paprika",
  "Turmeric",
  "Chili powder",
  "Cinnamon",
  "Nutmeg",
  "Garlic powder",
  "Onion powder",
  "Soy sauce",
  "Tamari",
  "Rice vinegar",
  "Balsamic vinegar",
  "Olive oil",
  "Vegetable oil",
  "Coconut oil",
  "Hot sauce",
  "Mustard",
  "Ketchup",
  "Mayonnaise",
  "Peanut butter",
  "Almond butter",
  "Jam",
  "Jelly",
  "Tea bags",
  "Ground coffee",
  "Cereal",
  "Granola",
  "Crackers",
  "Almonds",
  "Walnuts",
  "Cashews",
  "Pecans",
  "Chia seeds",
  "Flax seeds",
  "Pumpkin seeds",
  "Raisins",
  "Dried cranberries",
  "Dried apricots",
  "Canned chili",
  "Salsa",
  "Pickles",
  "Capers",
  "Nutritional yeast",
  "Instant noodles",
  "Ramen"
];

// Map commonPantryOptions for use in react-select.
const pantryOptions = commonPantryOptions.map(item => ({ value: item, label: item }));

// Custom render for meal plan results
const renderMealPlan = (mealPlan, groceryList, nutritionSummary) => {
  if (!mealPlan || typeof mealPlan !== "object") {
    return <div>Generating your custom meal plan...</div>;
  }
  return (
    <div>
      {nutritionSummary && (
        <div className="nutrition-summary workout-result" style={{ padding: "1rem", marginBottom: "1rem" }}>
          <p>{nutritionSummary}</p>
        </div>
      )}
      <h4>Meal Plan</h4>
      <div className="meal-plan-umbrella">
        {Object.entries(mealPlan).map(([day, plan]) => (
          <div key={day} className="meal-plan-day">
            <h5>{day}</h5>
            {typeof plan === "string" ? (
              <p>{plan}</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ padding: "8px", border: "1px solid #ccc" }}>Meal</th>
                    <th style={{ padding: "8px", border: "1px solid #ccc" }}>Recipe</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.meals.map((meal, idx) => (
                    <tr key={idx}>
                      <td style={{ padding: "8px", border: "1px solid #ccc" }}>{meal.title}</td>
                      <td style={{ padding: "8px", border: "1px solid #ccc" }}>
                        <div dangerouslySetInnerHTML={{ __html: meal.recipe.replace(/\n/g, "<br>") }}></div>
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan="2" style={{ padding: "8px", border: "1px solid #ccc" }}>
                      <strong>Daily Macros:</strong> {plan.dailyMacros}
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        ))}
      </div>
      <h4>Grocery List</h4>
      <div className="grocery-list-umbrella">
        {Object.entries(groceryList).map(([category, items]) => (
          <p key={category}>
            <strong>{category}:</strong> {items.join(", ")}
          </p>
        ))}
      </div>
    </div>
  );
};

const HomePage = () => {
  const [userGoals, setUserGoals] = useState("");
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [formData, setFormData] = useState({
    gender: "",
    age: "",
    weight: "",
    weightUnit: "kg",
    height: "",
    heightUnit: "cm",
    fitnessGoal: "",
    goalWeight: "",
    workoutType: "",
    fitnessLevel: "",
    timeCommitment: "",
    activityLevel: "",
    specificGoals: "",
    equipment: [],
    workoutDays: "7"
  });
  const [workoutResult, setWorkoutResult] = useState("");
  const [mealPlanResult, setMealPlanResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [workoutGenerated, setWorkoutGenerated] = useState(false);
  const [showMealPlanForm, setShowMealPlanForm] = useState(false);
  const [mealPlanData, setMealPlanData] = useState({
    dietStyle: "General",
    allergies: "None",
    lactoseIntolerant: false,
    additionalComments: "",
    mealPlanOption: "new",
    pantryItems: ""
  });
  const [selectedPantryItems, setSelectedPantryItems] = useState([]);

  const handleContinue = (e) => {
    e.preventDefault();
    if (!userGoals.trim()) {
      alert("Please tell us about your goals or lifestyle to continue.");
      return;
    }
    setDetailsVisible(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "workoutType") {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        equipment: []
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleEquipmentChange = (e) => {
    const { value, checked } = e.target;
    setFormData((prev) => {
      let updatedEquipment = [...prev.equipment];
            if (checked) {
        updatedEquipment.push(value);
      } else {
        updatedEquipment = updatedEquipment.filter((item) => item !== value);
      }
      return { ...prev, equipment: updatedEquipment };
    });
  };

  const handleGenerateWorkout = async () => {
    setLoading(true);
    setWorkoutResult("");
    try {
      const response = await fetch("/api/gpt", {  // ✅ updated endpoint
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData, userGoals })
      });
      if (!response.ok) throw new Error("Failed to generate workout");
      const data = await response.json();
      setWorkoutResult(data.workout || "No workout generated.");
      setWorkoutGenerated(true);
    } catch (err) {
      setWorkoutResult("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMealPlanGenerate = async () => {
    setLoading(true);
    setMealPlanResult("");
    try {
      const res = await fetch("/api/mealplan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...mealPlanData, pantryItems: selectedPantryItems.map(i => i.value) })
      });
      if (!res.ok) throw new Error("Failed to generate meal plan");
      const data = await res.json();
      setMealPlanResult(data);
    } catch (err) {
      setMealPlanResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-page">
      <h2>Welcome to Your Fitness & Nutrition Planner</h2>

      {!detailsVisible ? (
        <form onSubmit={handleContinue}>
          <textarea
            placeholder="Tell us about your fitness goals, challenges, or lifestyle..."
            value={userGoals}
            onChange={(e) => setUserGoals(e.target.value)}
          />
          <button type="submit">Continue</button>
        </form>
      ) : (
        <div className="details-form">
          <input
            type="text"
            name="gender"
            placeholder="Gender"
            value={formData.gender}
            onChange={handleChange}
          />
          {/* Add your other inputs here */}
          <div>
            <label>Equipment:</label>
            {equipmentOptions[formData.workoutType || "gym"].map((item) => (
              <div key={item}>
                <label>
                  <input
                    type="checkbox"
                    value={item}
                    checked={formData.equipment.includes(item)}
                    onChange={handleEquipmentChange}
                  />
                  {item}
                </label>
              </div>
            ))}
          </div>

          <button onClick={handleGenerateWorkout} disabled={loading}>
            {loading ? "Generating..." : "Generate Workout"}
          </button>

          {workoutResult && (
            <div className="workout-result">
              <h3>Your Workout Plan</h3>
              <div>{workoutResult}</div>
            </div>
          )}

          {workoutGenerated && (
            <div>
              <h3>Ready for a Meal Plan?</h3>
              <button onClick={() => setShowMealPlanForm(true)}>Yes</button>
            </div>
          )}

          {showMealPlanForm && (
            <div className="meal-plan-form">
              <input
                type="text"
                placeholder="Diet Style"
                value={mealPlanData.dietStyle}
                onChange={(e) => setMealPlanData({ ...mealPlanData, dietStyle: e.target.value })}
              />
              <CreatableSelect
                isMulti
                options={pantryOptions}
                value={selectedPantryItems}
                onChange={setSelectedPantryItems}
              />
              <button onClick={handleMealPlanGenerate} disabled={loading}>
                {loading ? "Generating..." : "Generate Meal Plan"}
              </button>
            </div>
          )}

          {mealPlanResult && !mealPlanResult.error && renderMealPlan(
            mealPlanResult.mealPlan,
            mealPlanResult.groceryList,
            mealPlanResult.nutritionSummary
          )}
          {mealPlanResult.error && <p>{mealPlanResult.error}</p>}
        </div>
      )}
    </div>
  );
};

export default HomePage;
