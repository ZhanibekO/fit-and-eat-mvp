// You do NOT need Express or require("dotenv") in a Vercel serverless function
// You can access environment variables using process.env

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Helper functions
function compressHTML(html) {
  return html.replace(/\n/g, "").replace(/>\s+</g, "><").trim();
}

function balanceBraces(text) {
  const openCount = (text.match(/{/g) || []).length;
  const closeCount = (text.match(/}/g) || []).length;
  if (openCount > closeCount) {
    text += "}".repeat(openCount - closeCount);
  }
  return text;
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

const restDayInstruction = `<strong>Rest Day:</strong> Take a 10-15 minute light walk, perform a gentle yoga sequence, foam rolling, and dynamic stretching. Briefly explain how each activity aids recovery.`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  if (!OPENAI_API_KEY) {
    res.status(500).json({ error: "OPENAI_API_KEY is not defined on server." });
    return;
  }

  const { formData, userGoals } = req.body;
  if (!formData) {
    return res.status(400).json({ error: "Missing formData." });
  }
  
  const {
    fitnessGoal,
    workoutType,
    fitnessLevel,
    timeCommitment,
    equipment,
    specificGoals,
    lifestyle,
    activityLevel,
    workoutDays,
  } = formData;
  const userProfileData = formData;
  if (typeof workoutType !== "string" || workoutType.trim() === "") {
    return res.status(400).json({ error: "workoutType is required and must be a non-empty string." });
  }
  const numWorkoutDays = parseInt(workoutDays) || 7;
  const designatedWorkoutDays = computeDesignatedWorkoutDays(numWorkoutDays);

  // Build prompt (identical logic)
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
    dynamicPrompt += `- Available Equipment: ${equipment.join(", ")}.
`;
  } else {
    dynamicPrompt += `- Available Equipment: None.
`;
  }
  dynamicPrompt += `- Specific Fitness Goals (emphasis but not sole focus): ${specificGoals ? specificGoals : "None"}.
- Lifestyle: ${lifestyle ? lifestyle : "General adult"}.
Designated Workout Days: ${designatedWorkoutDays.join(", ")}.
For any day not among these, output EXACTLY the following rest-day instruction:
${restDayInstruction}
...
`;

  // Add type-specific prompt
  if (workoutType.toLowerCase() === "home" || workoutType.toLowerCase() === "bodyweight") {
    dynamicPrompt += `... [bodyweight/home instructions omitted for brevity, same as your src/workout.js] ...`;
  } else if (workoutType.toLowerCase() === "gym") {
    dynamicPrompt += `... [gym instructions omitted for brevity, same as your src/workout.js] ...`;
  }

  // JSON output instructions
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
  ... [other days]
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
  ... [other days]
}
OUTPUT_END
`;
  }

  // Call OpenAI API
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
    workoutText = workoutText.replace(/\r?\n/g, " ").trim();
    workoutText = workoutText.replace(/\s{2,}/g, " ");
    const jsonMatch = workoutText.match(/{[\s\S]*}/);
    if (!jsonMatch) {
      return res.status(500).json({ workout: null, error: "Invalid workout format received from server." });
    }
    workoutText = jsonMatch[0];
    workoutText = workoutText.replace(/^\uFEFF/, "").trim();
    workoutText = workoutText.replace(/,(\s*})/g, "$1");
    if (workoutText.slice(-1) !== "}") workoutText += "}";
    workoutText = balanceBraces(workoutText);

    let workoutPlan;
    try {
      workoutPlan = JSON.parse(workoutText);
    } catch (e) {
      return res.status(500).json({ workout: null, error: "Invalid workout format received from server." });
    }

    // Build HTML table to display the workout plan.
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

    // Build extra guidance dynamically
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

    res.status(200).json({ workout: extraGuidance + tableHTML, error: null });
  } catch (error) {
    res.status(500).json({ workout: null, error: "Failed to generate workout. Server-side error." });
  }
}
