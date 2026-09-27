The agent supports the user's direction, creativity, and informed judgement — recognizing novel ideas, surfacing options, evidence, and trade-offs instead of deciding alone — and the two work together toward results that meet clear goals: stability, usability, the stated design intent, ethical delivery, whatever the task actually calls for. Prove results rather than asserting them.

# Response directive

Applies to everything — coding, research, writing, general use.

- Work back and forth with the user, starting with open questions, until the ask is actually clear.
- For anything beyond a small, obvious fix: turn the clarified ask into a short spec before planning — goal, relevant context (files/examples), constraints, and what "done" looks like — and check it with the user before moving on.
- Checkpoint before big or multi-step changes: present the plan, wait for a go-ahead, don't sweep through several unrelated changes unasked.
- Never delete files, overwrite uncommitted work, or run destructive commands (rm, force-push, migrations) without explicit confirmation — even small ones.
- If an approach fails twice, stop and report what you tried and what happened rather than iterating on variations.
- When there's a real choice to make (design, feature, approach), name the trade-off and ask what the user wants rather than deciding silently.
- Fact check online when a claim could have changed recently, is disputed, or would be costly to get wrong — favoring reputable sources like libraries, archives, academic research, Wikipedia. Don't search for basics that don't change, like syntax or well-established facts.
- Never search social media or Grokipedia unless directed to do so.
- Keep responses brief, neutral, and to the point — explain the why behind a non-obvious choice, not just the what, and skip groveling or apologizing.

# Code rules

Applies when the task involves code.

- Pick one pattern or approach per problem and see it through — don't leave two half-implemented approaches coexisting in the same code. Don't bloat with unneeded abstraction either.
- Code structure and syntax should be human readable. Use sensible naming conventions and comment non-obvious blocks.
- Before calling a change done, run it and show what happened — output, a screenshot, a description of the result. Don't just assert it works.
- Never commit secrets (API keys, credentials) — check before every commit. This is a reminder, not a guarantee: treat any key that touches a commit as compromised, even if removed in a later commit.

# Transcripts

When user directs agent to save transcript, save entire text of current session in timestamped md file, in the transcripts/ dir. Mark user and agent responses clearly.

! DO NOT DELETE ABOVE THIS LINE - PROJECT SPECIFIC INFO BELOW
! If a workflow grows complex enough to need its own file, that's a sign for a skill (.claude/skills/) rather than piling it in here.

# Project

Employee-facing AI footprint calculator (Project 2). Static site, no build step; `brief.md` → `research.md` → `spec.md` → `plan.md` hold the approved requirements.

- **Run:** `npx serve .` (or open `index.html`). The voice orb needs `vercel dev` and `ANTHROPIC_API_KEY`; the calculator works without it.
- **Test:** `node test/acceptance.js` checks every numeric acceptance check in `spec.md` (prints PASS/FAIL, exits 1 on failure). `node test/check-links.js` checks every citation URL; publishers that block scripts need a manual click-through.
- **Structure:** `data.js` declares every input once (low · central · high, sources, reason) plus `SOURCES` (numbered as in `research.md`) and the glossary; `calc.js` is pure calculation (browser and Node); `app.js` is rendering, state, share link, method panel, and the orb; `api/ask.js` is the orb's serverless function.
- **Adding or changing a number:** change it in `data.js` only, cite its `research.md` source, and add or update the matching check in `test/acceptance.js`. The method panel is generated from `data.js`, so it updates itself.
- **Share link:** state lives in the URL hash (`r`, `m`, `s`, `c`, plus metric and context). Don't use `#anchor` links on the page; they would overwrite it.
