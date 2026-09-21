# Technical Specification

> EDITING DIRECTIVE: USER AND AGENT EDIT THIS FILE COLLABORATIVELY. THE USER MUST REVIEW AND APPROVE ITS CONTENT.

Purpose of this file: Define what the completed project must do so it can be planned, built, and verified.

## Instructions for the user

Translate the approved research into a specification without distorting its evidence, limitations, or uncertainty. Direct the work toward the intended result, judge gaps and trade-offs rather than accepting invented requirements, and approve only a complete, testable specification grounded in the research.

## Instructions for the agent

Read AGENTS.md, brief.md, research.md, and this file. Begin with a concise orientation and one focused question.

Guide the specification one feature at a time. Help turn approved decisions into precise requirements and surface gaps or trade-offs without inventing requirements or making product decisions. Draft concise updates for review, focus on the intended result rather than implementation steps, and never approve the specification on the user's behalf.

## Goal

State what the completed project should accomplish for its intended audience.

The expanded calculator lets employees at a creative-media company estimate the energy, carbon, and water of their professional AI use (text, image and video generation, and coding-agent sessions) and see it next to everyday digital activities (streaming and video calls). Every result is a low / central / high range with visible sources, a plain-language method, and stated limitations. It helps employees reach their own informed conclusions. It is not meant to persuade them that AI is harmless or harmful.

## Features

For each feature, define:

- the need it addresses and intended audience outcome
- its behavior, inputs, and outputs
- its calculations, supporting evidence, and uncertainty
- its interface expectations and acceptance checks

Source numbers refer to `research.md`.

### Feature 1: Generated media (video and images)

> Approved by the user on 2026-09-21 as part of the full specification.

**Need and outcome.** Alex needs to see the footprint of video and image generation, not only text prompts, including water. Jordan benefits from seeing the ranges. The outcome is that employees can estimate how much energy, carbon, and water generated media may use, and can see how uncertain those estimates are.

**Inputs.** A separate "Generated media" group inside the AI-use panel. Each row has:

- **Type:** video or image.
- **Tier:** for video, Small fast model, Mid-size model, or Large model; for images, Draft, Standard, or High quality.
- **Amount per day:** seconds of video, or number of images.

Rows can be added and removed like the existing AI rows.

**Outputs.** Each row shows energy, carbon, and water as low · central · high. The rows' central values add to the same daily and yearly AI totals and the donut chart as the text rows.

**Calculation.**

- Video energy (Wh) = seconds × tier Wh per video-second × PUE.
- Image energy (Wh) = images × tier Wh per image × CPU+RAM factor × PUE.
- Carbon (g CO₂e) = Wh ÷ 1,000 × the grid intensity of the chosen location, as in the existing calculator.
- Water (L) = Wh ÷ 1,000 × water factor.
- How low and high inputs combine into a row's low and high values is defined in feature 5.

