// api/ai-service.js
export default async function handler(req, res) {
  // CORS Setup (Allow your frontend to call this)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); // Replace '*' with your production URL for security
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { prompt, type } = req.body;
  const apiKey = process.env.VITE_GEMINI_API_KEY; // Using the same env var name for convenience

  if (!apiKey) {
    return res.status(500).json({ error: 'Server API Key configuration missing' });
  }

  // Optional: Verify Firebase JWT here if you want to restrict to logged-in users
  // const authHeader = req.headers.authorization;
  // if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error('Gemini API Error:', err);
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;

    // Return pure text; the frontend will parse JSON if needed
    return res.status(200).json({ result: text });
  } catch (error) {
    console.error('Backend Error:', error);
    return res.status(500).json({ error: 'Failed to fetch from AI provider' });
  }
}