import React, { useState } from "react";
import "../style.css";
import CreatableSelect from "react-select/creatable";

// Utility to compress HTML for rendering
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

// Pantry options for react-select
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
const pantryOptions = commonPantryOptions.map(item => ({ value: item, label: item }));

// Custom meal plan renderer
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
        if (!updatedEquipment.includes(value)) {
          updatedEquipment.push(value);
        }
      } else {
        updatedEquipment = updatedEquipment.filter((item) => item !== value);
      }
      return { ...prev, equipment: updatedEquipment };
    });
  };

  // --- Workout Generation ---
  const handleGenerateWorkout = async (e) => {
    e.preventDefault();
    // Validation
    if (!formData.age || formData.age <= 0) {
      setWorkoutResult(<p style={{ color: "red" }}>Age must be a positive number.</p>);
      return;
    }
    if (!formData.weight || formData.weight <= 0) {
      setWorkoutResult(<p style={{ color: "red" }}>Current weight must be a positive number.</p>);
      return;
    }
    if (!formData.fitnessGoal) {
      setWorkoutResult(<p style={{ color: "red" }}>Please select a fitness goal.</p>);
      return;
    }
    setLoading(true);
    setWorkoutGenerated(false);
    setWorkoutResult(<p style={{ textAlign: "center" }}>Generating your custom workout plan...</p>);

    try {
      const response = await fetch("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userGoals, formData })
      });
      const data = await response.json();

      // Handle HTTP errors or server-side errors
      if (!response.ok || data.error) {
        setWorkoutResult(
          <p style={{ color: "red" }}>
            {data.error || "An error occurred while generating your workout plan. Please try again later."}
          </p>
        );
        setWorkoutGenerated(false);
      } else if (data.workout) {
        setWorkoutResult(
          <div
            className="workout-result"
            dangerouslySetInnerHTML={{ __html: compressHTML(data.workout) }}
          />
        );
        setWorkoutGenerated(true);
      } else {
        setWorkoutResult(
          <p style={{ color: "red" }}>
            Unexpected response format. Please try again later.
          </p>
        );
        setWorkoutGenerated(false);
      }
    } catch (error) {
      setWorkoutResult(
        <p style={{ color: "red" }}>
          Network error: Unable to generate workout plan. Please check your connection and try again.
        </p>
      );
      setWorkoutGenerated(false);
    } finally {
      setLoading(false);
    }
  };

  // --- Meal Plan Generation ---
  const submitMealPlanRequest = async () => {
    setLoading(true);
    setMealPlanResult(<p style={{ textAlign: "center" }}>Generating your custom meal plan...</p>);
    const mealPayload = {
      userGoals,
      profile: formData,
      dietStyle: mealPlanData.dietStyle,
      allergies: mealPlanData.allergies,
      lactoseIntolerant: mealPlanData.lactoseIntolerant,
      additionalComments: mealPlanData.additionalComments,
      mealPlanOption: mealPlanData.mealPlanOption,
      pantryItems: selectedPantryItems.map(i => i.value)
    };
    try {
      const response = await fetch("/api/meals/generate-meal-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mealPayload)
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      if (data.mealPlanHTML) {
        setMealPlanResult(
          <div
            className="workout-result"
            dangerouslySetInnerHTML={{ __html: compressHTML(data.mealPlanHTML) }}
          />
        );
      } else if (data.mealPlan && data.groceryList && data.nutritionSummary) {
        setMealPlanResult({
          nutritionSummary: data.nutritionSummary,
          mealPlan: data.mealPlan,
          groceryList: data.groceryList
        });
      } else {
        throw new Error("Unexpected response format.");
      }
    } catch (error) {
      setMealPlanResult(<p style={{ color: "red" }}>Error generating meal plan. Please try again later.</p>);
    }
    setLoading(false);
  };

  let currentEquipmentOptions = [];
  if (formData.workoutType) {
    const typeKey = formData.workoutType.toLowerCase();
    currentEquipmentOptions = equipmentOptions[typeKey] || [];
  }

  return (
    <>
      {/* HERO SECTION */}
      <section className="hero" id="hero" aria-labelledby="hero-heading">
        <div className="hero-container">
          <h1 id="hero-heading">Your Personalized Fitness & Nutrition Journey</h1>
          <p>
            Share your lifestyle or fitness goals—for example, "I work long hours and rarely have time to exercise," "I'm a mom who balances parenting and career responsibilities," or "Summer is coming and I want to get in shape" —and receive a workout and nutrition plan crafted specifically for you.
          </p>
          <div className="input-group">
            <input
              type="text"
              id="userGoals"
              placeholder="Share your fitness goals or lifestyle"
              value={userGoals}
              onChange={(e) => setUserGoals(e.target.value)}
            />
            <button id="continueDetails" onClick={handleContinue}>
              Continue
            </button>
          </div>
        </div>
      </section>

      {/* WORKOUT FORM & RESULT */}
      <div className="homepage-content container">
        {detailsVisible && (
          <section id="detailsSection" className="visible">
            <h2>Provide More Details to Personalize Your Plan</h2>
            <form id="fitnessDetailsForm">
              <div className="form-group">
                <label htmlFor="gender">Gender:</label>
                <select id="gender" name="gender" value={formData.gender} onChange={handleChange}>
                  <option value="" disabled>Select your gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="age">Age:</label>
                <input type="number" id="age" name="age" placeholder="Enter your age" min="0" value={formData.age} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="weight">Current Weight:</label>
                <input type="number" id="weight" name="weight" placeholder="Enter your current weight" min="0" value={formData.weight} onChange={handleChange} />
                <select id="weightUnit" name="weightUnit" value={formData.weightUnit} onChange={handleChange}>
                  <option value="kg">kg</option>
                  <option value="lbs">lbs</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="height">Height:</label>
                <input type="number" id="height" name="height" placeholder="Enter your height" min="0" value={formData.height} onChange={handleChange} />
                <select id="heightUnit" name="heightUnit" value={formData.heightUnit} onChange={handleChange}>
                  <option value="cm">cm</option>
                  <option value="ft">ft</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="fitnessGoal">Fitness Goal:</label>
                <select id="fitnessGoal" name="fitnessGoal" value={formData.fitnessGoal} onChange={handleChange}>
                  <option value="" disabled>Select your fitness goal</option>
                  <option value="loseWeight">Lose Weight</option>
                  <option value="gainWeight">Gain Weight</option>
                  <option value="gainMuscle">Gain Muscle</option>
                  <option value="maintainWeight">Maintain Weight</option>
                </select>
              </div>
              {(formData.fitnessGoal === "loseWeight" || formData.fitnessGoal === "gainWeight") && (
                <div className="form-group" id="goalWeightInput">
                  <label htmlFor="goalWeight">Target Weight:</label>
                  <input type="number" id="goalWeight" name="goalWeight" placeholder="Enter your target weight" min="0" value={formData.goalWeight} onChange={handleChange} />
                </div>
              )}
              <div className="form-group">
                <label htmlFor="workoutType">Workout Type:</label>
                <select id="workoutType" name="workoutType" value={formData.workoutType} onChange={handleChange}>
                  <option value="" disabled>Select workout type</option>
                  <option value="bodyweight">Bodyweight</option>
                  <option value="home">Home</option>
                  <option value="gym">Gym</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="fitnessLevel">Fitness Level:</label>
                <select id="fitnessLevel" name="fitnessLevel" value={formData.fitnessLevel} onChange={handleChange}>
                  <option value="" disabled>Select Fitness Level</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="timeCommitment">Time Commitment per Session:</label>
                <select id="timeCommitment" name="timeCommitment" value={formData.timeCommitment} onChange={handleChange}>
                  <option value="" disabled>Select Time Commitment</option>
                  <option value="10-20 minutes">10–20 minutes</option>
                  <option value="20-30 minutes">20–30 minutes</option>
                  <option value="30-45 minutes">30–45 minutes</option>
                  <option value="45-60 minutes">45–60 minutes</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="activityLevel">Activity Level:</label>
                <select id="activityLevel" name="activityLevel" value={formData.activityLevel} onChange={handleChange}>
                  <option value="" disabled>Select Activity Level</option>
                  <option value="Sedentary">Sedentary</option>
                  <option value="Moderately Active">Moderately Active</option>
                  <option value="Very Active">Very Active</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="workoutDays">Workout Days per Week:</label>
                <select id="workoutDays" name="workoutDays" value={formData.workoutDays} onChange={handleChange}>
                  <option value="" disabled>Select workout days per week</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                  <option value="6">6</option>
                  <option value="7">7</option>
                </select>
              </div>
              <div className="form-group" id="equipmentContainer">
                <label>Equipment Available:</label>
                <div id="equipmentOptions">
                  {currentEquipmentOptions.length > 0 ? (
                    currentEquipmentOptions.map((item) => (
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
                    ))
                  ) : (
                    <p style={{ fontStyle: "italic", color: "#777" }}>
                      {formData.workoutType ? "No equipment options available." : "Select a workout type to see equipment options."}
                    </p>
                  )}
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="specificGoals" style={{ color: "#34495e" }}>
                  Specific Fitness Goals:
                </label>
                <input
                  type="text"
                  id="specificGoals"
                  name="specificGoals"
                  placeholder="E.g., abs, toned legs, muscular arms"
                  value={formData.specificGoals}
                  onChange={handleChange}
                />
              </div>
              <button id="generateWorkout" type="button" onClick={handleGenerateWorkout} disabled={loading}>
                {loading ? "Generating..." : "Generate Workout"}
              </button>
            </form>
            <div id="workoutResult">{workoutResult}</div>
          </section>
        )}

        {/* MEAL PLAN SECTION - Only renders if workout has been generated */}
        {workoutGenerated && (
          <section id="mealPlanContainer">
            {!showMealPlanForm && (
              <>
                <div className="workout-footer">
                  <strong>
                    Remember: Your progress depends on both effective workouts and proper nutrition. Would you like to generate a personalized meal plan to fuel your success?
                  </strong>
                </div>
                <div style={{ textAlign: "center", margin: "20px 0" }}>
                  <button
                    id="generateMealPlan"
                    className="meal-plan-btn"
                    onClick={() => setShowMealPlanForm(true)}
                  >
                    Generate Meal Plan
                  </button>
                </div>
              </>
            )}
            {showMealPlanForm && (
              <>
                {/* Meal Plan Preferences */}
                <div className="meal-plan-preferences workout-result">
                  <h3>Meal Plan Preferences</h3>
                  <div className="meal-plan-field">
                    <label>Diet Style:</label>
                    <select
                      value={mealPlanData.dietStyle}
                      onChange={(e) => setMealPlanData({ ...mealPlanData, dietStyle: e.target.value })}
                    >
                      <option value="General">General</option>
                      <option value="Vegetarian">Vegetarian</option>
                      <option value="Keto">Keto</option>
                      <option value="Vegan">Vegan</option>
                      <option value="Paleo">Paleo</option>
                    </select>
                  </div>
                  <div className="meal-plan-field">
                    <label>Allergies:</label>
                    <select
                      value={mealPlanData.allergies}
                      onChange={(e) => setMealPlanData({ ...mealPlanData, allergies: e.target.value })}
                    >
                      <option value="None">None</option>
                      <option value="Peanuts">Peanuts</option>
                      <option value="Tree Nuts">Tree Nuts</option>
                      <option value="Shellfish">Shellfish</option>
                      <option value="Eggs">Eggs</option>
                      <option value="Milk">Milk</option>
                      <option value="Soy">Soy</option>
                      <option value="Wheat">Wheat</option>
                      <option value="Gluten">Gluten</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="meal-plan-field">
                    <label>Are you Lactose Intolerant?</label>
                    <select
                      value={mealPlanData.lactoseIntolerant ? "yes" : "no"}
                      onChange={(e) =>
                        setMealPlanData({ ...mealPlanData, lactoseIntolerant: e.target.value === "yes" })
                      }
                    >
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  </div>
                  <div className="meal-plan-field">
                    <label>Meal Plan Option:</label>
                    <select
                      value={mealPlanData.mealPlanOption}
                      onChange={(e) => setMealPlanData({ ...mealPlanData, mealPlanOption: e.target.value })}
                    >
                      <option value="new">I would like a brand new meal plan</option>
                      <option value="pantry">I would like a meal plan based on what I have in my pantry</option>
                    </select>
                  </div>
                  {mealPlanData.mealPlanOption === "pantry" && (
                    <>
                      <div className="meal-plan-field">
                        <label>Pantry Items:</label>
                        <CreatableSelect
                          isMulti
                          options={pantryOptions}
                          value={selectedPantryItems}
                          onChange={setSelectedPantryItems}
                          placeholder="Type or select pantry items..."
                        />
                      </div>
                    </>
                  )}
                  <div className="meal-plan-field">
                    <label>Additional Comments:</label>
                    <textarea
                      value={mealPlanData.additionalComments}
                      placeholder="Example: I want high protein, low calorie meals"
                      onChange={(e) =>
                        setMealPlanData({ ...mealPlanData, additionalComments: e.target.value })
                      }
                    ></textarea>
                  </div>
                </div>
                <div style={{ textAlign: "center", margin: "20px 0" }}>
                  <button id="submitMealPlan" className="meal-plan-btn" onClick={submitMealPlanRequest} disabled={loading}>
                    {loading ? "Generating..." : "Generate Custom Meal Plan"}
                  </button>
                </div>
                {/* Meal Plan Result */}
                {mealPlanResult &&
                  (typeof mealPlanResult === "string" ? (
                    <div id="mealPlanResult" className="workout-result" style={{ marginTop: "20px" }}>
                      {mealPlanResult}
                    </div>
                  ) : (
                    <div id="mealPlanResult" className="workout-result" style={{ marginTop: "20px" }}>
                      {renderMealPlan(
                        mealPlanResult.mealPlan,
                        mealPlanResult.groceryList,
                        mealPlanResult.nutritionSummary
                      )}
                    </div>
                  ))}
              </>
            )}
          </section>
        )}

        {/* FEATURES SECTION */}
        <section className="features">
          <h2>Why Choose Our AI-Powered Service?</h2>
          <div className="features-grid">
            <div className="card">
              <img src="https://via.placeholder.com/300x200?text=Workouts" alt="Workouts" />
              <h3>Custom Workouts</h3>
              <p>Your workout plans are generated by our AI to perfectly match your unique profile and goals.</p>
            </div>
            <div className="card">
              <img src="https://via.placeholder.com/300x200?text=Meal+Plans" alt="Meal Plans" />
              <h3>Personalized Meal Plans</h3>
              <p>Our AI creates diverse meal plans that suit your dietary needs and flavor preferences.</p>
            </div>
            <div className="card">
              <img src="https://via.placeholder.com/300x200?text=Progress" alt="Tracking Progress" />
              <h3>Progress Tracking</h3>
              <p>Monitor your fitness journey and see your transformation over time with our intuitive dashboard.</p>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section id="howItWorks" className="how-it-works">
          <h2>How It Works</h2>
          <p>
            Our AI connects with you to learn about your lifestyle and then generates personalized workout and meal plans designed just for you.
          </p>
          <h3>Your Custom 7-Day Workout Plan</h3>
          <ul>
            <li><strong>Efficient Routines:</strong> Dynamic routines adapted to your schedule.</li>
            <li><strong>Home &amp; Gym Options:</strong> Exercises tailored for your environment.</li>
            <li><strong>Balanced Recovery:</strong> Ensuring optimal results with proper rest.</li>
          </ul>
          <h3>Your Personalized Meal Plan</h3>
          <ul>
            <li><strong>Calorie &amp; Macro Guidance:</strong> AI‑generated nutrition plans based on your profile.</li>
            <li><strong>Diverse Recipes:</strong> Enjoy a variety of dishes crafted for your tastes.</li>
          </ul>
          <p>Experience the future of fitness and nutrition with complete AI personalization.</p>
        </section>

        {/* CALL TO ACTION SECTION */}
        <section className="cta" id="cta">
          <div className="cta-container">
            <h2>Take Charge of Your Health Today</h2>
            <p>Join a community of fitness enthusiasts transforming their lives through AI-powered personalization.</p>
            <button id="startNow">Start Now</button>
          </div>
        </section>
      </div>
    </>
  );
};

export default HomePage;
