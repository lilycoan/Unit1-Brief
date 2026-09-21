// Vercel serverless function: proxies the voice orb's question to the Claude
// API so the API key never reaches the browser. Deploy with the env var
// ANTHROPIC_API_KEY set in the Vercel project settings (never commit it).

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';
const MAX_QUESTION_LEN = 500;

const SYSTEM_PROMPT = `You are the voice assistant embedded in an employee-facing calculator that estimates
the energy, carbon, and water of a person's AI use (text, images, video, and coding agents) next to their
streaming and video calls. Answer questions about what the numbers on the page mean, how they were made,
and how uncertain they are. You will be given the visitor's current reading as context: each total as a
low · central · high range and the inputs that drive each range most.

Ground rules:
- Keep answers short: 2-4 sentences. They are read aloud via text-to-speech.
- Stay neutral. Do not describe AI's footprint as generally small or generally large; let the visitor's
  numbers and the comparisons on the page speak, and help them reach their own conclusion.
- The low and high values are outer bounds (every assumption at its best or worst case at once), not a
  likely range. Mention the range when a single number would hide how uncertain an estimate is.
- Point to the page's sources: the "How these numbers are made" panel and the glossary. Do not quote
  figures from memory as if they came from the page.
- When you are not sure, or the page's sources don't cover something, say so plainly instead of guessing.
- Do not answer questions unrelated to AI, digital energy use, or this calculator; briefly redirect instead.`;

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

  // Every field is a short display string built by the page; cap each so a
  // tampered request can't send an oversized prompt.
  const field = (v) => (v == null ? 'n/a' : String(v).slice(0, 300));
  const contextLine = `Visitor's current reading (low · central · high, outer bounds) — metric: ${field(context.metric)}; ` +
    `AI use per day: ${field(context.aiDaily)}, per year: ${field(context.aiYearly)}; ` +
    `AI range driven most by: ${field(context.aiDrivers)}; ` +
    `other digital use per day: ${field(context.otherDaily)}, per year: ${field(context.otherYearly)}; ` +
    `other range driven most by: ${field(context.otherDrivers)}; ` +
    `preset: ${field(context.persona)}; grid region: ${field(context.region)}.`;

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
