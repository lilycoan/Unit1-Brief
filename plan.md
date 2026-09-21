# Implementation Plan

> EDITING DIRECTIVE: USER AND AGENT EDIT THIS FILE COLLABORATIVELY. THE USER MUST REVIEW AND APPROVE ITS CONTENT.

Purpose of this file: Turn the approved specification into ordered, updatable implementation and verification work.

## Instructions for the user

Preserve the approved requirements and verify the completed work. Direct priorities, scope, and meaningful checkpoints; judge technical choices, risks, and proposed changes; and approve results only after checking them against the specification rather than relying solely on the agent's report.

If the intended result changes, update the specification. If only the route changes, update this plan and record the revision.

## Instructions for the agent

Read AGENTS.md, brief.md, research.md, spec.md, and this file, then inspect the relevant project files. Begin with a concise orientation and one focused question.

Guide planning one stage at a time. Surface dependencies, risks, and verification needs without expanding scope or making decisions for the user. Draft concise, project-specific tasks and keep them current. Never mark approval gates or user-verification items complete on the user's behalf.

## Approach

Describe the technical approach, important dependencies, and the order in which the features will be built. Explain any non-obvious choices and identify likely risks.

> **USER-APPROVED — 2026-09-21.** The user explicitly approved the plan ("i approve the plan"). The approval gates in the checklist are left for the user to tick.

