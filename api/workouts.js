// File: /api/workout.js

// For local development, load environment variables using ES module syntax.
import dotenv from "dotenv";
if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

// ---------------------
// HELPER FUNCTIONS
// ---------------------

function compressHTML(html) {
  return html.replace(/\n/g, "").replace(/>\s+</g, "><").trim();
}

function balanceBraces(text) {
  const openCount = (text.match(/{/g) || []).length;
  const closeCount = (text.match(/}/g) || []).length;
  if (openCount > closeCount) {
    console.warn(`Balancing braces: adding ${openCount - closeCount} missing '}'`);
    text += "}".repeat(openCount - closeCount);
  }
  return text;
}

function formatText(text) {
  if (!text) return "";
  return text.replace(/\. /g, ".<br>");
}

function formatExercise(ex) {
  if (!ex) return "";
  return ex.replace(/Primary muscles worked:/gi, "<br><strong>Primary muscles worked:</strong> ");
}

const allDayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
function computeDesignatedWorkoutDays(numDays) {
  if (numDays >= 7) return allDayNames.slice();
  const designated = [];
  for (let i = 0; i < numDays; i++) {
    let idx = Math.floor(((i + 1) * 7) / (numDays + 1));
    if (!designated.includes(allDayNames[idx])) {
      designated.push(allDayNames[idx]);
    } else {
      idx = Math.min(idx + 1, 6);
      designated.push(allDayNames[idx]);
    }
  }
  return designated;
}

const restDayInstruction =
  `<strong>Rest Day:</strong> Take a 10-15 minute light walk, perform a gentle yoga sequence, foam rolling, and dynamic stretching. Briefly explain how each activity aids recovery.`;

// ---------------------
// MAIN HANDLER FUNCTION (Serverless)
// ---------------------

