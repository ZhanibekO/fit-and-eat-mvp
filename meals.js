// src/meals.js

const express = require("express");
const fetch = require("node-fetch");
const router = express.Router();

// Access API key from environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error("API Key is missing in meals.js. Please check your .env file.");
  process.exit(1);
}

/*
  Helper functions to calculate nutrition based on the Mifflin-St Jeor equation.
*/

// Calculate TDEE based on gender, weight (kg), height (cm), age, and activity level.
function calculateTDEE(gender, weight, height, age, activityLevel) {
  let BMR;
  if (gender.toLowerCase() === "male") {
    BMR = (10 * weight) + (6.25 * height) - (5 * age) + 5;
  } else {
    BMR = (10 * weight) + (6.25 * height) - (5 * age) - 161;
  }

  let activityFactor;
  switch (activityLevel.toLowerCase()) {
    case "sedentary":
      activityFactor = 1.2;
      break;
    case "moderately active":
      activityFactor = 1.55;
      break;
    case "very active":
      activityFactor = 1.725;
      break;
    default:
      activityFactor = 1.2;
  }

  return Math.round(BMR * activityFactor);
}

// Adjust calories based on fitness goal (reduce for weight loss, increase for muscle gain)
function adjustCaloriesForGoal(tdee, fitnessGoal) {
  if (fitnessGoal === "loseWeight") {
    return Math.round(tdee * 0.85);
  } else if (fitnessGoal === "gainMuscle") {
    return Math.round(tdee * 1.10);
  }
  return tdee;
}

// Calculate macronutrient targets using a 30/40/30 split (Protein/Carbs/Fat)
function calculateMacros(calories) {
  const proteinCalories = calories * 0.30;
  const carbsCalories = calories * 0.40;
  const fatCalories = calories * 0.30;
  return {
    protein: Math.round(proteinCalories / 4),  // 4 kcal per gram protein
    carbs: Math.round(carbsCalories / 4),        // 4 kcal per gram carbohydrate
    fat: Math.round(fatCalories / 9)             // 9 kcal per gram fat
  };
}