**Structure (user's choice: option B).** The calculator stays a static site with no build step, so it still runs with `npx serve .` or by opening `index.html` directly.

- `data.js` holds all data: the existing `MODELS` and comparison tables, plus every new uncertain input, each declared once with low, central, high, a source number, and a one-line reason it's uncertain.
- `calc.js` holds the pure calculations, with no page access. It loads in the browser through a `<script>` tag and in Node through `require`.
- `app.js` keeps rendering, state, the share link, and the orb.
- `test/acceptance.js`, run with `node test/acceptance.js`, checks every numeric acceptance check in `spec.md` and prints pass or fail for each. The user can re-run it independently.

**Why option B:** the spec has about 30 numeric acceptance checks. A re-runnable script is evidence the user can check without relying on the agent's report.

**Range method.**
- Each row calculation takes a scenario: all low, all central, all high, or "one named input moved, everything else central."
- Row ranges and total ranges use the first three scenarios.
- The driver list uses the last one. Because shared inputs (PUE, water factors, network energy, server proxy) are declared once, moving one moves it across every row that uses it, as feature 5 requires.
- Grid intensity is not varied.

**Build order (user-approved sequence).** Each step ends in a checkpoint the user reviews before a commit.

0. Refactor into `data.js`, `calc.js`, and `app.js`, and add the test script. The page's behavior is unchanged.
1. Range core. Text rows use the EcoLogits min/max, and "Your AI use" shows low · central · high.
2. Feature 2: agent sessions.
3. Feature 1: generated media.
4. The "Your other digital use" total, then feature 3: streaming.
5. Feature 4: video calls.
6. The rest of feature 5: drivers, the outer-bounds label, and the glossary.
7. Whole-calculator requirements: presets, share link, neutral opening text, and orb prompt.
8. Citations and the method panel.
9. The user's independent verification.

Ranges come first, so each feature is built range-aware and needs no rework. Agent sessions come before media because they change existing rows, while media only adds new ones.

**Dependencies.** Steps 2–6 depend on the range core (step 1). Step 6's drivers need every uncertain input from steps 2–5 declared in `data.js`. Step 7's presets and share link need all input groups to exist.

**Planning decisions and risks:**
- **Text-row drivers (step 6), settled 2026-09-21 (user chose A).** All text rows' EcoLogits min/max form one driver input, "EcoLogits model range," moved together from low to high. Text-row water comes from EcoLogits directly, so the shared 3.6–4.1 L/kWh water-factor driver moves only the media and agent rows.
- **Old share links (step 2), settled 2026-09-21 (user chose A).** When a link contains a row with the removed "agent" size, the row is dropped and a one-line notice appears: "An old 'agent session' row was removed because the method changed. Add an agent session to include it."
- **Comparison charts (step 4), settled 2026-09-21 (user chose B).** Both the daily and yearly "add" bar charts show "Your other digital use" as a second highlighted bar next to "Your AI use" (central values), and the verdict line mentions both. The donut stays AI-only, showing AI rows by share.
- **Rounding (all steps).** Spec values are rounded. The test script uses a stated tolerance (about ±0.5% or the spec's last digit) so rounding isn't mistaken for a pass or a failure.
- **Citation links (step 8).** Some publisher pages have blocked automated fetches before (403s). Links are checked by script where possible, and the user clicks through the rest.
- **Preset quantities (step 7), settled 2026-09-21 (user accepted the draft).** Illustrative; the page labels them "illustrative; adjust to your own day." Gaming and social media are out of scope and not included.

  | Preset | AI use (per day) | Other digital use (per day) | Location |
  |---|---|---|---|
  | Alex | 10 GPT-5.5 chatbot replies · 10 standard images · 20 s of mid-size video | TV 2 h · laptop 1 h · phone 1 h | US |
  | Jordan | 1 heavy agent session (project: 20 sessions) · 10 Claude Sonnet 4.6 chatbot replies · 5 draft images | Calls 2 h on a laptop, camera on · laptop streaming 1 h | US |
  | Robin | 2 GPT-5.5 chatbot replies | Calls 4 h on a laptop, camera on · TV 2 h · phone 1 h | US |

  Existing presets: "Software engineer" moves from 3 old Sonnet agent sessions to 3 light sessions; "AI power user" moves from 2 old Opus agent sessions to 2 heavy sessions. The other existing presets are unchanged.
- **Range layout (step 1), settled 2026-09-21 (user chose option 1).** Each row shows its per-day range on a small line under its inputs; the "Your AI use" daily and yearly range sits under the verdict sentence. All three numbers in a range share one unit.
- **Embodied carbon has no range in 42 of 63 EcoLogits entries (found in step 1; recounted in step 8).** For those, `embmin` = `emb` = `embmax`, so only the energy part of a text row's carbon varies. The step 1 count (48 of 72) included the removed agent size; the method panel counts live over the current reply lengths and states it.
- **Agent row layout (step 2), settled 2026-09-21 (user chose option 1).** Agent sessions are chosen from the reply-length dropdown (light, heavy, or "enter tokens"). The model dropdown greys out as "not model-specific", and a box under the row shows energy, carbon, and water ranges, the project readout (default 20 sessions), the cross-checks, and, in custom mode, the token inputs, cache-read setting, and formula. Input and output per-token factors move together as one input, "Per-token energy (provider type)", which reproduces the spec's 602 Wh driver.
- **Media values (step 3).** The media tiers use the spec's approved (rounded) values, e.g. 4.1 Wh per video-second for CogVideoX-5B, so the page matches the spec's 45.1 Wh. The unrounded Table 4 value (25.3 Wh ÷ 6.125 s ≈ 4.13) would give 45.4 Wh. The tier tooltip also appears as a visible "Measured:" line in each row, since tooltips don't show on touch screens. Media rows are saved in the share link as `m=type:tier:amount`.
- **Feature 1 limitations still to place (step 8).** Shown on the page now: open models on research GPUs, no commercial tool, embodied carbon excluded, the length warning, and the large tier's inferred high end. Still to go in the method panel: tiers differ in model, resolution, and frame rate at once (none reaches 1080p or 4K); Sora 2 Pro may or may not include overhead; the tier settings are the project's choice; the CPU+RAM proxy and estimated RAM; derived water.
- **Totals layout (step 4), settled 2026-09-21 (user chose option 1).** The left column stacks the input panels ("Your AI use", then "Your other digital use"); the right column is the results card: the verdict mentioning both totals, the two totals side by side (daily and yearly, low · central · high), a one-line central comparison, then the AI-only donut. Streaming network and data-centre energy is one input ("streamNetwork", 12.94 · 21.56 · 31.62 Wh per hour), so its swing matches the spec's 37 Wh; its two parts stay separate for water.
- **Video calls (step 5).** One set of call inputs (hours, device, camera), not rows, matching the spec. Laptop call power reuses the streaming `laptopPower` input (same values and sources), so in step 6 moving "laptop power" moves streaming and calls together. A per-hour central breakdown (device · network · server) and the other camera setting's result are shown, which is how 4.2's "the device dominates" appears. Shared in the link as `c=hours:device:camera`.
- **Greenspector ratio (step 5), settled 2026-09-21 (user chose the live ratio).** The ratio depends on the grid (about 14× US, 43× UK), so the page computes it for the chosen grid. `spec.md` feature 4 wording updated and recorded under its Revisions.
- **Feature 4 limitations still to place (step 8).** Shown on the page now: no laptop call measurement, estimates differ by up to about 50×, device manufacturing excluded, the server proxy, and borrowed ranges. Still to go in the method panel: the phone is one low-end 2021 model, the 3.85 V battery voltage is our assumption, camera-off was measured with the screen off, and both Mytton and Guennebaud caution against per-GB figures.
- **Drivers and glossary (step 6).** Each driver shows its swing in the selected metric plus its energy swing, e.g. "Cache-read cost: a swing of 308 g CO₂e (811 Wh) from its low to its high". The spec's example writes "±811 Wh", but 811 Wh is the full low-to-high change, not a ± half-width, so the page says "swing … from its low to its high". The glossary opens from buttons in the results card and the method panel (not `#` links, which would overwrite the share-link hash).
- **Glossary sources (step 6), settled 2026-09-21 (user chose to find and verify).** "g CO₂e" cites the IPCC AR6 WG1 glossary (new research entry 27, read in the PDF); "blue water" cites the Water Footprint Network glossary (new entry 28). EPA pages checked had no standalone CO₂e definition. Units and the project's own terms have no source.
- **Whole calculator (step 7).** The Alex, Jordan, and Robin presets sit in their own row after the label "Profiles, illustrative; adjust to your own day:" and set the location to the US; every preset now sets every input (AI rows, media, streaming, calls). The orb receives both totals as ranges plus each total's top three drivers; its system prompt tells it to stay neutral, treat low and high as outer bounds, point to the method panel and glossary, and say when it isn't sure.
- **Orb answer length: open finding, not changed (step 7).** `api/ask.js` calls `claude-sonnet-5` with `max_tokens: 300` and no `thinking` setting; on Sonnet 5 that means adaptive thinking is on, and thinking tokens count toward the 300, so a harder question could cut the spoken answer short. Options: set `thinking: {type: "disabled"}` (answers are short and spoken), or raise `max_tokens`. Left for the user to decide; outside step 7's scope.
- **Citations and method panel (step 8).** Every "source N" on the page links through one `SOURCES` table in `data.js` (numbered as in `research.md`); source 10, our own derivation, links to sources 7 and 8. Comparison figures, typical footprints, and location grids cite Andy Masley's calculator ("Masley"), whose page holds their full citation list, as the original page did. The method panel is generated from `data.js`: one section per feature with its calculation, an input table (low · central · high, borrowed labels, sources), cross-checks, and the spec's limitations, plus sections on ranges, comparisons, and the numbered source list. `node test/check-links.js` got HTTP 200 from all 20 source URLs on 2026-09-21; a 200 shows the page opens, not that it still says what is cited.
- **Method text changed (step 8), for the user to confirm.** The original panel said training "adds very little to any one person's footprint". That is an unsourced claim of the kind the neutral-framing requirement removes, so the panel now says only that training is excluded and the calculator covers use.
- **Sources pending user review.** Research entries 1, 13, 24, and 26, added during specification, and 27 and 28, added in step 6, are still marked pending. This doesn't block the build, but it is part of verification.

## Checklist

Replace or expand the implementation placeholders below with tasks specific to the approved specification.

### Approval gates

- [ ] User has reviewed, verified, and approved the research claims and selected features
- [ ] User has reviewed and approved the specification
- [ ] User has reviewed and approved the implementation approach and task sequence

### Implementation

> Approved by the user on 2026-09-21 as part of the full plan. Tasks follow the build order in the Approach section. Each step ends in a user checkpoint and a commit.

**Step 0: Refactor (no behavior change)**
- [x] Move `MODELS`, `SIZES`, locations, and comparison tables into `data.js`; move the calculations into `calc.js`; load both from `index.html` before `app.js`
- [x] Add `test/acceptance.js` with a pass/fail printer and a baseline check that current text-row results are unchanged
- [ ] Checkpoint: the page renders and calculates as before (screenshot comparison); the script runs

**Step 1: Range core**
- [x] Add the scenario-based calculation (all low / central / high, plus one named input moved) to `calc.js`
- [x] Text rows return low · central · high from EcoLogits `whmin`/`whmax`, `embmin`/`embmax`, and `mlmin`/`mlmax`
- [x] Show each row's range and the "Your AI use" daily and yearly range; label the donut and bars "central estimate"
- [ ] Checkpoint: the text rows show ranges, and low ≤ central ≤ high holds

**Step 2: Agent sessions (feature 2)**
- [x] Declare the per-token factors, cache-read setting, PUE, water factors, and the light and heavy tiers in `data.js`
- [x] Remove the fixed "agent" size; add agent rows in tier mode and advanced token mode, labelled "not model-specific"
- [x] Add the project readout (sessions × per-session value), kept out of the daily and yearly totals
- [x] Show the tier labels (token count and calls), the advanced-mode formula, and the cross-checks (Couch 41 Wh, Hausfather 600 Wh)
- [x] Old share links with an `agent` row: drop the row and show the one-line notice (user's choice A)
- [ ] Checkpoint: acceptance checks 2.1–2.6 pass

**Step 3: Generated media (feature 1)**
- [x] Declare the video and image tiers, the CPU+RAM factor, PUE, and water factors in `data.js`
- [x] Add a "Generated media" group with add and remove rows (type, tier, amount per day), each showing a range
- [x] Add the tier tooltips naming the measured model and resolution, the video length warning, and the per-row sources
- [x] Media rows feed the AI totals and the donut
- [ ] Checkpoint: acceptance checks 1.1–1.5 pass

**Step 4: "Your other digital use" total and streaming (feature 3)**
- [x] Add the second total (daily and yearly, low · central · high) beside "Your AI use," with a comparison between the two
- [x] Declare the device watts, network and data-centre energy, and the off-site and data-centre water factors
- [x] Add hours-per-device inputs (TV, laptop, tablet, phone) with per-device results, "borrowed range" labels, and the cross-checks (IEA 36 g, Carbon Trust 55 g)
- [x] Add "Your other digital use" as a second highlighted bar in the daily and yearly "add" charts, and to the verdict line (user's choice B)
- [ ] Checkpoint: acceptance checks 3.1–3.5 pass

**Step 5: Video calls (feature 4)**
- [x] Declare the call device power, data per hour, network Wh per GB, and server proxy
- [x] Add hours, device (laptop or phone; tablet and desktop "not available," with the reason), and camera inputs
- [x] Show the cross-checks: Greenspector, Mytton, and Obringer (text only, labelled "disputed upper estimate")
- [ ] Checkpoint: acceptance checks 4.1–4.6 pass

**Step 6: Drivers, outer bounds, and glossary (rest of feature 5)**
- [x] Treat all text rows' EcoLogits ranges as one driver input, "EcoLogits model range" (user's choice A)
- [x] Compute the swings for each total and the selected metric; list the top three with input, swing, source, and reason
- [x] Add the "outer bounds" label and method note to both totals
- [x] Add the glossary (all terms listed in the spec, with sources for factual definitions), reachable from the results and the method panel
- [ ] Checkpoint: acceptance checks 5.1–5.7 pass, including the worked example

**Step 7: Whole calculator**
- [x] Add the Alex, Jordan, and Robin presets with the quantities in the Approach section, labelled illustrative
- [x] Update the existing presets: "Software engineer" gets 3 light sessions, "AI power user" gets 2 heavy sessions (done early, in step 2; see Revisions)
- [x] Extend "Copy link" to save and restore every new input
- [x] Rewrite the opening text and the orb system prompt neutrally; pass the new totals to the orb as context
- [ ] Checkpoint: the whole-calculator checks pass: neutral text, presets, `npx serve .` with the orb API down, and share-link round-trip

**Step 8: Citations and method panel**
- [x] Add a method section per feature (calculation, sources, limitations as listed in the spec)
- [x] Give every number on the results and in the method panel a citation link
- [x] Check links by script where possible; list any the script can't reach for the user to click through
- [x] Update `README.md` (file structure, how to run the test script) and the Project section of `AGENTS.md`
- [ ] Checkpoint: whole-calculator acceptance check 5 (every citation link opens)

**Throughout**
- [ ] Keep `plan.md` and `spec.md` aligned; record any change under Revisions

### Verification

- [ ] User has checked feature behavior and calculations against the specification and sources independently of the agent
- [ ] User has confirmed factual and numerical claims have working citations and communicate important limitations or uncertainty
- [ ] User has confirmed the project runs locally, serves all three reference profiles, and matches the specification

### Delivery

- [ ] Commit meaningful checkpoints and export the working chat transcripts
- [ ] Add the provided Project 2 debrief, complete it after verification, and export its transcript

## Revisions

Record material changes to the approach, sequence, or checklist and explain why they were made.

- **2026-09-21, initial draft.** Structure, build order, and four planning decisions (comparison charts, text-row driver, old share links, preset quantities) set with the user during planning. No changes to `spec.md`.
- **2026-09-21, step 2: preset update moved earlier.** Removing the fixed "agent" size would have broken the "Software engineer" and "AI power user" presets, so their switch to 3 light and 2 heavy sessions (planned for step 7) was done in step 2. The two step 0 baseline test rows that used the old size were retired. Result: "Software engineer" falls from 241 to 39 g CO₂e per day (US, central); "AI power user" stays about 1.3 kg.
- **2026-09-21, step 2: typing no longer drops focus (user approved).** The original calculator rebuilt every row on each keystroke, so a number box lost focus after one character (confirmed on the pre-project code). Typing now updates results in place; rows are rebuilt only when their structure changes.
- **2026-09-21, step 2: range units follow the central value.** A range's shared unit is now chosen from its central value rather than its high end, so a heavy session reads "76 · 193 · 1,195 g CO₂e" rather than "0.076 · 0.19 · 1.2 kg CO₂e". Text-row displays were unchanged.
- **2026-09-21, step 4: "you" bars always shown (user approved).** The original charts kept only the top 8 bars, so a small "Your AI use" bar was silently dropped. Both "Your AI use" and "Your other digital use" bars now always appear when above zero, and comparison items fill the rest. Verified: the only differences from step 3 across the 14 regression scenarios are the you-bar now appearing (17 chart instances).
- **2026-09-21, step 4: totals renamed and inputs shown at their precision.** `aiDaily`/`aiRange` in `calc.js` became `totalDaily`/`totalRange`, since the same sum serves both totals. Declared input values (watts, Wh per unit) now display up to 4 significant figures (e.g. 93.2 W, 2.228 Wh) instead of being rounded like results.

## Commands

### Start planning

User: Open the project repository as your workspace, start a fresh chat, and type `start planning`.

### Start implementation

User: After approving the plan, open the project repository in a fresh chat and type `start implementation`.

Agent: Read AGENTS.md, brief.md, spec.md, and this file, then inspect only the project files relevant to the approved work. Follow AGENTS.md and the approved plan. Do not begin implementation if the plan has not been approved. Keep the plan current, but never mark approval gates or user-verification items complete on the user's behalf.

### Save transcript

Agent: At the end of planning, remind the user that the transcript is a deliverable and ask them to say `save transcript`. Wait for that direction. When directed, save the entire conversation in the `transcripts/` directory as `plan-YYYY-MM-DD_HHMMSS.md`, mark user and agent responses clearly, and confirm the saved relative path.

Agent: At the end of every implementation chat, remind the user to say `save transcript`. When directed, save the entire conversation as `build-YYYY-MM-DD_HHMMSS.md` using the same location and formatting.