export default async function handler(req, res) {
  // Allow only POST requests.
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
  
  // Ensure the OpenAI API key is defined.
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    console.error("Error: OPENAI_API_KEY is not defined. Please set it in your .env file.");
    return res.status(500).json({ error: "OPENAI_API_KEY is missing." });
  }
  
  // ---------------------
  // Extract Request Data
  // ---------------------
  const { formData, userGoals } = req.body;
  if (!formData) {
    console.error("Missing formData in request body.");
    return res.status(400).json({ error: "Missing formData." });
  }

  // For ease of reference later in extra guidance.
  const userProfileData = formData;

  // Destructure workout-related values from formData.
  const {
    fitnessGoal,
    workoutType,
    fitnessLevel,
    timeCommitment,
    equipment,
    specificGoals,
    lifestyle,
    activityLevel,
    workoutDays // may be string or number
  } = formData;
  
  if (typeof workoutType !== "string" || workoutType.trim() === "") {
    console.error("workoutType is missing or invalid.", workoutType);
    return res.status(400).json({ error: "workoutType is required and must be a non-empty string." });
  }
  
  // Determine number of workout days (default to 7 if not specified).
  const numWorkoutDays = parseInt(workoutDays) || 7;
  const designatedWorkoutDays = computeDesignatedWorkoutDays(numWorkoutDays);
  
  // ---------------------
  // Build the Dynamic Prompt
  // ---------------------
  let dynamicPrompt = `Generate a highly detailed ${numWorkoutDays}-day workout plan for weight loss tailored for a general adult user with the following criteria:
- User Lifestyle & Goals: ${userGoals || "No additional details provided"}
- Fitness Goal: ${fitnessGoal}.
- Workout Type: ${workoutType}.
- Fitness Level: ${fitnessLevel}.
- Activity Level: ${activityLevel || "Not specified"}.
- Time Commitment per Session: ${timeCommitment}.
- Workout Days per Week: ${numWorkoutDays}.
`;
  
  if (equipment && equipment.length > 0) {
    dynamicPrompt += `- Available Equipment: ${equipment.join(", ")}.\n`;
  } else {
    dynamicPrompt += `- Available Equipment: None.\n`;
  }
  
  dynamicPrompt += `- Specific Fitness Goals (emphasis but not sole focus): ${specificGoals || "None"}.
- Lifestyle: ${lifestyle || "General adult"}.
Designated Workout Days: ${designatedWorkoutDays.join(", ")}.
For any day not among these, output EXACTLY the following rest-day instruction:
${restDayInstruction}

Please note:
- If the user's input includes any indications of injury or limitations, include potential modifications or exercise alternatives.
- Ensure that even if the user's lifestyle input is varied (e.g., "busy office job", "parenting challenges", "active outdoors", etc.), the workout plan is optimized accordingly.
- For any day that is designated as a workout day, output only the workout details (warmUp, mainWorkout/mainCircuit, rest, coolDown) and do not append any additional rest-day instruction.

Please generate a personalized workout plan that is clear, safe, and easy to follow. **Important Formatting Instructions:**
- Each section title (e.g., <strong>Warm-Up (5 minutes)</strong>, <strong>Main Circuit (2 circuits)</strong> or <strong>Main Workout (2 workouts)</strong>, <strong>Rest &amp; Cool-Down</strong>, <strong>Cool-Down</strong>) must be wrapped in HTML <strong> tags.
- For every exercise in the main section, wrap the exercise name in <strong> tags. Immediately following the exercise instructions, add a new line with <strong>Primary muscles worked:</strong> followed by the relevant muscles.
- Also output key instructions such as <strong>Perform each exercise with proper form and focus on engaging the targeted muscles.</strong>, <strong>Take deep breaths and stretch to help your muscles recover and prevent injury.</strong>, and <strong>Focus on your breathing and relax your muscles to aid in recovery.</strong>.
- For any non-workout day, output exactly the provided rest-day instruction.
- For days that are designated as workout days, output only the workout details without any additional rest day text.
`;
  
  // Append additional guidelines based on workoutType and time commitment.
  dynamicPrompt += `\nNow, follow these specific guidelines based on workoutType and time commitment:\n`;
  
  if (workoutType.toLowerCase() === "home" || workoutType.toLowerCase() === "bodyweight") {
    dynamicPrompt += `
For a bodyweight/home workout (Tabata-style), follow these guidelines:
1. IF the time commitment is "10-20 minutes":
   - <strong>Warm-Up (3 minutes):</strong> Provide 2-3 dynamic warm-up exercises (e.g., 30 seconds each of light cardio and dynamic stretches). Briefly explain which muscles are activated.
   - <strong>Main Circuit (1 circuit):</strong> Create 2-3 simple exercises. For each, list the exercise name (wrapped in <strong> tags), provide detailed form instructions, and on a new line include <strong>Primary muscles worked:</strong> followed by the targeted muscles. Each exercise should be performed for 30 seconds (including brief rest intervals).
   - <strong>Rest &amp; Cool-Down:</strong> Include a 1-minute active recovery and a 3-minute cool-down with 2-3 static stretches. Include explanations.
   - Advise potential modifications if needed.
2. IF the time commitment is "20-30 minutes":
   - <strong>Warm-Up (4 minutes):</strong> Provide 3-4 dynamic exercises with brief explanations.
   - <strong>Main Circuit (1 circuit):</strong> Specify 3-4 exercises, each for 40-45 seconds with detailed instructions and on a new line include <strong>Primary muscles worked:</strong>.
   - <strong>Rest &amp; Cool-Down:</strong> Insert a 1-minute recovery period and a 4-minute cool-down.
   - Include a motivational tip.
3. IF the time commitment is "30-45 minutes":
   - <strong>Warm-Up (5 minutes):</strong> Include a thorough warm-up with various dynamic movements.
   - <strong>Main Circuit (2 circuits):</strong> Each circuit should contain 3-4 exercises performed for 30-40 seconds, with detailed instructions and after each exercise include <strong>Primary muscles worked:</strong>.
   - <strong>Rest &amp; Cool-Down:</strong> Include 1-minute rests between exercises, 1-2 minute rests between circuits, and then a 5-minute cool-down.
   - Suggest progressive adjustments.
4. IF the time commitment is "45-60 minutes":
   - <strong>Warm-Up (6 minutes):</strong> Provide an extended warm-up.
   - <strong>Main Circuit (3 circuits):</strong> Provide 3 circuits, each with 3-4 exercises performed for 45-60 seconds (using rep/set style if applicable), with detailed instructions and after each exercise include <strong>Primary muscles worked:</strong>.
   - <strong>Rest &amp; Cool-Down:</strong> Recommend 1-2 minute rest periods between exercises and circuits, followed by a 6-minute cool-down.
   - End with a motivational note.
`;
  } else if (workoutType.toLowerCase() === "gym") {
    dynamicPrompt += `
For a gym workout routine, follow these guidelines:
1. IF the time commitment is "10-20 minutes":
   - <strong>Warm-Up (3 minutes):</strong> Provide a quick warm-up with dynamic stretches and light cardio (e.g., treadmill walking, elliptical). Mention the target muscles.
   - <strong>Main Workout (quick, intensive workout):</strong> Generate 2-3 gym exercises in a rep/set format (e.g., 2 sets of 8-10 reps). For each exercise, list the exercise name (wrapped in <strong> tags), provide detailed instructions, and on a new line output <strong>Primary muscles worked:</strong>.
   - <strong>Rest &amp; Cool-Down:</strong> Include a 1-minute rest between exercises and a 3-minute cool-down with static stretches.
   - Emphasize proper form and modifications.
2. IF the time commitment is "20-30 minutes":
   - <strong>Warm-Up (4 minutes):</strong> Provide dynamic warm-ups focused on gym movements.
   - <strong>Main Workout (progressively increasing sets):</strong> Provide 3-4 gym exercises with a rep/set scheme (e.g., 3 sets of 10-12 reps). Include detailed instructions and on a new line output <strong>Primary muscles worked:</strong>.
   - <strong>Rest &amp; Cool-Down:</strong> Offer a 1-2 minute recovery period and a 4-minute cool-down.
   - Add a motivational tip.
3. IF the time commitment is "30-45 minutes":
   - <strong>Warm-Up (5 minutes):</strong> Offer a thorough, gym-specific warm-up.
   - <strong>Main Workout (progressively increasing sets):</strong> Provide 3-4 exercises per workout in a rep/set format (e.g., 3 sets of 12 reps). For each exercise, list the exercise name (wrapped in <strong> tags), provide detailed instructions, and on a new line output <strong>Primary muscles worked:</strong>.
   - <strong>Rest &amp; Cool-Down:</strong> Suggest a 1-2 minute active recovery between exercises and a 5-minute cool-down.
   - Provide progressive guidance.
4. IF the time commitment is "45-60 minutes":
   - <strong>Warm-Up (6 minutes):</strong> Provide an extended warm-up for intensive sessions.
   - <strong>Main Workout (progressively increasing sets):</strong> Create 3 workouts with 3-4 exercises each in a rep/set format (e.g., 3 sets of 12-15 reps). For each exercise, list the exercise name (wrapped in <strong> tags), provide step-by-step instructions, and on a new line output <strong>Primary muscles worked:</strong>.
   - <strong>Rest &amp; Cool-Down:</strong> Recommend 1-2 minute rest periods followed by a 6-minute cool-down.
   - End with a motivational note.
`;
  }
  
  // Append JSON output format instructions.
  if (workoutType.toLowerCase() === "gym") {
    dynamicPrompt += `
Return ONLY a valid JSON object EXACTLY in the following format, with no extra text or markdown:
{
  "Monday": {
    "warmUp": "<Your warm-up instructions with <br> for line breaks>",
    "mainWorkout": "<Your main workout instructions with detailed exercise steps>",
    "rest": "<Your rest and recovery instructions>",
    "coolDown": "<Your cool-down instructions>"
  },
  "Tuesday": {
    "warmUp": "<Your warm-up instructions with <br> for line breaks>",
    "mainWorkout": "<Your main workout instructions with detailed exercise steps>",
    "rest": "<Your rest and recovery instructions>",
    "coolDown": "<Your cool-down instructions>"
  },
  "Wednesday": {
    "warmUp": "<Your warm-up instructions with <br> for line breaks>",
    "mainWorkout": "<Your main workout instructions with detailed exercise steps>",
    "rest": "<Your rest and recovery instructions>",
    "coolDown": "<Your cool-down instructions>"
  },
  "Thursday": {
    "warmUp": "<Your warm-up instructions with <br> for line breaks>",
    "mainWorkout": "<Your main workout instructions with detailed exercise steps>",
    "rest": "<Your rest and recovery instructions>",
    "coolDown": "<Your cool-down instructions>"
  },
  "Friday": {
    "warmUp": "<Your warm-up instructions with <br> for line breaks>",
    "mainWorkout": "<Your main workout instructions with detailed exercise steps>",
    "rest": "<Your rest and recovery instructions>",
    "coolDown": "<Your cool-down instructions>"
  },
  "Saturday": {
    "warmUp": "<Your warm-up instructions with <br> for line breaks>",
    "mainWorkout": "<Your main workout instructions with detailed exercise steps>",
    "rest": "<Your rest and recovery instructions>",
    "coolDown": "<Your cool-down instructions>"
  },
  "Sunday": "${restDayInstruction}"
}
OUTPUT_END
`;
  } else {
    dynamicPrompt += `
Return ONLY a valid JSON object EXACTLY in the following format, with no extra text or markdown:
{
  "Monday": {
    "warmUp": "<Your warm-up instructions with <br> for line breaks>",
    "mainCircuit": "<Your main circuit instructions with detailed exercise steps>",
    "rest": "<Your rest and recovery instructions>",
    "coolDown": "<Your cool-down instructions>"
  },
  "Tuesday": {
    "warmUp": "<Your warm-up instructions with <br> for line breaks>",
    "mainCircuit": "<Your main circuit instructions with detailed exercise steps>",
    "rest": "<Your rest and recovery instructions>",
    "coolDown": "<Your cool-down instructions>"
  },
  "Wednesday": {
    "warmUp": "<Your warm-up instructions with <br> for line breaks>",
    "mainCircuit": "<Your main circuit instructions with detailed exercise steps>",
    "rest": "<Your rest and recovery instructions>",
    "coolDown": "<Your cool-down instructions>"
  },
  "Thursday": {
    "warmUp": "<Your warm-up instructions with <br> for line breaks>",
    "mainCircuit": "<Your main circuit instructions with detailed exercise steps>",
    "rest": "<Your rest and recovery instructions>",
    "coolDown": "<Your cool-down instructions>"
  },
  "Friday": {
    "warmUp": "<Your warm-up instructions with <br> for line breaks>",
    "mainCircuit": "<Your main circuit instructions with detailed exercise steps>",
    "rest": "<Your rest and recovery instructions>",
    "coolDown": "<Your cool-down instructions>"
  },
  "Saturday": {
    "warmUp": "<Your warm-up instructions with <br> for line breaks>",
    "mainCircuit": "<Your main circuit instructions with detailed exercise steps>",
    "rest": "<Your rest and recovery instructions>",
    "coolDown": "<Your cool-down instructions>"
  },
  "Sunday": "${restDayInstruction}"
}
OUTPUT_END
`;
  }
  
  console.log("Dynamic Workout Prompt Sent to OpenAI:", dynamicPrompt);
  
  try {
    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: dynamicPrompt }],
        temperature: 0.4,
        max_tokens: 2000,
        stop: ["OUTPUT_END"]
      })
    });
    
    const apiResult = await aiResponse.json();
    console.log("Raw API JSON Response:", JSON.stringify(apiResult, null, 2));
    
    if (!apiResult.choices || !apiResult.choices[0] || !apiResult.choices[0].message) {
      return res.status(500).json({ workout: null, error: "Unexpected API response format." });
    }
    
    if (apiResult.choices[0].finish_reason === "length") {
      console.warn("API response was truncated due to token limits. Attempting to parse truncated output.");
    }
    
    let workoutText = apiResult.choices[0].message.content.trim();
    console.log("Raw workoutText received:", workoutText);
    
    if (workoutText.startsWith("```")) {
      workoutText = workoutText.replace(/^```(json)?\s*/i, "").replace(/\s*```$/, "").trim();
      console.log("WorkoutText after removing markdown delimiters:", workoutText);
    }
    
    const firstBrace = workoutText.indexOf("{");
    if (firstBrace > 0) {
      workoutText = workoutText.substring(firstBrace);
      console.log("WorkoutText after trimming extra text before JSON:", workoutText);
    }
    const lastBrace = workoutText.lastIndexOf("}");
    if (lastBrace < workoutText.length - 1) {
      workoutText = workoutText.substring(0, lastBrace + 1);
      console.log("WorkoutText after trimming extra text after JSON:", workoutText);
    }
    
    workoutText = workoutText.replace(/OUTPUT_END\s*$/i, "").trim();
    workoutText = workoutText.replace(/\r?\n/g, " ").trim();
    workoutText = workoutText.replace(/\s{2,}/g, " ");
    
    const jsonMatch = workoutText.match(/{[\s\S]*}/);
    if (!jsonMatch) {
      console.error("Regex failed to extract JSON. Full workoutText:", workoutText);
      return res.status(500).json({ workout: null, error: "Invalid workout format received from server." });
    }
    
    workoutText = jsonMatch[0];
    console.log("Extracted JSON using regex:", workoutText);
    
    workoutText = workoutText.replace(/^\uFEFF/, "").trim();
    workoutText = workoutText.replace(/,(\s*})/g, "$1");
    if (workoutText.slice(-1) !== "}") {
      workoutText += "}";
      console.log("Appended missing closing brace. New workoutText:", workoutText);
    }
    workoutText = balanceBraces(workoutText);
    console.log("Cleaned workoutText after balancing, first 50 chars:", workoutText.slice(0, 50), "...", "last 50 chars:", workoutText.slice(-50));
    
    let workoutPlan;
    try {
      workoutPlan = JSON.parse(workoutText);
      console.log("Parsed workoutPlan object:", workoutPlan);
    } catch (e) {
      console.error("Error parsing workout JSON:", e);
      return res.status(500).json({ workout: null, error: "Invalid workout format received from server." });
    }
    
    // ---------------------
    // Build HTML Table to Display the Workout Plan
    // ---------------------
    let tableRows = "";
    const dayNames = allDayNames;
    dayNames.forEach(day => {
      let dayContent = "";
      if (designatedWorkoutDays.indexOf(day) === -1) {
        dayContent = restDayInstruction;
      } else {
        if (workoutPlan[day] && typeof workoutPlan[day] === "object") {
          dayContent += workoutPlan[day].warmUp + "<br><br>";
          if (workoutType.toLowerCase() === "gym") {
            dayContent += workoutPlan[day].mainWorkout + "<br><br>";
          } else {
            dayContent += workoutPlan[day].mainCircuit + "<br><br>";
          }
          dayContent += workoutPlan[day].rest + "<br><br>";
          dayContent += workoutPlan[day].coolDown;
        } else if (workoutPlan[day]) {
          dayContent = workoutPlan[day];
        } else {
          dayContent = "No workout data.";
        }
      }
      
      tableRows += `<tr>
        <td style="padding:8px; border:1px solid #ccc;">${day}</td>
        <td style="padding:8px; border:1px solid #ccc;">${dayContent}</td>
      </tr>`;
    });
    
    const planStyle = (workoutType.toLowerCase() === "gym")
      ? "Gym (Rep/Set-Based)"
      : "Workout (Circuit-Based)";
    const tableHTML = compressHTML(`
      <div class="workout-heading">
        <strong>Your ${numWorkoutDays}-day ${planStyle} Plan for Weight Loss</strong>
        <div class="workout-subheading"><em>Workout Days: ${designatedWorkoutDays.join(", ")}</em></div>
      </div>
      <table style="width:100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="padding:8px; border:1px solid #ccc;">Day</th>
            <th style="padding:8px; border:1px solid #ccc;">Plan</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    `);
    console.log("Final HTML being sent to the client:", tableHTML);
    
    // ---------------------
    // Build Extra Guidance
    // ---------------------
    let extraGuidance = `<div class="extra-guidance workout-result">`;
    if (workoutType.toLowerCase() === "gym") {
      extraGuidance += `<p><strong>Workout Tip:</strong> For optimal results, follow the prescribed sets and reps. Focus on proper form, progressive overload, and ensure adequate rest between sets.</p>`;
    } else {
      extraGuidance += `<p><strong>Workout Tip:</strong> For maximum benefit, perform the main circuit <strong>2 times</strong>. Beginners can start with one circuit and progress gradually.</p>`;
    }
    
    if (userProfileData.timeCommitment) {
      let commitment = userProfileData.timeCommitment;
      extraGuidance += `<p><strong>Session Duration &amp; Frequency:</strong> You selected ${commitment}. `;
      if (workoutType.toLowerCase() === "gym") {
        if (commitment.includes("10-20")) {
          extraGuidance += `For gym workouts, aim for 1-2 sets per exercise due to limited time.`;
        } else if (commitment.includes("20-30")) {
          extraGuidance += `For gym workouts, consider 2 sets per exercise with proper rest intervals.`;
        } else if (commitment.includes("30-45")) {
          extraGuidance += `For gym workouts, 3 sets per exercise is recommended for a balanced routine.`;
        } else if (commitment.includes("45-60")) {
          extraGuidance += `For gym workouts, 3-4 sets per exercise are recommended to maximize muscle engagement.`;
        }
      } else {
        if (commitment.includes("10-20")) {
          extraGuidance += `We recommend 1 circuit as detailed above.`;
        } else if (commitment.includes("20-30")) {
          extraGuidance += `Aim for 1 circuit with slightly longer exercise durations.`;
        } else if (commitment.includes("30-45")) {
          extraGuidance += `This plan includes 2 circuits for a balanced workout.`;
        } else if (commitment.includes("45-60")) {
          extraGuidance += `With more available time, 3 circuits will deliver excellent results.`;
        }
      }
      extraGuidance += `</p>`;
    }
    
    if (userProfileData.fitnessLevel) {
      let level = userProfileData.fitnessLevel.toLowerCase();
      if (level === "beginner") {
        extraGuidance += `<p><strong>Intensity:</strong> As a beginner, focus on proper form and use lighter weights or modified exercises. Gradual progression is key.</p>`;
      } else if (level === "intermediate") {
        extraGuidance += `<p><strong>Intensity:</strong> Your workouts should challenge you moderately. For gym workouts, focus on progressive overload; for home/bodyweight workouts, maintain intensity with proper modifications.</p>`;
      } else if (level === "advanced") {
        extraGuidance += `<p><strong>Intensity:</strong> High intensity is crucial. For gym workouts, ensure progressive overload through increased weights and rep schemes; for home/bodyweight workouts, push your limits with advanced variations while maintaining proper form.</p>`;
      }
    }
    
    if (userProfileData.equipment && userProfileData.equipment.length > 0) {
      extraGuidance += `<p><strong>Equipment Note:</strong> You selected: ${userProfileData.equipment.join(", ")}. Use these tools to further customize your routine.</p>`;
    } else {
      extraGuidance += `<p><strong>Home Workout Advantage:</strong> This plan emphasizes effective bodyweight exercises that require no additional equipment.</p>`;
    }
    
    if (userProfileData.fitnessGoal) {
      extraGuidance += `<p><strong>Your Goal:</strong> This plan is tailored to help you ${userProfileData.fitnessGoal}. Consistency, safety, and progressive overload are essential for progress.</p>`;
    }
    
    extraGuidance += `</div>`;
    
    return res.status(200).json({ workout: extraGuidance + tableHTML, error: null });
    
  } catch (error) {
    console.error("Error Fetching Workout Plan:", error);
    return res.status(500).json({ workout: null, error: "Failed to generate workout. Server-side error." });
  }
}