| Input | Low | Central | High | Source |
|---|---|---|---|---|
| Video, small fast model (Wh per video-second) | 0.09 (AnimateDiff) | 0.73 (LTX-Video) | 1.6 (CogVideoX-2B) | 1 |
| Video, mid-size model | 1.6 (CogVideoX-2B) | 4.1 (CogVideoX-5B) | 19 (Mochi-1) | 1 |
| Video, large model | 19 (Mochi-1) | 77 (WAN2.1-14B) | ~109 (Sora 2 Pro, 1,313 Wh ÷ 12 s; inferred, not measured) | 1, 2 |
| Image, draft: 512², 20 steps (Wh per image, GPU) | 0.247 (SD3.5) | 0.433 (Qwen) | 0.569 (Flux) | 24 |
| Image, standard: 1024², 30 steps | 1.267 (SD3.5) | 2.228 (Qwen) | 2.553 (Flux) | 24 |
| Image, high quality: 1024², 50 steps | 2.092 (SD3.5) | 3.583 (Qwen) | 4.278 (Flux) | 24 |
| CPU+RAM factor (images only) | 1.15 | 1.16 | 1.21 | 1 (Table 4 total ÷ GPU, used as a proxy) |
| PUE (video and images; applied to Sora 2 Pro too) | 1.09 (lowest provider value in EcoLogits) | 1.10 (Bistline, hyperscaler) | 1.56 (Bistline, unknown provider) | 4, 14 |
| Water factor (L per kWh) | 3.6 | 3.85 (midpoint) | 4.1 | 4 (derived from the calculator's text-model data) |

Image tiers use fp16 with guidance. SD2 is excluded from the image tiers. Central values:

- Video: small 0.80, mid-size 4.51, large 84.7 Wh per video-second.
- Images: draft 0.55, standard 2.84, high quality 4.57 Wh per image.

**Limitations shown to the user.**

- All figures come from open models on single research GPUs. No commercial tool has been measured.
- Video energy grows quadratically with clip length. The calculation is linear, so clips much longer than about 5 s are likely undercounted.
- Video tiers differ in model, resolution, and frame rate together. None reaches 1080p or 4K.
- The large video tier's high value is inferred for a commercial tool, not measured, and it is not stated whether it already includes data-centre overhead.
- The image tier settings are the project's choice, not the source's. The CPU+RAM factor is a proxy taken from video models. RAM energy in that source is estimated, not measured.
- Water is derived from the calculator's text-model data and depends on unverified WRI inputs. It is not a measured video or image water figure.
- Embodied hardware carbon is excluded, unlike the text rows.

**Interface.**

- Tier labels name the class. A tooltip names the measured model and its resolution.
- A length warning appears next to the video seconds input.
- Each row cites its sources.

**Acceptance checks.**

1. A mid-size video row of 10 s shows a central energy of 45.1 Wh. On the US grid (380 g CO₂e/kWh) that is about 17.1 g CO₂e, and water is about 0.174 L.
2. A standard image row of 10 images shows a central energy of 28.4 Wh.
3. The daily AI total rises by exactly the media rows' central values. The yearly total equals the daily total × 365.
4. Every tier shows its low and high values, the tooltip names the model, the length warning is visible, and every limitation above appears in the interface or the method panel.
5. Removing all media rows returns the totals to the text-only values.

### Feature 2: Agent sessions

> Approved by the user on 2026-09-21 as part of the full specification.

**Need and outcome.** Jordan finds "prompts per day" too simple for coding agents, and wants to see the assumptions, the ranges, and project totals. The outcome is that employees can see why agent sessions cost far more than chat prompts, and how much the answer depends on session size and assumptions.

**Inputs.** Agent sessions stay in the AI-use rows. The fixed 75,000-word "agent session" is replaced by:

- **Tier mode (default):** Light session or Heavy session, entered as sessions per day.
- **Advanced token mode:** per session, the user enters fresh-input tokens, cache-read tokens, and output tokens, plus a cache-read setting of 1%, 10%, or 25%. The chosen setting becomes the central value; the range still spans 1–25%.
- **Project readout:** the user enters the number of sessions in a project.
- Agent rows ignore the model choice and are labelled "not model-specific."

**Outputs.** Each agent row shows energy, carbon, and water as low · central · high, and its central values feed the daily and yearly totals. A separate project total (sessions × per-session value, low · central · high) does not feed the yearly total.

**Calculation.**

- Wh per session = (fresh-input tokens × input factor + cache-read tokens × input factor × cache-read setting + output tokens × output factor) ÷ 1,000 × PUE.
- Cache writes count as fresh input.
- Carbon and water are calculated as in feature 1: the location grid for carbon, and 3.6 · 3.85 · 4.1 L/kWh for water.
- How low and high inputs combine is defined in feature 5.

| Input | Low | Central | High | Source |
|---|---|---|---|---|
| Input factor (Wh per 1,000 tokens) | 0.32 | 0.32 (hyperscaler) | 0.70 (unknown provider) | 14 |
| Output factor (Wh per 1,000 tokens) | 0.96 | 0.96 | 2.1 | 14 |
| Cache-read setting (share of fresh-input cost) | 1% | 10% | 25% | 13 (price ratios) |
| PUE | 1.09 | 1.10 | 1.56 | 4, 14 |
| Light tier | 592,439 tokens, 24 calls: 3.6% fresh, 96% cache read, 0.4% output | | | 12 (size), 13 (mix, assumed) |
| Heavy tier | 10,000,000 tokens, 100+ calls, same mix | | | 13 |

At central values a light session is 30.0 Wh and a heavy session is 507 Wh. The authors' own figures are shown as cross-checks: Couch 41 Wh; Hausfather 600 Wh (250–1,200).

**Limitations shown to the user.**

- No source measures agent-session energy directly. The per-token factors are anchored to one Google disclosure, and the cache-read cost is inferred from prices.
- Bistline notes that constant per-token factors can undercount long-context work and overcount repeat-context work, so the error can go either way.
- The light tier's token mix is borrowed from the heavy-tier source.
- Both sessions come from one person's usage each. Neither author has lab data.
- The estimate is not model-specific.
- Embodied hardware carbon is excluded, unlike the other text rows.

**Interface.**

- The tier labels show the token count and number of calls.
- Advanced mode shows its formula and the cache-read setting.
- The cross-check figures and sources are visible.

**Acceptance checks.**

1. One heavy session per day has a central energy of 506.9 Wh. On the US grid (380 g CO₂e/kWh) that is about 192.6 g CO₂e, and water is about 1.95 L.
2. One light session per day has a central energy of 30.0 Wh.
3. Entering the heavy tier's token counts in advanced mode at the 10% setting gives the same result as the heavy tier.
4. A project of 20 heavy sessions shows about 10,138 Wh central. The daily and yearly totals don't change when the project count changes.
5. With other factors at central values, a heavy session is about 203 Wh at the 1% setting and about 1,014 Wh at 25%.
6. Changing the model on an agent row does not change its result.

### Feature 3: Streaming by device

> Approved by the user on 2026-09-21 as part of the full specification.

**Need and outcome.** Alex streams across a phone, a laptop, and a TV. Robin streams heavily, and Jordan's use also includes streaming. The outcome is that employees can see how streaming on different devices compares, and how streaming sits next to their AI use.

**Inputs.** Hours of streaming per day for each device: TV, laptop, tablet, and phone.

**Outputs.** For each device, energy, carbon, and water as low · central · high. Streaming adds to a new **"Your other digital use"** total (daily and yearly, low · central · high), shown side by side with the existing **"Your AI use"** total along with a comparison between the two. The AI total is unchanged by streaming.

**Calculation (per hour).**

- Energy (Wh) = device watts × 1 h + network (17.71 Wh) + data centre (3.85 Wh). These are the IEA's 23% and 5% shares of 0.077 kWh.
- Carbon (g CO₂e) = Wh ÷ 1,000 × the location grid.
- Water (L) = [(device + network Wh) × off-site factor + data-centre Wh × data-centre factor] ÷ 1,000.
- How low and high inputs combine is defined in feature 5.

| Input | Low | Central | High | Basis |
|---|---|---|---|---|
| TV (W) | 45 (borrowed) | 75 | 93.2 (one ENERGY STAR model) | 10, 8, 7 |
| Laptop (W) | 9 | 15 | 22 | 11, 10 |
| Tablet (W) | 2.3 (borrowed) | 3.8 (assumed at 5× phone) | 5.6 (borrowed) | 10 |
| Phone (W) | 0.45 (borrowed) | 0.75 | 1.1 (borrowed) | 10 |
| Network + data centre (Wh per hour) | 12.9 (borrowed) | 21.56 | 31.6 (borrowed) | 7, 8 |
| Off-site water (L per kWh; device and network) | 2.5 | 2.65 | 2.8 | 4 (derived, unverified) |
| Data-centre water (L per kWh) | 3.6 | 3.85 | 4.1 | 4 (derived) |

"Borrowed" means the laptop's relative spread (0.6× to 1.47× of its central value) applied to a value with no sourced range. The derivation reproduces the IEA device energy: weighting by the IEA device mix gives 55.2 Wh against the IEA's 55.4 Wh.

Central values per hour of streaming:

| Device | Energy | Carbon, US grid | Water |
|---|---|---|---|
| TV | 96.6 Wh | 36.7 g | 261 mL |
| Laptop | 36.6 Wh | 13.9 g | 102 mL |
| Tablet | 25.4 Wh | 9.6 g | 72 mL |
| Phone | 22.3 Wh | 8.5 g | 64 mL |

Cross-checks shown to the user: IEA 36 g CO₂ per hour (global grid, device mix; source 7) and Carbon Trust 55 g CO₂e per hour (Europe, Netflix-funded; source 9).

**Limitations shown to the user.**

- Per-device power is our own derivation from 2019 averages and a press fact-check. No primary per-device measurement was found.
- The tablet value is assumed.
- The ranges for phone, tablet, and network, and the TV's low, are borrowed from laptop measurements.
- Watching on cellular data uses more network energy than assumed.
- The water factors are back-calculated and unverified.
- Device manufacturing is excluded.

**Interface.** Hours input per device, the per-device results with ranges, "borrowed range" labels, the cross-checks, and sources.

**Acceptance checks.**

1. Two hours of TV per day has a central energy of 193.1 Wh, which is about 73.4 g CO₂e on the US grid and about 521 mL of water.
2. One hour on a phone has a central energy of 22.3 Wh, most of it network and data centre.
3. Every device shows its low and high values, and borrowed ranges are labelled.
4. Streaming changes the "Your other digital use" total and never the "Your AI use" total.
5. Setting all devices to 0 hours removes streaming from the totals.

### Feature 4: Video calls

> Approved by the user on 2026-09-21 as part of the full specification.

**Need and outcome.** Jordan and Robin spend substantial time in video meetings. The outcome is that employees can see how call length, camera use, and device affect the footprint of their calls, and how far published estimates disagree.

**Inputs.**

- Hours of calls per day.
- Device: laptop or phone. Tablet and desktop are shown as "not available," with the reason.
- Camera: on or off.

**Outputs.** Energy, carbon, and water as low · central · high. Calls add to the "Your other digital use" total, next to streaming.

**Calculation (per hour).**

- Energy (Wh) = device watts × 1 h + data (GB) × network energy per GB + server proxy.
- Carbon (g CO₂e) = Wh ÷ 1,000 × the location grid.
- Water (L) = [(device + network Wh) × off-site factor + server Wh × data-centre factor] ÷ 1,000, using feature 3's water factors.
- How low and high inputs combine is defined in feature 5.

| Input | Low | Central | High | Basis |
|---|---|---|---|---|
| Laptop (W), either camera setting | 9 | 15 | 22 | 11, 10 (no call-specific measurement) |
| Phone, camera on (W) | 0.75 | 2.375 (midpoint) | 4.0 | 10, 26 |
| Phone, camera off (W) | 2.0 | 2.5 | 3.0 | 26 (audio only, screen off) |
| Data, camera on (GB per hour) | 0.62 | 0.62 | 3.24 | 17, 18 |
| Data, camera off (GB per hour) | 0.053 (audio only) | 0.31 (50% of camera on) | 1.62 | 17, 19 |
| Network energy (Wh per GB) | 5.74 (borrowed) | 9.57 (IEA-derived: 17.71 Wh ÷ 1.85 GB) | 15 (Mytton, fixed-line) | 7, 18 |
| Server proxy (Wh per hour) | 2.31 (borrowed) | 3.85 (streaming data-centre share) | 5.65 (borrowed) | 7 |

"Borrowed" means the laptop streaming range's relative spread (0.6× to 1.47×), as in feature 3.

Central values per hour:

| | Energy | Carbon, US grid | Water |
|---|---|---|---|
| Laptop, camera on | 24.8 Wh | 9.4 g | 70 mL |
| Laptop, camera off | 21.8 Wh | 8.3 g | 62 mL |
| Phone, camera on | 12.2 Wh | 4.6 g | 37 mL |
| Phone, camera off | 9.3 Wh | 3.5 g | 29 mL |

**Cross-checks shown to the user.**

- Greenspector (source 17): 19 g/h audio only and 66 g/h camera on (2016 phone, grid not stated). This is about 12× our phone estimate; the gap is unexplained.
- Mytton (source 18): 12 g/h, network only, UK grid.
- Obringer (source 16): 150–1,000 g/h and a "96% camera-off saving," shown as text only and labelled "disputed upper estimate; method not verified." It is not part of any range.

**Limitations shown to the user.**

- There is no laptop call measurement. The laptop value comes from browsing and streaming, so camera and encoding load is likely underestimated.
- The phone values come from one low-end phone measured in 2021. The 3.85 V battery voltage is our assumption, and the camera-off value was measured with the screen off.
- Network energy per GB is derived, and both Mytton and Guennebaud caution against per-GB intensity figures.
- Server energy is a proxy borrowed from streaming.
- Published estimates for calls differ by up to about 50×.
- Device manufacturing is excluded.

**Interface.** Hours, device, and camera inputs, with "not available" shown for tablet and desktop. Results with ranges, the three cross-checks, and sources.

**Acceptance checks.**

1. One hour on a laptop with the camera on is 24.8 Wh central: about 9.4 g CO₂e on the US grid and about 70 mL of water.
2. Turning the camera off on a laptop lowers the central value to 21.8 Wh (−12%), and the interface shows that the device dominates.
3. One hour on a phone with the camera on is 12.2 Wh central.
4. Calls change "Your other digital use" and never "Your AI use."
5. Greenspector, Mytton, and Obringer appear as labelled cross-checks and not in the calculated range.
6. Choosing tablet or desktop shows "not available" with the reason and adds nothing to the totals.

### Feature 5: Range for the whole result, and what drives it

> Approved by the user on 2026-09-21 as part of the full specification.

**Need and outcome.** Robin needs honest, plain-language uncertainty and visible sources. Jordan asked for ranges and assumptions. Alex's video and water figures are the least certain in the calculator. Source 20 found that numeric ranges cost little trust, less than verbal hedges. The outcome is that employees see how wide the plausible range of each total is, and which assumptions make it wide.

**Behavior.**

- **Row ranges.** Each row's low value uses every input at its low, and its high value uses every input at its high. Text rows use EcoLogits' existing min/max values (`whmin`/`whmax`, `embmin`/`embmax`, `mlmin`/`mlmax`).
- **Total ranges.** "Your AI use" and "Your other digital use" each show low · central · high, per day and per year. Each total is the sum of its rows' lows, centrals, and highs. They're labelled "outer bounds: every assumption at its best or worst case at once, not a likely range."
- **Location grid.** The grid intensity is the user's chosen location, so it isn't varied.
- **What drives it.** For each total and the selected metric (carbon or water), each uncertain input is moved from its low to its high while everything else stays central. The resulting change in the total is its "swing." The top three inputs by swing are listed in plain words. Each entry names the input, its swing in the same units as the total, and its source, and says why it's uncertain. Example: "Cache-read cost (±811 Wh): no one has measured it; it's estimated from prices (source 13)."
- **Shared inputs** (PUE, water factors, network energy, server proxy) are each moved once across all rows that use them.
- **Charts.** The donut and comparison bars keep using central values and are labelled "central estimate."
- **Glossary.** A short plain-language glossary covers the terms needed to read the results and ranges: g CO₂e, Wh and kWh, mL and L, blue water, on-site and off-site water, PUE, grid intensity, tokens and cache reads, EcoLogits, "derived estimate," "borrowed range," and "outer bounds." Factual definitions cite their sources.

**Worked example.** One heavy agent session and 2 h of TV per day, US grid, carbon:

- AI use: 76.3 · 192.6 · 1,195 g CO₂e per day (a spread of about 15×). Top drivers by energy swing: cache-read setting (811 Wh), per-token provider factor (602 Wh), PUE (217 Wh).
- Other digital use (TV): 44.0 · 73.4 · 94.9 g CO₂e per day. Top drivers: TV power (96 Wh), then network (37 Wh).

**Limitations shown to the user.**

- All-low / all-high is wider than a statistical range, because it assumes every factor is at its extreme at once.
- The ranges reflect only the sources' figures. They don't cover unknowns such as commercial tools that nobody has measured.
- "Borrowed" ranges are proxies.

**Interface.** Each total shows its range in numbers, not only in words. The driver list sits next to each total. A method note explains outer bounds in one or two plain sentences. The glossary is reachable from the results and the method panel.

**Acceptance checks.**

1. For the worked example, the AI total shows 76.3 · 192.6 · 1,195 g CO₂e, and the drivers are listed in the order cache-read setting, provider factor, PUE.
2. For the worked example, the other-digital total shows 44.0 · 73.4 · 94.9 g CO₂e.
3. Every row's low ≤ central ≤ high, and each total's low, central, and high equal the sums of its rows' values.
4. Changing the carbon/water toggle recalculates the driver list for that metric.
5. The yearly range equals the daily range × 365.
6. With all inputs at zero, the totals show 0 and no drivers are listed.
7. Every glossary term listed above is defined, and factual definitions cite a source.

### Requirements for the whole calculator

> Approved by the user on 2026-09-21 as part of the full specification.

- **Neutral framing.** The opening text is rewritten neutrally. It no longer says AI's footprint is "usually a much smaller one than people assume."
- **Voice orb.** The orb's instructions are made neutral: no claim that AI use is usually small. It points to the page's sources and says when it isn't sure. The calculator works fully without the orb.
- **Persona presets.** Alex, Jordan, and Robin presets are added next to the existing presets. They fill in the new inputs to match each profile's activities. The quantities are illustrative and labelled as such, and they're set with the user during planning. The existing presets are kept and updated to use the new features; the "Software engineer" preset moves from the old fixed agent session to an agent tier.
- **Runs locally.** The calculator runs with `npx serve .` (or by opening `index.html` directly), as in the README.
- **Share link.** "Copy link" saves and restores every new input.
- **Citations.** The "How these numbers are made" panel is updated for each feature, so every factual or numerical claim on the page has a working citation, along with its limitations.
- **Unchanged parts.** Existing text rows and comparison figures stay the same, except for the agent session, which feature 2 replaces.

**Acceptance checks.**

1. The opening text and the orb's instructions contain no claim that AI's footprint is usually small or large.
2. Each of the Alex, Jordan, and Robin presets fills in inputs from at least one feature relevant to that profile, and is labelled illustrative.
3. The page loads and calculates with `npx serve .` and with the orb's API unavailable.
4. A copied link, opened in a new tab, restores every input and the same results.
5. Every number in the method panel and on the results has a citation link that opens.

## User approval

Review the completed specification directly and explicitly approve it before planning begins. The agent cannot complete this approval on the user's behalf.

> **USER-APPROVED — 2026-09-21.** The user explicitly approved the full specification ("i approve the specification"). Open items carried into planning: the illustrative quantities for the Alex, Jordan, and Robin presets; and the user's own check of the research.md entries added during specification (sources 1, 13, 24, and 26), which are still marked pending review.

## Out of scope

Record ideas that will not be part of this project.

> Approved by the user on 2026-09-21 as part of the full specification.

- **Social media hours:** the only measurements are one consultancy's unverified 2021 old-phone tests, with conflicting secondary figures (source 21).
- **Gaming PC energy:** not researched.
- **Desktop and tablet video calls:** no call-specific data; shown as "not available."
- **A parametric video model** (resolution and step inputs), and scaling video energy with clip length: tiers and a linear calculation with a warning were chosen instead.
- **Streaming as one range with no device breakdown.**
- **Image generation as a separate feature:** folded into feature 1.
- **Statistical (Monte Carlo) or error-propagation ranges:** all-low / all-high was chosen for transparency.
- **Model-specific agent-session energy:** agent rows are not model-specific.
- **Embodied hardware carbon** for the new rows, and **device manufacturing** for streaming and calls: stated as limitations, not estimated.
- **Measurements of commercial video, image, or agent tools:** none exist in the sources.

## Revisions

If implementation changes the intended result, update the specification and record what changed and why.

## Commands

### Start specification

User: Open the project repository as your workspace, start a fresh chat, and type `start specification`.

### Save transcript

Agent: After the user approves the specification, remind them that the transcript is a deliverable and ask them to say `save transcript`. Wait for that direction.

When the user directs the agent to save the transcript, the agent saves the entire conversation in the `transcripts/` directory as `spec-YYYY-MM-DD_HHMMSS.md`, marks user and agent responses clearly, and confirms the saved relative path.
