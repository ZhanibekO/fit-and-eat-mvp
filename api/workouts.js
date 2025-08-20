// File: /api/workouts.js

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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    console.error("Error: OPENAI_API_KEY is not defined. Please set it in your .env file.");
    return res.status(500).json({ error: "OPENAI_API_KEY is missing." });
  }

  const { formData, userGoals } = req.body;
  if (!formData) {
    console.error("Missing formData in request body.");
    return res.status(400).json({ error: "Missing formData." });
  }

  const userProfileData = formData;
  const {
    fitnessGoal,
    workoutType,
    fitnessLevel,
    timeCommitment,
    equipment,
    specificGoals,
    lifestyle,
    activityLevel,
    workoutDays
  } = formData;

  if (typeof workoutType !== "string" || workoutType.trim() === "") {
    console.error("workoutType is missing or invalid.", workoutType);
    return res.status(400).json({ error: "workoutType is required and must be a non-empty string." });
  }

  const numWorkoutDays = parseInt(workoutDays) || 7;
  const designatedWorkoutDays = computeDesignatedWorkoutDays(numWorkoutDays);

  let dynamicPrompt = `Generate a highly detailed ${numWorkoutDays}-day workout plan tailored for a general adult user with the following criteria:
- User Lifestyle & Goals: ${userGoals || "No additional details provided"}
- Fitness Goal: ${fitnessGoal || "General fitness"}.
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
`;

  // Add your workoutType/timeCommitment guidelines block here unchanged
  // ... (your existing big if/else guidelines block from part 2)

  // Build JSON skeleton dynamically based on designatedWorkoutDays
  const mainKey = workoutType.toLowerCase() === "gym" ? "mainWorkout" : "mainCircuit";
  const jsonDaysSnippet = allDayNames.map(day => {
    if (designatedWorkoutDays.includes(day)) {
      return `  "${day}": {
    "warmUp": "<Your warm-up instructions with <br> for line breaks>",
    "${mainKey}": "<Your ${mainKey === "mainWorkout" ? "main workout" : "main circuit"} instructions with detailed exercise steps>",
    "rest": "<Your rest and recovery instructions>",
    "coolDown": "<Your cool-down instructions>"
  }`;
    }
    const restEscaped = restDayInstruction.replace(/"/g, '\\"');
    return `  "${day}": "${restEscaped}"`;
  }).join(",\n");

  dynamicPrompt += `
Return ONLY a valid JSON object EXACTLY in the following format, with no extra text or markdown:
{
${jsonDaysSnippet}
}
OUTPUT_END
`;

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

    let workoutText = apiResult.choices[0].message.content.trim();
    if (workoutText.startsWith("```")) {
      workoutText = workoutText.replace(/^```(json)?\s*/i, "").replace(/\s*```$/, "").trim();
    }

    const firstBrace = workoutText.indexOf("{");
    if (firstBrace > 0) workoutText = workoutText.substring(firstBrace);
    const lastBrace = workoutText.lastIndexOf("}");
    if (lastBrace < workoutText.length - 1) workoutText = workoutText.substring(0, lastBrace + 1);

    workoutText = workoutText.replace(/OUTPUT_END\s*$/i, "").trim();
    workoutText = workoutText.replace(/\r?\n/g, " ").replace(/\s{2,}/g, " ");
    const jsonMatch = workoutText.match(/{[\s\S]*}/);
        const jsonMatch = workoutText.match(/{[\s\S]*}/);
    if (!jsonMatch) {
      console.error("Regex failed to extract JSON. Full workoutText:", workoutText);
      return res.status(500).json({ workout: null, error: "Invalid workout format received from server." });
    }

    workoutText = jsonMatch[0];
    workoutText = workoutText.replace(/^\uFEFF/, "").trim();
    workoutText = workoutText.replace(/,(\s*})/g, "$1");
    if (workoutText.slice(-1) !== "}") {
      workoutText += "}";
    }
    workoutText = balanceBraces(workoutText);

    let workoutPlan;
    try {
      workoutPlan = JSON.parse(workoutText);
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
          const mainSection = workoutPlan[day].mainCircuit || workoutPlan[day].mainWorkout || "";
          dayContent += mainSection + "<br><br>";
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
        <strong>Your ${numWorkoutDays}-day ${planStyle} Plan for ${fitnessGoal || "Your Goal"}</strong>
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
