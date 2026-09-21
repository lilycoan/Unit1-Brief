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
- **Sources pending user review.** Research entries 1, 13, 24, and 26, added during specification, are still marked pending. This doesn't block the build, but it is part of verification.

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
- [ ] Add the scenario-based calculation (all low / central / high, plus one named input moved) to `calc.js`
- [ ] Text rows return low · central · high from EcoLogits `whmin`/`whmax`, `embmin`/`embmax`, and `mlmin`/`mlmax`
- [ ] Show each row's range and the "Your AI use" daily and yearly range; label the donut and bars "central estimate"
- [ ] Checkpoint: the text rows show ranges, and low ≤ central ≤ high holds

**Step 2: Agent sessions (feature 2)**
- [ ] Declare the per-token factors, cache-read setting, PUE, water factors, and the light and heavy tiers in `data.js`
- [ ] Remove the fixed "agent" size; add agent rows in tier mode and advanced token mode, labelled "not model-specific"
- [ ] Add the project readout (sessions × per-session value), kept out of the daily and yearly totals
- [ ] Show the tier labels (token count and calls), the advanced-mode formula, and the cross-checks (Couch 41 Wh, Hausfather 600 Wh)
- [ ] Old share links with an `agent` row: drop the row and show the one-line notice (user's choice A)
- [ ] Checkpoint: acceptance checks 2.1–2.6 pass

**Step 3: Generated media (feature 1)**
- [ ] Declare the video and image tiers, the CPU+RAM factor, PUE, and water factors in `data.js`
- [ ] Add a "Generated media" group with add and remove rows (type, tier, amount per day), each showing a range
- [ ] Add the tier tooltips naming the measured model and resolution, the video length warning, and the per-row sources
- [ ] Media rows feed the AI totals and the donut
- [ ] Checkpoint: acceptance checks 1.1–1.5 pass

**Step 4: "Your other digital use" total and streaming (feature 3)**
- [ ] Add the second total (daily and yearly, low · central · high) beside "Your AI use," with a comparison between the two
- [ ] Declare the device watts, network and data-centre energy, and the off-site and data-centre water factors
- [ ] Add hours-per-device inputs (TV, laptop, tablet, phone) with per-device results, "borrowed range" labels, and the cross-checks (IEA 36 g, Carbon Trust 55 g)
- [ ] Add "Your other digital use" as a second highlighted bar in the daily and yearly "add" charts, and to the verdict line (user's choice B)
- [ ] Checkpoint: acceptance checks 3.1–3.5 pass

**Step 5: Video calls (feature 4)**
- [ ] Declare the call device power, data per hour, network Wh per GB, and server proxy
- [ ] Add hours, device (laptop or phone; tablet and desktop "not available," with the reason), and camera inputs
- [ ] Show the cross-checks: Greenspector, Mytton, and Obringer (text only, labelled "disputed upper estimate")
- [ ] Checkpoint: acceptance checks 4.1–4.6 pass

**Step 6: Drivers, outer bounds, and glossary (rest of feature 5)**
- [ ] Treat all text rows' EcoLogits ranges as one driver input, "EcoLogits model range" (user's choice A)
- [ ] Compute the swings for each total and the selected metric; list the top three with input, swing, source, and reason
- [ ] Add the "outer bounds" label and method note to both totals
- [ ] Add the glossary (all terms listed in the spec, with sources for factual definitions), reachable from the results and the method panel
- [ ] Checkpoint: acceptance checks 5.1–5.7 pass, including the worked example

**Step 7: Whole calculator**
- [ ] Add the Alex, Jordan, and Robin presets with the quantities in the Approach section, labelled illustrative
- [ ] Update the existing presets: "Software engineer" gets 3 light sessions, "AI power user" gets 2 heavy sessions
- [ ] Extend "Copy link" to save and restore every new input
- [ ] Rewrite the opening text and the orb system prompt neutrally; pass the new totals to the orb as context
- [ ] Checkpoint: the whole-calculator checks pass: neutral text, presets, `npx serve .` with the orb API down, and share-link round-trip

**Step 8: Citations and method panel**
- [ ] Add a method section per feature (calculation, sources, limitations as listed in the spec)
- [ ] Give every number on the results and in the method panel a citation link
- [ ] Check links by script where possible; list any the script can't reach for the user to click through
- [ ] Update `README.md` (file structure, how to run the test script) and the Project section of `AGENTS.md`
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

## Commands

### Start planning

User: Open the project repository as your workspace, start a fresh chat, and type `start planning`.

### Start implementation

User: After approving the plan, open the project repository in a fresh chat and type `start implementation`.

Agent: Read AGENTS.md, brief.md, spec.md, and this file, then inspect only the project files relevant to the approved work. Follow AGENTS.md and the approved plan. Do not begin implementation if the plan has not been approved. Keep the plan current, but never mark approval gates or user-verification items complete on the user's behalf.

### Save transcript

Agent: At the end of planning, remind the user that the transcript is a deliverable and ask them to say `save transcript`. Wait for that direction. When directed, save the entire conversation in the `transcripts/` directory as `plan-YYYY-MM-DD_HHMMSS.md`, mark user and agent responses clearly, and confirm the saved relative path.

Agent: At the end of every implementation chat, remind the user to say `save transcript`. When directed, save the entire conversation as `build-YYYY-MM-DD_HHMMSS.md` using the same location and formatting.
