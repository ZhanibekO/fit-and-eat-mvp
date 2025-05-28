// File: /api/gpt.js

export default async function handler(req, res) {
    // Allow only POST requests
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  
    // Extract the 'prompt' from the request body
    const { prompt } = req.body;
  
    // Retrieve the GPT API key from environment variables
    const apiKey = process.env.GPT_API_KEY; // Ensure this is set in Vercel
  
    if (!apiKey) {
      return res.status(500).json({ error: 'API Key not configured.' });
    }
  
    try {
      // Updated API call using the general completions endpoint and specifying the supported model
      const response = await fetch("https://api.openai.com/v1/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "text-davinci-003",  // Specify the supported model here
          prompt: prompt,
          max_tokens: 100,
        }),
      });
  
      // Check if the response is not OK
      if (!response.ok) {
        const errorText = await response.text();
        console.error("GPT API Error:", errorText);
        return res.status(response.status).json({ error: "Error generating workout plan." });
      }
  
      // Parse and return the response
      const data = await response.json();
      res.status(200).json(data);
    } catch (error) {
      console.error("Server Error:", error);
      res.status(500).json({ error: "Error generating workout plan. Please try again later." });
    }
  }
  