/*
  Meal Plan Prompt Documentation:
  This prompt instructs OpenAI to generate a fully structured, personalized weekly meal plan.
  NOTE: Each meal's "recipe" field must include a detailed, step-by-step recipe—
  including a clear and precise ingredient list with exact quantities.
  For example, if a recipe calls for "mixed vegetables," specify: 
  "1 cup broccoli, ½ cup carrots, ½ cup zucchini, and ½ cup red bell pepper."
  Also include detailed preparation instructions, cooking times, techniques, and helpful tips.
*/
router.post("/generate-meal-plan", async (req, res) => {
  // Extract meal plan fields.
  const {
    dietStyle,
    allergies,
    lactoseIntolerant,
    additionalComments,
    mealPlanOption,
    pantryItems
  } = req.body;
  
  // Extract the free‑text lifestyle and goals.
  const { userGoals } = req.body; // Ensure HomePage.js sends this

  console.log("Received Meal Preferences (meals.js):", {
    userGoals,
    dietStyle,
    allergies,
    lactoseIntolerant,
    additionalComments,
    mealPlanOption,
    pantryItems,
  });
  
  if (!dietStyle || !allergies) {
    return res.status(400).json({ error: "Missing required fields for meal plan generation." });
  }

  // Extract user's profile data – assumed to come as req.body.profile.
  const { gender, weight, height, age, activityLevel, fitnessGoal } = req.body.profile || {};
  let nutritionSummaryMessage = "";
  let adjustedCalories;
  let macros;
  if (gender && weight && height && age && activityLevel && fitnessGoal) {
    const tdee = calculateTDEE(gender, parseFloat(weight), parseFloat(height), parseFloat(age), activityLevel);
    adjustedCalories = adjustCaloriesForGoal(tdee, fitnessGoal);
    macros = calculateMacros(adjustedCalories);
    const goalText =
      fitnessGoal === "loseWeight"
        ? "weight loss"
        : fitnessGoal === "gainMuscle"
        ? "muscle gain"
        : "overall fitness";
    nutritionSummaryMessage = `Based on your fitness goals, your daily target is approximately ${adjustedCalories} calories per day. This includes around ${macros.protein}g protein, ${macros.carbs}g carbohydrates, and ${macros.fat}g fat to fuel your workouts and support ${goalText}. Enjoy balanced meals and nutritious snacks throughout the day.`;
  } else {
    // Assign default values so adjustedCalories and macros are always defined.
    adjustedCalories = 1650;
    macros = { protein: 125, carbs: 150, fat: 50 };
    nutritionSummaryMessage =
      "Based on your fitness goals, this personalized high‑protein meal plan is designed to provide approximately 1650 calories per day, including around 125g protein, 150g carbohydrates, and 50g fat.";
  }

  // Build the prompt with detailed recipe instructions.
  const mealPlanPrompt = `Generate a personalized weekly meal plan based on the following details:
- User Lifestyle & Goals: ${userGoals || "No additional details provided"}
- Dietary Preferences: ${dietStyle || "General"}
- Allergies: ${allergies || "None"}
- Lactose Intolerant: ${lactoseIntolerant ? "Yes" : "No"}
- Additional Comments: ${additionalComments || "No additional comments provided"}
- Meal Plan Option: ${mealPlanOption || "new"}
- Pantry Inventory: ${pantryItems || "none"}

${nutritionSummaryMessage}

IMPORTANT: When generating the meal plan, ensure that the combined recipes for breakfast, lunch, dinner, and snacks for each day add up closely to the overall daily nutritional targets of approximately ${adjustedCalories} calories (roughly ${macros.protein}g protein, ${macros.carbs}g carbohydrates, and ${macros.fat}g fat). Adjust portion sizes if necessary to meet these goals.
ALSO, ensure that each recipe includes a clear and precise ingredient list with exact quantities. For example, if a recipe calls for "mixed vegetables," specify: "1 cup broccoli, ½ cup carrots, ½ cup zucchini, and ½ cup red bell pepper."
Provide detailed step-by-step instructions including preparation instructions, cooking times, techniques, and any helpful tips for each meal.

RETURN ONLY a valid JSON object with no additional text or markdown formatting.
The JSON object must exactly have the following structure (for all seven days), where the "recipe" field of each meal must contain a detailed, step-by-step recipe:

{
  "mealPlan": {
      "Monday": {
          "meals": [
              { "title": "Breakfast", "recipe": "<Detailed step-by-step recipe>" },
              { "title": "Lunch", "recipe": "<Detailed step-by-step recipe>" },
              { "title": "Dinner", "recipe": "<Detailed step-by-step recipe>" },
              { "title": "Snacks", "recipe": "<Detailed step-by-step recipe>" }
          ],
          "dailyMacros": "<Summary of total daily macros>"
      },
      "Tuesday": { ... },
      "Wednesday": { ... },
      "Thursday": { ... },
      "Friday": { ... },
      "Saturday": { ... },
      "Sunday": {
          "meals": [
              { "title": "Breakfast", "recipe": "<Detailed step-by-step recipe>" },
              { "title": "Lunch", "recipe": "<Detailed step-by-step recipe>" },
              { "title": "Dinner", "recipe": "<Detailed step-by-step recipe>" },
              { "title": "Snacks", "recipe": "<Detailed step-by-step recipe>" }
          ],
          "dailyMacros": "<Summary of total daily macros>"
      }
  },
  "groceryList": {
      "Protein Sources": ["<ingredient and amount>", "..."],
      "Grains & Carbs": ["..."],
      "Vegetables": ["..."],
      "Fruits": ["..."],
      "Healthy Fats & Extras": ["..."],
      "Seasonings & Pantry Staples": ["..."]
  }
}`;

  try {
    console.log("Meal Plan Prompt Sent to OpenAI (meals.js):", mealPlanPrompt);

    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: mealPlanPrompt }],
        temperature: 0.3,
        max_tokens: 2500
      }),
    });

    const data = await aiResponse.json();
    console.log("Full OpenAI Response (meals.js):", JSON.stringify(data, null, 2));

    // Extract the raw response string.
    let mealPlanResponse = data.choices?.[0]?.message?.content?.trim() || null;
    console.log("Raw mealPlanResponse:", mealPlanResponse);
    if (!mealPlanResponse) {
      console.error("Meal plan generation failed - empty response.");
      return res.status(500).json({ mealPlan: null, groceryList: null, error: "Meal plan is empty. Please try again." });
    }

    // Attempt to clean and extract the JSON substring.
    let structuredMealPlan;
    try {
      if (mealPlanResponse.startsWith("```")) {
        mealPlanResponse = mealPlanResponse.replace(/```/g, "");
      }
      mealPlanResponse = mealPlanResponse.trim();
      const firstBrace = mealPlanResponse.indexOf("{");
      const lastBrace = mealPlanResponse.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1) {
        mealPlanResponse = mealPlanResponse.substring(firstBrace, lastBrace + 1);
      }
      // Remove trailing commas to improve JSON validity.
      mealPlanResponse = mealPlanResponse.replace(/,\s*}/g, '}').replace(/,\s*\]/g, ']');
      structuredMealPlan = JSON.parse(mealPlanResponse);
    } catch (e) {
      console.error("Error parsing meal plan JSON:", e);
      try {
        const repairedResponse = mealPlanResponse.replace(/\r?\n|\r/g, " ");
        const cleanedResponse = repairedResponse.replace(/,\s*}/g, '}').replace(/,\s*\]/g, ']');
        structuredMealPlan = JSON.parse(cleanedResponse);
      } catch (e2) {
        console.error("Error parsing meal plan JSON after repair:", e2);
        return res.status(500).json({ mealPlan: null, groceryList: null, error: "Invalid meal plan format received from server." });
      }
    }
    
    res.json({ 
      nutritionSummary: nutritionSummaryMessage, 
      mealPlan: structuredMealPlan.mealPlan, 
      groceryList: structuredMealPlan.groceryList, 
      error: null 
    });
  } catch (error) {
    console.error("Server Error Generating Meal Plan (meals.js):", error);
    res.status(500).json({ mealPlan: null, groceryList: null, error: "Failed to generate meal plan. Server-side error." });
  }
});

module.exports = router;
