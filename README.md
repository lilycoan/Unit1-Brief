# Your AI Footprint

An employee-facing AI carbon & water footprint calculator, forked from Andy Masley's
[AI prompt footprint calculator](https://andymasley.com/visuals/ai-prompt-footprint/)
(source in `ai-prompt-footprint-source.txt`, used under his CC0 public-domain release).
Static site — no build step, no framework — plus one small serverless function for
the voice-driven Q&A orb.

## What's here

- `index.html`, `styles.css`, `app.js` — the calculator: persona presets, an earth-tone
  bar/donut chart layout, and a carbon/water toggle. All the per-model energy/carbon/water
  figures and comparison data (EcoLogits v0.10, EPA, Ember, Poore & Nemecek, Founders
  Pledge, Water Footprint Network — see the "How these numbers are made" panel on the
  page) are carried over unchanged from the source file.
- `api/ask.js` — a Vercel serverless function. The page's voice orb records a question
  with the browser's Web Speech API, sends it here, and this function calls the Claude
  API server-side (so the API key never reaches the browser) and returns a short spoken
  answer.

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

- **Persona presets** — edit the `PERSONAS` array near the top of `app.js` (model,
  reply-length, and count-per-day rows for each).
- **Palette** — edit the CSS custom properties at the top of `styles.css`
  (`--moss`, `--terracotta`, `--gold`, etc.), both the light block and the
  `prefers-color-scheme: dark` block.
- **Water section** — currently the 💧 Water toggle switches every chart on the page
  (donut, daily bars, yearly add/cut bars) to use the personal blue-water figures instead
  of carbon; there's no separate page/section to keep in sync.
