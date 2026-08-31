// Vercel serverless function: proxies the voice orb's question to the Claude
// API so the API key never reaches the browser. Deploy with the env var
// ANTHROPIC_API_KEY set in the Vercel project settings (never commit it).

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';
const MAX_QUESTION_LEN = 500;

const SYSTEM_PROMPT = `You are the voice assistant embedded in an employee-facing AI carbon and water
footprint calculator. Answer questions about the environmental impact of AI use, how it compares to
everyday activities (driving, diet, flights, coffee, showers, etc.), and what the numbers on the page
mean. You will be given the visitor's current calculator reading as context — use it when relevant,
but you can also answer general questions about AI's environmental footprint.

Ground rules:
- Keep answers short: 2-4 sentences. They are read aloud via text-to-speech.
- Be accurate and even-handed. Do not exaggerate AI's footprint or dismiss it — both training and
  per-prompt use are real but usually small next to things like flights, driving, or diet.
- If you don't know a specific figure, say so rather than inventing a precise number.
- Do not answer questions unrelated to AI, sustainability, or this calculator; briefly redirect instead.`;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  const question = (body && body.question ? String(body.question) : '').slice(0, MAX_QUESTION_LEN).trim();
  const context = (body && body.context) || {};

  if (!question) {
    res.status(400).json({ error: 'Missing question' });
    return;
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(500).json({ error: 'Server is not configured with an API key yet.' });
    return;
  }

  const contextLine = `Visitor's current reading — metric: ${context.metric || 'carbon'}, ` +
    `daily: ${context.dailyValue || 'n/a'}, annual: ${context.annualValue || 'n/a'}, ` +
    `persona: ${context.persona || 'custom'}, compared region: ${context.region || 'n/a'}.`;

  try {
    const upstream = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 300,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: `${contextLine}\n\nQuestion: ${question}` }],
      }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      res.status(502).json({ error: 'Upstream error', detail: errText.slice(0, 300) });
      return;
    }
    const data = await upstream.json();
    const answer = (data.content || []).map((b) => b.text || '').join('').trim() || "I don't have an answer for that right now.";
    res.status(200).json({ answer });
  } catch (e) {
    res.status(502).json({ error: 'Could not reach the model provider.' });
  }
};
