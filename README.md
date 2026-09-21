# Your AI Footprint

An employee-facing calculator for the energy, carbon, and water of AI use (text, images, video, and
coding agents), shown next to streaming and video calls. Every result is a low · central · high range
with linked sources and stated limitations. Forked from Andy Masley's
[AI prompt footprint calculator](https://andymasley.com/visuals/ai-prompt-footprint/)
(source in `ai-prompt-footprint-source.txt`, used under his CC0 public-domain release).
Static site — no build step, no framework — plus one small serverless function for
the voice-driven Q&A orb.

## What's here

- `index.html`, `styles.css` — the page: presets (including the illustrative Alex, Jordan, and Robin
  profiles), the AI-use and other-digital-use inputs, the results card, comparison charts, the "How these
  numbers are made" panel, and the glossary.
- `data.js` — every number the calculator uses, declared once. The EcoLogits per-prompt figures and the
  comparison data are carried over unchanged from the source file; each new uncertain input has a low,
  central, and high value, its sources (numbered as in `research.md`), and a reason it's uncertain.
  `SOURCES` holds the citation links; `GLOSSARY` the glossary.
- `calc.js` — the calculations, with no page access, so they run in the browser and in Node.
- `app.js` — rendering, state, the share link, the method panel, and the voice orb.
- `api/ask.js` — a Vercel serverless function. The page's voice orb records a question with the
  browser's Web Speech API, sends it here with the page's current totals, and this function calls the
  Claude API server-side (so the API key never reaches the browser) and returns a short spoken answer.
- `test/acceptance.js`, `test/check-links.js` — see "Testing" below.
- `brief.md`, `research.md`, `spec.md`, `plan.md` — the project brief, source assessments, approved
  specification, and implementation plan; `transcripts/` — the working chat transcripts.

## Running it locally

No backend needed to look at the calculator itself:

```
npx serve .
```

or just open `index.html` directly in a browser. The orb's mic button will work (Web
Speech API is browser-native), but asking a question will fail until the API route is
running — that needs the Vercel CLI:

```
npm i -g vercel
vercel dev
```

`vercel dev` serves both the static files and `/api/ask` together on one local port.

## Testing

```
node test/acceptance.js
```

Checks every numeric acceptance check in `spec.md` (plus the step-by-step baseline and range checks)
and prints PASS or FAIL for each; it exits with code 1 if any fail. Tolerances are stated per check,
because the spec's values are rounded.

```
node test/check-links.js
```

Requests every citation URL and prints its HTTP status. A publisher that blocks automated requests can
fail here while the page opens fine in a browser; the script lists those for a manual click-through.
A successful status only means the page opened, not that it still says what is cited.

## Deploying

1. `vercel` (or connect the repo in the Vercel dashboard) to create the project.
2. In the Vercel project's Settings → Environment Variables, add:
   - `ANTHROPIC_API_KEY` — a Claude API key (**never commit this** — it only lives in
     Vercel's env var store).
   - `ANTHROPIC_MODEL` (optional) — defaults to `claude-sonnet-5` if unset.
3. `vercel --prod` to deploy.

Any other Node-compatible serverless host works too (Netlify Functions, Cloudflare
Workers) — `api/ask.js` is a plain `(req, res) => {}` handler; only the file location
and export convention would need to change.

## Browser support notes

- Voice input uses the `SpeechRecognition` Web Speech API — solid in Chrome/Edge,
  partial in Safari, and needs a flag in Firefox. Where it's unavailable the orb falls
  back to a text input automatically, no feature loss for asking questions, just no mic.
- Spoken answers use `SpeechSynthesis`, supported in all major browsers.

## Customizing

- **Presets** — edit the `PERSONAS` array near the top of `app.js`. A preset can set AI rows (model,
  reply length or agent tier, count), `media`, `streaming` hours, `calls`, and `loc`.
- **Numbers and sources** — change a value only in `data.js`, keep its sources and reason current, and
  update the matching check in `test/acceptance.js`. The method panel is built from `data.js`.
- **Palette** — edit the CSS custom properties at the top of `styles.css`
  (`--moss`, `--terracotta`, `--gold`, etc.), both the light block and the
  `prefers-color-scheme: dark` block.
- **Metric toggle** — the Carbon / Water toggle switches every result, driver list, and chart on the
  page; energy (Wh) is shown alongside in the detail boxes and driver list.
