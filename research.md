# Research

> EDITING DIRECTIVE: USER AND AGENT EDIT THIS FILE COLLABORATIVELY. THE USER MUST REVIEW AND APPROVE ITS CONTENT.

Purpose of this file: Develop and record the evidence and decisions that will guide the technical specification.

## Instructions for the user

You are responsible for the ethics, accuracy, and fairness of the research. Direct the inquiry toward useful questions, judge sources and suggestions rather than accepting them at face value, and approve only results supported by verified evidence and audience needs. Seek evidence that challenges your assumptions, represent uncertainty honestly, and reject claims you cannot verify. See [UNESCO's Guidance for generative AI in education and research](https://www.unesco.org/en/articles/guidance-generative-ai-education-and-research).

## Instructions for the agent

Read AGENTS.md, brief.md, and this file. Begin with a concise orientation and one focused question.

Guide the research one stage at a time. Help the user explore options, assess sources, and identify contrary evidence or uncertainty without making decisions for them. Draft concise updates for review, and never mark research or feature choices approved on the user's behalf.

## Reference employee profiles

- Alex — Los Angeles, 24, junior video editor: Uses text, image, and video-generation tools for production work. Streams reference media and uses social platforms across a phone, laptop, and television. Wants to understand impacts beyond text prompts and is particularly attentive to water use.
- Jordan — Austin, 38, creative technologist: Uses coding agents and generative tools in long, irregular sessions. Games on a desktop PC and participates in frequent video calls. Finds "prompts per day" too simplistic and wants assumptions, ranges, and project-level totals.
- Robin — Chicago, 56, operations manager: Uses text AI occasionally but spends substantial time in video meetings, streaming media, and social platforms. Is skeptical of the company's motives and needs plain-language explanations, visible sources, and honest indications of uncertainty.

These are fictional starting profiles, not evidence about demographic groups. Research the activities, circumstances, and needs they represent rather than making assumptions based on age or location.

## Audience needs

Record information about the activities, circumstances, and needs represented by all three reference profiles. Separate evidence from assumptions that still need checking.

> DRAFT — all three profiles have been researched at least in part (Alex and Jordan the most; Robin less). Nothing here is approved.

### Alex (junior video editor)

**Evidence (from the current calculator code, `app.js`):**
- Task sizes are text-only ("agent session" is a token-count proxy). There is no image or video generation.
- Water appears only as a toggle on AI rows. The non-AI baseline has a location water figure only, with nothing for streaming or devices.
- Nothing models a phone, laptop, or TV.
- Per-model min/max ranges exist in the data but are never shown.

**Assumptions still to check:**
- Alex uses commercial video tools, not open models (no per-clip energy is published for commercial tools).
- Alex's water concern is about data-center water rather than device manufacturing.
- Streaming and social use across three devices is a meaningful share of Alex's footprint relative to AI use.

### Jordan (creative technologist)

> DRAFT — Jordan is researched for agentic coding and video calls. Gaming PC is not researched.

**Evidence (from the current calculator code, `app.js`):**
- "Agent session" is one fixed size (75,000 words; ~191 Wh on Claude Sonnet 4.6 per the data). It can't scale with session length, steps, or context size.
- Only "per day" and "per year" totals exist; no project or multi-day totals.
- The min/max ranges are in the data but never shown.
- Gaming and video calls are not modeled.
- The calculator's method (EcoLogits) sizes a request by *output* length. Source 12 suggests agent sessions are dominated by *input* tokens (re-read context). That is our inference and is not confirmed.

**Assumptions still to check:**
- Jordan's sessions look like the sessions in sources 12–13 (Claude Code, heavy context re-reading).
- Jordan's gaming and call habits are typical enough for population-average sources to apply.

### Robin (operations manager)

> DRAFT — Robin's research is in progress: uncertainty communication and social media checked; plain-language practice and employee trust not yet.

**Evidence (from the current calculator, `index.html` and `app.js`):**
- The calculator has a "How these numbers are made" panel and inline citations, but shows one point estimate per result, with the ranges hidden in the data.
- Units and terms are technical (g CO₂e, mL, "blue water," "EcoLogits"), with no plain-language glossary.
- No video meetings, streaming by device, or social media (Robin's main activities) are modeled.

**Assumptions still to check:**
- Robin's distrust of the company can be reduced by visible sources and honest ranges (source 20 supports ranges; nothing found yet on distrust of *company* motives specifically).
- Robin spends more time on social media and video than on AI, so the calculator's largest numbers for Robin would come from those activities.

## Possible features

Generate several possibilities before choosing. Keep the initial notes brief. For each idea, record:

- what it would help someone learn or do
- the profiles or needs it would serve
- any evidence or implementation challenge that might affect it

> DRAFT — candidates recorded as the research progressed; the five the user has chosen are listed under "Selected features."

- **Generated-media input: video with three reference tiers (range-based), plus images in draft / standard / high-quality tiers.** Learn: how much energy video and image generation may use and how uncertain that is. Serves: Alex (primary), Jordan (ranges). Challenge: no commercial tool is measured; water has no video- or image-specific figure and would need a separate water-per-kWh factor; GPU-only image figures need a system-overhead factor we have no source for. User chose three tiers (low/mid/high) over a parametric model, and chose to fold image generation into this feature. User chose to derive video water from the calculator's implied 3.6–4.1 L/kWh range (source 4 derived check), labeled as a derived estimate, not a measured video water figure; this depends on the unverified WRI off-site WUE inputs.
- **Video calls with a camera on/off toggle and a range.** Learn: how call length and camera use change footprint, and how far the estimates disagree. Serves: Jordan, Robin (and Alex if calls apply). Challenge: estimates differ up to ~50× (sources 16–18); no laptop-specific measurement; the 96% camera-off claim is unsupported. **User chose:** hours of calls with a camera toggle and a range anchored on Greenspector (measured) and Mytton (network floor); Obringer shown only as a disputed upper bound or omitted (to be settled in the specification).
- **Social media hours (Robin, Alex).** Learn: how scrolling compares with AI use and streaming. Challenge: the only measurements found are one consultancy's 2021 old-phone tests (source 21, unverified) with conflicting secondary figures.
- **Whole-result uncertainty range with plain-language explanation (Robin, Jordan, Alex).** Learn: how wide the plausible range of one's total footprint is, and which assumptions drive it. Combines the ranges from the other features into a low / central / high total and states in plain words what each depends on. Supported by source 20 (numeric ranges cost little trust). Challenge: adding independent ranges may overstate or understate the total spread; method to be chosen at the specification stage.
- **Device-based streaming hours.** Learn: how streaming on a TV vs laptop vs phone compares, and how it sits beside AI use. Serves: Alex, Robin, Jordan. Challenge: per-device figures are derived estimates (source 10).
- **Agent session sized by tokens and context, with a range (Jordan).** Learn: why "prompts per day" understates coding-agent use and how much the answer depends on assumptions. Serves: Jordan (primary). Challenge: the two available estimates differ ~15× per session; energy per token is inferred from prices; no lab data. **User chose: session-size tiers by default, plus an advanced token mode** (fresh-input, cache-read, output tokens, and a cache-read setting of 1% / 10% / 25%) using Bistline's Table 2 factors (source 14). Tier definitions are left to the specification stage.

## Source assessments

For each source, record:

- the full citation and working link
- the claim or figure the project may use
- evidence checked directly
- important limitations or uncertainty
- confidence and decision: use, use with qualifications, or reject

> DRAFT — sources are grouped by topic (video generation, water, agentic coding, streaming and devices, video calls, image generation, uncertainty communication) and numbered in the order they were researched. Decisions are tentative until the user reviews them. Many figures were extracted with a web-fetch tool; where the PDF itself was read, the entry says so.

### Video generation

**1. Delavande, Pierrard & Luccioni, "Video Killed the Energy Budget: Characterizing the Latency and Power Regimes of Open Text-to-Video Models," arXiv:2509.19222 (Sept 23, 2025). https://arxiv.org/abs/2509.19222** (HTML: https://arxiv.org/html/2509.19222v1)
- Claim/figures: Table 4 default-setting energy (GPU+CPU+RAM) per clip, Table 2 default settings, and scaling with resolution, length, and steps. Derived Wh per video-second (our arithmetic): LTX-Video ~0.73, CogVideoX-5B ~4.1, WAN2.1-14B ~77 (full table in the working notes below).
- Checked directly: abstract page (NeurIPS 2025 NextVid Workshop oral); Tables 2 and 4 and the limitations text, first via the HTML version and then **re-checked against the PDF text (`pdftotext`): all values match**. The user should still confirm them.
- Limitations: a single H100 SXM; open models only; no audio generation; excludes optimizations such as caching and quantization; the analytical model assumes uniform attention cost; the paper's scaling is quadratic in length, so per-second is only valid near the ~5 s defaults; no water figure.
- Confidence/decision: **use with qualifications** (workshop-level review; measured, not inferred).
- **Added during specification (2026-09-21), pending user review:** Table 4 (PDF, via `pdftotext`) reports GPU, CPU, and RAM energy separately. Total ÷ GPU (our arithmetic) = 1.148–1.209 across the seven models (1.15–1.17 for all but AnimateDiff). Setup: one H100 SXM with an 8-core AMD EPYC CPU; GPU and CPU measured with CodeCarbon (NVML, pyRAPL); **RAM estimated with CodeCarbon's default heuristic, not measured**. The paper states GPU is 80–90% of total. Proposed use: a proxy for the CPU and RAM energy missing from GPU-only image figures (source 24). This ratio is for video pipelines, not image models.

**2. Jegham & Luccioni, "Lights, Camera, Carbon: Unveiling the Energy Footprint of AI Video Generation" (July 22, 2026). https://sustainableaigroup.com/lightscameracarbon**
- Claim/figures: open models 57.5–114.8 Wh per 5 s clip; Sora 2 Pro 1,313 Wh per 12 s 1080p clip.
- Checked directly: page content via fetch (authors, date, figures). Method and hardware not stated on the page.
- Limitations: "currently undergoing peer review"; closed-model figures are reverse-engineered from API tests and statistical simulation, so they are inferred rather than measured; no limitations section found.
- Confidence/decision: open-model figures **use with qualifications** (context only); closed-model figures **do not present as measurements**.

**3. MIT Technology Review, "We did the math on AI's energy footprint" (May 20, 2025). https://www.technologyreview.com/2025/05/20/1116327/ai-energy-usage-climate-footprint-big-tech/**
- Claim/figures: a newer CogVideoX measured by Luccioni with CodeCarbon used ~3.4 MJ (~944 Wh) for a 5 s clip at 16 fps, over 700× a high-quality image; AI-company claims that video beats film shoots are hard to test.
- Checked directly: passage via fetch.
- Limitations: journalism, not the primary measurement. It is about 37× the CogVideoX-5B figure in source 1; version and settings differences are likely but unconfirmed.
- Confidence/decision: **use with qualifications**; do not mix with source 1 values until the discrepancy is explained.

**Rejected until traced to a primary source:** the "50 Wh / 18 g CO₂ per 6–10 s clip" and "30–950 Wh per 5 s clip" figures from search-result snippets.

**Working notes: Delavande Table 2/4 (Wh = GPU+CPU+RAM; Wh/s = Wh ÷ (frames ÷ fps), our arithmetic)**

| Model | Frames ÷ fps | Total Wh | Wh per video-second |
|---|---|---|---|
| WAN2.1-14B (720×1280, 50 steps) | 81 ÷ 15 = 5.4 s | 415.1 | ~77 |
| Mochi-1 (480×848, 64 steps) | 84 ÷ 30 = 2.8 s | 52.1 | ~19 |
| WAN2.1-1.3B (720×1280, 50 steps) | 5.4 s | 90.5 | ~17 |
| CogVideoX-5B (480×720, 50 steps) | 49 ÷ 8 = 6.1 s | 25.3 | ~4.1 |
| CogVideoX-2B (480×720, 50 steps) | 6.1 s | 9.7 | ~1.6 |
| LTX-Video (512×704, 40 steps) | 121 ÷ 24 = 5.0 s | 3.7 | ~0.73 |
| AnimateDiff (512×512, 4 steps) | 16 ÷ 10 = 1.6 s | 0.14 | ~0.09 |

**Caution on the proposed tiers:** the low, mid, and high values (LTX ≈ 0.73, CogVideoX-5B ≈ 4.1, WAN2.1-14B ≈ 77 Wh per video-second) differ in **model size, resolution, and frame rate at once** (512×704, 480×720, and 720×1280 respectively), so a "tier" is really a model-and-resolution class, not a quality setting an editor chooses. None matches 1080p or 4K professional output. How to describe the tiers to users is a specification-stage question.

### Water (data centers)

> DRAFT — tentative decisions, pending user review. The LBNL report could not be read directly (see below).

**4. EcoLogits methodology, "LLM Inference." https://ecologits.ai/latest/methodology/llm_inference/**
- Claim/figures: water per request = server energy × [on-site WUE + PUE × off-site WUE]. On-site WUE comes from provider disclosures (page lists e.g. OpenAI/Azure PUE 1.20 and WUE 0.569; Google 1.09 and 0.99; Mistral 1.16 and 0.09; Anthropic 1.09–1.14 and 0.13–0.99). Off-site WUE comes from World Resources Institute country data, with a world default. Embodied water is not modeled.
- Checked directly: the methodology page, via fetch. I did not check the underlying provider disclosures or the WRI dataset.
- Limitations: on-site values rest on provider self-reports; off-site uses a national or world average, not the actual data-center grid; embodied water excluded.
- Confidence/decision: **use with qualifications.** This is the basis of the calculator's existing water figures (see the derived check below).

**Derived check (our calculation from `app.js` model data): the calculator's existing water figures imply 3.6–4.1 L per kWh of server energy** (GPT ~3.61, Claude ~3.71–3.81, Gemini ~4.05; each model's ratio is nearly constant across task sizes). That is consistent with the EcoLogits formula only if off-site WUE is roughly 2.5–2.8 L/kWh; I have not verified that against the WRI data. So most of the calculator's water is *off-site* (power-plant) water, not cooling water. This matters for Alex: a "data-center water" figure quoted from company reports would be much lower.
- Implication for video: converting video energy to water with this same ~3.6–4.1 L/kWh range keeps it consistent with the text figures. This is a proposed method, not a sourced video water measurement.

**5. Li, Yang, Islam & Ren, "Making AI Less 'Thirsty': Uncovering and Addressing the Secret Water Footprint of AI Models," arXiv:2304.03271; Communications of the ACM 2025. https://arxiv.org/abs/2304.03271**
- Claim/figures: the scope-1 (on-site) vs scope-2 (off-site) water framework; GPT-3 training ≈ 5.4 million L total including 700,000 L on-site; scope-1 and scope-2 efficiencies vary by place and time.
- Checked directly: only search-result summaries. **Not yet verified from the paper.**
- Limitations: GPT-3 is old and about training, which the calculator excludes; only the framework, not the numbers, is relevant.
- Confidence/decision: **use with qualifications**, for the framework only, after direct verification.

**6. Shehabi et al., 2024 United States Data Center Energy Usage Report, Lawrence Berkeley National Laboratory (Dec 2024). https://eta.lbl.gov/publications/2024-lbnl-data-center-energy-usage-report**
- Claim/figures (from search summaries only): US data centers in 2023 consumed ~17 billion gal (64 billion L) directly for cooling and ~211 billion gal (800 billion L) indirectly through electricity, about 12×.
- Checked directly: **not verified.** The LBNL page returned HTTP 403, and the redirected eScholarship page returned empty content. Author names and dates above are from memory and were not verified.
- Limitations: unknown until read.
- Confidence/decision: **do not use until verified.** The user can open the report directly to confirm the figures.

### Agentic coding

> DRAFT — tentative decisions, pending user review. Figures were extracted with a fetch tool and must be re-checked against the pages by the user.

**12. Couch, S. P., "Electricity use of AI coding agents" (Jan 20, 2026). https://simonpcouch.com/blog/2026-01-20-cc-impact/**
- Claim/figures: median Claude Code session ≈ **41 Wh** (592k tokens, 24 calls, per Hausfather's summary of it); 8,825 deduplicated API requests from the author's own sessions, Dec 2025–Jan 2026. Per-token rates (as reported by the fetch tool) about 390 Wh/MTok fresh input, 1,950 output, 490 cache creation, 39 cache reads; back-calculated from an Epoch AI ChatGPT estimate and Anthropic's price ratios.
- Checked directly: page via fetch. I did not check the Epoch AI figure it builds on.
- Limitations (author's own): "napkin math based on estimates from other researchers because the frontier labs don't release comprehensive data"; energy ratios inferred from *prices*, not infrastructure measurements; one person's usage.
- Confidence/decision: **use with qualifications**, as the low end of a range. Blog, not peer-reviewed.

**13. Hausfather, Z., "The real energy use of agentic AI," The Climate Brink (Aug 5, 2026). https://www.theclimatebrink.com/p/the-real-energy-use-of-agentic-ai**
- Claim/figures: from 8 weeks of his own Claude Code use (3.2 billion tokens, ~14,000 model calls from 1,138 typed prompts; 96% of tokens were cache reads): ~150 Wh per prompt (60–290), median session ≈ **600 Wh** (100+ calls, ~10 million tokens), daily average 3.0 kWh (1.2–5.9), ~600× a simple chat prompt (250–1,200×). Chat baselines cited: 0.24 Wh (Google Gemini) and ~0.34 Wh (Altman).
- Checked directly: page via fetch. He does not disclose per-token coefficients, and the three underlying methods (Watershed/Bistline et al. 2026, Couch 2026, the "claude-carbon" tool) were not read.
- Key assumption: cache reads cost ~10% of fresh-input energy, with 1% and 25% as bounds, taken from *pricing ratios*. With 96% of tokens being cache reads, this one assumption drives the result. Assumes a US-average grid (341 g CO₂e/kWh, eGRID 2024). His three methods gave 70–330 kWh for the 8 weeks.
- Limitations: one person's usage; energy inferred from prices, not measured; blog, not peer-reviewed. He is a climate scientist, not an AI hardware measurer.
- Confidence/decision: **use with qualifications**, as the high end of a range.
- **Added during specification (2026-09-21), pending user review (page via fetch):** median session "around 0.6 kWh (0.25 to 1.2 kWh)"; token mix over 8 weeks is 96% cache reads and "0.4% of total tokens" output, the remainder (~3.6%) cache writes. Couch (source 12) gives **no token-type split** for his 592,439-token median session. The specification applies Hausfather's mix to both agent-session tiers; for Couch's session size this is an assumption.

**Why the two disagree (our reading of 12 and 13):** Couch's "session" is ~592k tokens and 24 calls; Hausfather's is ~10M tokens and 100+ calls, about 17× the tokens, and their median energies differ ~15× (41 vs 600 Wh). So most of the gap is *how big a session is*, not disagreement about energy per token. The remaining uncertainty is the cache-read energy assumption (1–25% of fresh input). Neither author has lab data.

**14. Bistline et al. (Watershed), "AI Emissions Framework" white paper (July 22, 2026; per Heatmap). Blog: https://watershed.com/en-GB/blog/ai-emissions-framework; PDF: https://cdn.sanity.io/files/3ogo9b9g/production/a5c1f64ca5864e61b47e6384ee4d0ed31bc861f4.pdf**
- Claim/figures: a three-tier accounting method (spend-based 0.134 kg CO₂e per US dollar; per-token kWh per thousand tokens; a detailed formula). The blog reports "reasoning models can use roughly 30 times more energy than smaller variants," "modeled benchmarks can overstate real-world electricity use by 4 to 20 times," and per-region US grid intensity varying more than fivefold. Search summaries attribute "50–500 Wh for an agentic workflow of 5–50 frontier calls" to it.
- Checked directly: the blog page and Heatmap coverage via fetch, then **the white paper PDF itself via `pdftotext`** (Table 2 and footnotes 47–54, pp. 23–24). Version: "AI Emissions Framework – White Paper Final"; Table 2 defaults are "presented here for feedback. Final defaults will be published … in the next version."
- **Table 2 activity-tier defaults (proposed, not final):** input-token energy 0.32 Wh per 1,000 tokens (hyperscaler) or 0.70 (unknown provider); output-token energy 0.96 or 2.1 Wh per 1,000 tokens (3:1 decode-to-prefill ratio, from Patel et al. 2024); PUE 1.10 or 1.56; US grid 341 g CO₂e/kWh (eGRID 2024). The hyperscaler input figure is derived from Google's disclosed median Gemini text prompt of 0.24 Wh (Elsworth et al. 2025), an assumed ~500-token prompt, and the 3:1 ratio.
- **Key caveats in the paper itself:** footnote 48: constant per-token factors "will tend to undercount long-context and agentic workloads," because prefill cost grows super-linearly with input length and decode energy per token rises with context length. Footnote 54: cache-hit tokens use less energy, so for "repeat-context workloads (e.g., agentic loops), … a blended factor would overstate electricity consumption." So the paper flags error in both directions for agentic use. Footnote 48 also notes mixture-of-experts models may be overstated by dense-model factors. The paper says benchmarked figures can overstate real-world use through batch size assumptions.
- Limitations: a corporate accounting framework, not personal use; a white paper, not peer-reviewed; defaults are proposals; spend-based estimates "can misestimate true AI emissions by several times in either direction." Its own case-study range is 3.7–5.4 tCO₂e (Activity Tier) for one illustrative company.
- Confidence/decision: **use with qualifications.** It is the best-grounded per-token anchor found, because it is tied to a real provider disclosure (Google) and states its own limits. Only the fresh-input and output factors are relevant; it gives no separate cache-read factor.

**Cross-check of per-token factors for fresh input (our comparison):** Bistline 320 Wh per million tokens (hyperscaler; 700 unknown provider), claude-carbon ~278 (Sonnet), Couch ~390. These agree within about 1.4×, and Bistline's is anchored to Google's measurement rather than to Anthropic's prices. That is modest evidence for the fresh-input factor. It does **not** validate the cache-read multiplier (0.1× from prices only).

**Sensitivity of a heavy session to the cache-read assumption (our arithmetic, using Bistline's 0.32 Wh per 1,000 fresh-input tokens, before PUE, ignoring output tokens):** for a 10M-token session that is 96% cache reads (Hausfather's shape), the cache-read part is 9.6M × 320 Wh/MTok × {1%, 10%, 25%} = 31, 307, 768 Wh, and the 0.4M fresh tokens add 128 Wh. Totals: about **159, 435, 896 Wh** (5.6× spread from that one assumption), against Hausfather's 600 Wh and Couch's 41 Wh (different session size).

**15. metztim, "claude-carbon" METHODOLOGY.md. https://github.com/metztim/claude-carbon/blob/main/METHODOLOGY.md**
- Claim/figures: 1.0 J/token for Claude Sonnet (medium confidence), 0.3 for Haiku and 2.0 for Opus (low confidence, inferred from price ratios); cache read at 0.1× and cache creation at 1.25×. 1.0 J/token ≈ 278 Wh per million tokens.
- Checked directly: page via fetch.
- Limitations (its own): pricing ratios, "not direct energy measurements"; absolute values "low confidence (could be 2× too high or 2× too low)"; "educational approximations."
- Confidence/decision: **use with qualifications**, but note it is **not an independent check** on Couch and Hausfather, because all three derive energy from Anthropic's prices.

**Independence finding:** Couch, Hausfather, and claude-carbon all infer per-token energy from Anthropic's price ratios (cache reads at ~10%). They agree with each other partly because they share that assumption. No source found measures agentic-session energy directly.

**To check before use:** the Epoch AI figure (https://epoch.ai/gradient-updates/how-much-energy-does-chatgpt-use) that Couch back-calculates from; Elsworth et al. 2025 (arXiv:2508.15734), the Google disclosure underlying Bistline's factor.

**Rejected as sources:** the futurism.com, remio.ai, and letsdatascience.com summaries (secondary write-ups of 12–13), and the GitHub gist, unless traced.

### Streaming and devices

> DRAFT — tentative decisions, pending user review. Serves Alex and Robin. Figures were extracted with a fetch tool and should be re-checked against the pages by the user.

**7. Kamiya, G., "The carbon footprint of streaming video: fact-checking the headlines," IEA (Dec 10, 2020; updated Dec 11, 2020). https://www.iea.org/commentaries/the-carbon-footprint-of-streaming-video-fact-checking-the-headlines**
- Claim/figures: central estimate **36 g CO₂ per hour** (2019, global average grid) from about 0.08 kWh per hour. Energy split: devices 72%, networks 23%, data centres 5%. Assumed bitrate about 1.8–1.9 GB/h. In France (low-carbon grid) about 2 g. Says actual use depends on device, connection, and resolution.
- Checked directly: page via fetch.
- Limitations: 2019 data; a single global-average grid and device mix; the mix used is 70% TV / 15% laptop / 10% tablet / 5% smartphone, so a user on a phone would differ a lot.
- Confidence/decision: **use with qualifications** for the shares and the per-hour total. Not a per-device figure.

**8. Carbon Brief, "Factcheck: What is the carbon footprint of streaming video on Netflix?" (Feb 25, 2020; updated Nov 25, 2020). https://www.carbonbrief.org/factcheck-what-is-the-carbon-footprint-of-streaming-video-on-netflix**
- Claim/figures: 0.077 kWh and 36 g CO₂ per hour, in agreement with the IEA. A 50-inch LED TV uses about 100× a smartphone and about 5× a laptop. Netflix bitrates: 0.25 GB/h mobile, 0.7 SD, 3 HD, 7 UHD. Excludes set-top boxes and consoles.
- Checked directly: page via fetch. The page has no consolidated per-device kWh table; those numbers are in charts I could not read.
- Limitations: same 2019 basis as the IEA; press fact-check, not a primary study.
- Confidence/decision: **use with qualifications** for the device ratios and bitrates only.

**9. The Carbon Trust, "Carbon impact of video streaming" white paper (June 2021; funded by Netflix, in consultation with DIMPACT). https://www.carbontrust.com/our-work-and-impact/guides-reports-and-tools/carbon-impact-of-video-streaming**
- Claim/figures: about **55 g CO₂e per hour in Europe**; the viewing device is the largest share; search summaries say a 50-inch TV uses about 4.5× a laptop and 90× a smartphone.
- Checked directly: landing page only (the 55 g figure and the Netflix funding). The device figures come from search summaries and the PDF was not read.
- Limitations: **Netflix-funded**, which matters for Robin's skepticism; European scope; grid assumptions not seen.
- Confidence/decision: **use with qualifications** as a second estimate showing the range; do not cite device ratios until the PDF is read.

**10. Per-device power: derived, not sourced (proposed method, awaiting user approval).** User chose device-based streaming hours (TV, laptop, phone, plus tablet).
- Method (our arithmetic from sources 7 and 8): the IEA's device energy = 72% × 0.077 kWh ≈ 55.4 Wh per streaming hour, over a mix of 70% TV / 15% laptop / 10% tablet / 5% smartphone. Carbon Brief's ratios: TV ≈ 5× laptop ≈ 100× smartphone. **Assumption of ours (no source): tablet ≈ 5× smartphone.** Solving: smartphone ≈ 0.75 W, tablet ≈ 3.8 W, laptop ≈ 15 W, TV ≈ 75 W. Network plus data centre adds about 21.6 Wh per streaming hour whatever the device (28% × 0.077 kWh).
- Cross-check: search results gave 55-inch TVs averaging ~77 W on (blog aggregators) and one ENERGY STAR certified 55-inch LED model listing 93.2 W average on-mode power (ENERGY STAR product finder, one model only). This is consistent with ~75 W but weak, since the sources are blogs and one model.
- **Conflict, partly resolved:** blog-level sources put laptop streaming at 35–50 W, against the derived ~15 W. A measured source (11, below) supports the lower figure for browsing (9–13 W measured; 15–22 W assumed by reporting models), so the blog figures are rejected. Laptop remains the least certain value, and the range shown to the user should reflect that.
- **Final search attempt (user-requested), result:** no primary measurement for TV, smartphone, or tablet. The ENERGY STAR Version 9 memo contained no readable average power figures, and the Ofcom and LBNL pages were unreadable earlier. The user directed that derived estimates proceed if this failed. **Decision: proceed with derived estimates, labeled as derived, with ranges.**
- Limitations of the derivation: rests on 2019 mix and ratios; average device sizes have probably changed; mixes the IEA's weighted shares with Carbon Brief's press ratios; tablet is assumed; smartphone on cellular data would use more network energy than assumed.
- Confidence/decision: **low to moderate; use only if labeled "derived estimate" with ranges.** The user directed that this method proceed (see above); it is still part of the draft for the user's review.
- Rejected as sources: blog sites (ecocostsavings, jackery, solartechonline, iTechGuides and similar), unless traced to a primary measurement.

**11. Kirkeby & Lagermann, "Power Assumptions Matter: Evaluating End-user Laptop Energy Models for Sustainability Reporting of Browser-Based Web Services," arXiv:2510.12566 (submitted Oct 14, 2025; revised Jan 13, 2026). https://arxiv.org/abs/2510.12566**
- Claim/figures: measured laptop power of 9–13 W during representative browsing; reporting models (Digst, DIMPACT) assume fixed 15–22 W.
- Checked directly: abstract page via fetch. Full paper not read.
- Limitations: preprint, not peer reviewed; measures browsing, not video streaming (video playback likely draws more); a small set of laptops.
- Confidence/decision: **use with qualifications**, to bound the laptop range (about 9–22 W) and to reject the 35–50 W blog figures.

**Not found / failed:** per-device watt or kWh-per-hour figures from a primary source. The Ofcom 2022 report on streaming and digital terrestrial TV returned HTTP 403, and the Carbon Trust page has no device numbers. Malmodin et al. 2024 (*Telecommunications Policy*, 2020 outcome) appeared in search only, with no per-device power figures.

**Water for streaming:** no source found. The calculator's implied 3.6–4.1 L/kWh applies to server energy, including on-site cooling. Streaming is mostly device energy (72%) plus network energy, so it would need an off-site-only factor (the implied off-site WUE is roughly 2.5–2.8 L/kWh, unverified against WRI). Not yet decided.

### Video calls

> DRAFT — tentative decisions, pending user review. Serves Jordan and Robin. Figures were extracted with a fetch tool and must be re-checked by the user.

**16. Obringer, Rachunok, Maia-Silva, Arbabzadeh, Nateghi & Madani, "The overlooked environmental footprint of increasing Internet use," *Resources, Conservation and Recycling* 167, 105389 (April 2021). https://doi.org/10.1016/j.resconrec.2020.105389** (press release: https://www.purdue.edu/newsroom/archive/releases/2021/Q1/turn-off-that-camera-during-virtual-meetings,-environmental-study-says.html)
- Claim/figures (Purdue release): "one hour of videoconferencing or streaming … emits **150–1,000 grams** of carbon dioxide … requires **2–12 liters of water** and … land … about the size of an iPad Mini"; "leaving your camera off … can reduce these footprints by **96%**."
- Checked directly: the release (quotes above) and the Penn State record (confirms authors, journal, date, "peer-reviewed short survey"). **The paper itself and its abstract were not read** (ScienceDirect and ADS pages were unreadable), so I could not check how the 96% or the per-GB intensities were derived; the release does not say.
- Limitations: "rough … only as good as the data made available by service providers and third parties," built on per-GB intensities and modeled platform data. The range also covers *streaming*, where it is 4–28× the IEA's 36 g per hour (source 7), so the two sources cannot both be central estimates. A 2024 paper by Guennebaud in the *Journal of Industrial Ecology* argues that Wh-per-GB intensity figures overstate the energy of data transfer (seen only in search results; the page returned 403, so **not verified**).
- Confidence/decision: **do not use as a central estimate.** May be shown as an upper bound with the caveats, after the paper is read.

**17. Greenspector, "The impact of our videoconferencing uses on mobile and PC! 2022 edition." https://blog.greenspector.com/en/videoconferencing-apps-2022/**
- Claim/figures (per minute, mobile, WiFi): audio 0.31 gCO₂e; audio + camera 1.10 gCO₂e; screen sharing 0.54; data exchanged 0.88, 10.34, and 4.49 MB respectively; Teams 0.513 gCO₂e (mobile average across scenarios). Impact split: device 61%, server 23%, network 16%. Our arithmetic: audio ≈ **19 g per hour**, audio + camera ≈ **66 g per hour**, and camera-on carbon about 3.5× audio-only (a 72% cut from turning the camera off, on this phone).
- Checked directly: the blog page via fetch.
- Limitations: measured on a **Samsung S7 (Android 8)**, an old phone, over WiFi for mobile and wired for PC; 1-minute scenarios; five runs averaged; default settings; the grid factor is not stated on the page; the page's PC section reports energy in mAh with no carbon figures, and lists limitations that are partly inconsistent with its results. Greenspector is a commercial consultancy.
- Confidence/decision: **use with qualifications** as a measured (if dated and narrow) anchor for a per-hour range; do not present as a general figure for laptops.

**18. Mytton, D., "Zoom, video conferencing, energy, and emissions" (Nov 16, 2020; updated Jan 2, 2025). https://davidmytton.blog/zoom-video-conferencing-energy-and-emissions/**
- Claim/figures: a 1:1 HD 1080p meeting of one hour ≈ 3.24 GB of bandwidth ≈ 0.0486 kWh ≈ **0.012 kg CO₂** on a UK grid, using 0.015 kWh/GB fixed-line and 0.1 kWh/GB mobile network intensity (from Aslan et al. 2018). He states that device and other non-network emissions are uncertain and that "you can't use energy intensity figures to make assessments of the present or make projections for the future" (2023 note).
- Checked directly: page via fetch. The Aslan et al. figures were not checked.
- Limitations: single-author blog; **network transmission only** (excludes devices and servers); UK grid; intensity-based, which the author himself now discourages. Does not mention the Purdue study.
- Confidence/decision: **use with qualifications**, as the lower bound for the network part only.

**19. Mortas, F., "Assessing the Carbon Footprint of Virtual Meetings: A Quantitative Analysis of Camera Usage," arXiv:2601.06045 (submitted Dec 16, 2025; revised Jan 18, 2026). https://arxiv.org/abs/2601.06045**
- Claim/figures: measured over a 4G phone connection, turning the camera off "can halve data consumption and associated carbon emissions, particularly on mobile networks." Accepted as a short paper at IARIA GREEN 2025 with revisions required.
- Checked directly: abstract page via fetch. No numeric values were extractable.
- Limitations: a short paper, revisions pending; one author; mobile network only; data and network emissions only.
- Confidence/decision: **use with qualifications**, for the direction and rough size (about half) of the network-data effect only.

**26. Chang, Varvello, Hao & Mukherjee (Nokia Bell Labs), "Can You See Me Now? A Measurement Study of Zoom, Webex, and Meet," arXiv:2109.13113 (Sept 27, 2021; ACM IMC 2021). https://arxiv.org/abs/2109.13113** *(Added during specification, 2026-09-21; pending user review.)*
- Claim/figures: on a low-end Samsung Galaxy J3 measured with a Monsoon power meter, a one-hour call with the camera on drains "up to 40%" of its 2,600 mAh battery; audio only with the screen off drains "about 20–30%." Data use from 175 MB per hour (Zoom gallery view) to about 1 GB per hour (Meet). Our conversion, assuming a 3.85 V nominal battery voltage (not stated in the paper): about **4.0 W camera on** and **2.0–3.0 W audio only, screen off**.
- Checked directly: the PDF text via `pdftotext` (abstract findings, device setup, battery-usage passage).
- Limitations: one low-end phone; 2021 app versions (April–May 2021); "up to" wording, so 4.0 W is nearer a high value than a typical one; the voltage is our assumption; the phones only received streams from emulated senders.
- Confidence/decision: **use with qualifications**, for phone device power during calls.

**Checked during specification and not usable for laptop call power:** Herglotz et al., "Extended Signaling Methods for Reduced Video Decoder Power Consumption Using Green Metadata," arXiv:2310.17346 (2023), measured a laptop in a WebRTC call but reports only relative savings (up to about 20% from frame-rate reduction), no absolute watts. WattSeal's video-call benchmark (~31 W on a gaming laptop) is a vendor blog and is **rejected**. No absolute laptop call measurement was found.

**What the video-call sources show (our comparison):**
- **Per hour of a call, total (device + network + server):** Greenspector mobile 19–66 g; Mytton network only 12 g; Obringer 150–1,000 g. The measured and modeled estimates differ by up to ~50×. Sources 16 and 7 are also mutually inconsistent for streaming.
- **Camera-off effect:** ~50% of data (Mortas), ~72% of carbon (Greenspector, phone), 96% (Obringer, basis unstated). The 96% figure is the least supported.
- **Water:** the only figure is Obringer's 2–12 L per hour, which shares the per-GB basis and is not usable as a central value. A derived water figure would need an off-site electricity water factor (the calculator's implied ~2.5–2.8 L/kWh, unverified), as with streaming.
- **No source found** for laptop or desktop energy during a video call, which is what Jordan and Robin would use; Greenspector's PC figures are energy only, in mAh, and unclear.

### Image generation

> DRAFT — tentative decisions, pending user review. Serves Alex. Not one of the proposed five features; recorded because the user asked for it to be researched.

**23. Luccioni, Jernite & Strubell, "Power Hungry Processing: Watts Driving the Cost of AI Deployment?" *ACM FAccT '24* (arXiv:2311.16863; submitted Nov 28, 2023, latest version Oct 15, 2024). https://arxiv.org/abs/2311.16863**
- Claim/figures (Table 2, read in the PDF): image generation averaged **2.907 kWh per 1,000 inferences (2.9 Wh per image), std 3.31**, the highest of ten tasks; the least efficient image model used **11.49 kWh per 1,000** (about half a phone charge per image, at 0.022 kWh per charge). Text generation averaged 0.047 kWh per 1,000, so image generation used over 60× more per query.
- **Correction to an earlier search summary:** it said the least efficient model used "522 phone charges for a single image." The paper says 522 charges per **1,000** images (11.49 kWh ÷ 0.022 kWh). Use the paper's wording.
- Checked directly: abstract page and the PDF text (Table 2, method, footnotes). Peer-reviewed conference paper.
- Limitations: **8 × NVIDIA A100-SXM4-80GB node on AWS us-west-2** (297.6 g CO₂e/kWh); inferences run **sequentially, without batching**; footnote 3 says only one GPU was used but **the idle power of the other GPUs is included in the reported numbers**; 2023 open models on 2023-era practice; mean across many models with a std larger than the mean. This likely overstates energy relative to batched production serving (our inference, not the paper's claim).
- Confidence/decision: **use with qualifications**, as an upper bound, not a central estimate.

**24. Iyengar, Han, Ruf, Grari, Detyniecki & Ermon, "Energy Scaling Laws for Diffusion Models: Quantifying Compute in Image Generation," *FAccT '26* (arXiv:2511.17031v2, May 12, 2026). https://arxiv.org/abs/2511.17031**
- Claim/figures (PDF): four models (Stable Diffusion 2, SD 3.5, Flux, Qwen) on NVIDIA A100, A4000, A6000. For Qwen on an A100: **0.051 Wh** per image at the minimum setting (10 steps, 256², fp16, no guidance) up to **3.58 Wh** for high quality (50 steps, 1024², fp16, guidance), three orders of magnitude. Denoising is over 90% of compute even at 10 steps; energy scales roughly quadratically with resolution and linearly with steps (R² > 0.9 within a model–GPU pair).
- Checked directly: the PDF text (abstract, results, limitations). Accepted to FAccT 2026.
- Limitations (paper's own): **GPU dynamic energy only** (excludes CPU, RAM, cooling, networking); four models and three GPU types; not a production serving stack; CodeCarbon assumptions; complete sweeps only on A100. The 0.051 Wh minimum is a 256² preview setting no editor would likely use.
- Confidence/decision: **use with qualifications**, for the scaling behavior and a realistic range at typical settings.
- **Added during specification (2026-09-21), pending user review:** Appendix Tables 6–9 (PDF, via `pdftotext`) give A100 GPU energy in joules **per 100 prompts** (confirmed: Qwen 256², 10 steps = 1.83 × 10⁴ J → 0.051 Wh per image, matching the paper's text). Values used for the image tiers (fp16 with guidance; Wh per image = J ÷ 100 ÷ 3,600):

  | Setting | SD2 | SD3.5 | Qwen | Flux |
  |---|---|---|---|---|
  | 512², 20 steps | 0.040 | 0.247 | 0.433 | 0.569 |
  | 1024², 30 steps | 0.222 | 1.267 | 2.228 | 2.553 |
  | 1024², 50 steps | 0.364 | 2.092 | 3.583 | 4.278 |

  The mapping of these settings to "draft / standard / high quality" is the user's choice, not the paper's. SD2 was excluded from the tiers by the user as less representative of current large models.

**25. MIT Technology Review, "We did the math on AI's energy footprint" (May 20, 2025), image section. https://www.technologyreview.com/2025/05/20/1116327/ai-energy-usage-climate-footprint-big-tech/**
- Claim/figures: Stable Diffusion 3 Medium (2 billion parameters), 1024 × 1024, standard quality: about **1,141 J (≈ 0.32 Wh)** of GPU energy, measured by Jae-Won Chung of the University of Michigan's ML.Energy group; "doubling the number [of] diffusion steps to 50 just about doubles the energy required, to about 4,402 joules (≈ 1.2 Wh)."
- Checked directly: the passage, via fetch.
- **Internal inconsistency:** 1,141 J → 4,402 J is a **3.9× increase, not a doubling** as the article says. Unresolved (the number of default steps is not given). Do not cite the "doubles" statement.
- Limitations: journalism; GPU energy only; one model.
- Confidence/decision: **use with qualifications** for the ~0.3 Wh figure only; trace to the ML.Energy measurement before citing.

**What the image sources show (our comparison):**
- Central-to-high measured range for one image: **about 0.3 Wh (efficient open model, 1024², default steps) to about 3–3.6 Wh (high quality)**; the 2023 mean of 2.9 Wh and worst case of 11.5 Wh look like upper bounds, likely inflated by unbatched serving and idle GPUs.
- Image generation costs roughly 1–10 times a chat message (0.3–3.6 Wh against the 0.24–0.34 Wh chat baselines cited in source 13) and roughly 1/25 to 1/80 of a short video clip (0.3–3.6 Wh against about 25–90 Wh for the CogVideoX-5B and WAN2.1-1.3B clips at default settings; our comparison from sources 1 and 24).
- **No commercial image tool is measured.** As with video, Alex's actual tools are unmeasured. GPU-only figures understate whole-system energy (source 24 says so), so the calculator would need a system overhead factor, which we don't have a source for.
- Water: no image-specific figure. As with video, it could only be derived from energy at the calculator's implied 3.6–4.1 L/kWh.
- Steps and resolution matter far more than the model name, which supports tiers ("draft," "standard," "high quality") over a per-model list.

### Uncertainty communication and trust (Robin)

> DRAFT — tentative decisions, pending user review.

**20. van der Bles, van der Linden, Freeman & Spiegelhalter, "The effects of communicating uncertainty on public trust in facts and numbers," *PNAS* 117(14), 7672–7683 (2020). https://www.pnas.org/doi/10.1073/pnas.1913678117**
- Claim/figures: five experiments (total n = 5,780), including a preregistered national-sample replication and a field experiment on the BBC News website, on topics such as global warming and immigration. People perceived more uncertainty when it was communicated, but the authors "observed only a small decrease in trust in numbers and trustworthiness of the source, and mostly for verbal uncertainty communication." Their conclusion: communicators "can be more open and transparent about the limits of human knowledge."
- Checked directly: the abstract, via Europe PMC's API (PubMed and PNAS blocked the fetch tool). Full text not read. An earlier search summary said numeric ranges did not reduce trust in the source at all; **the abstract is more careful** (a small decrease, mostly for verbal hedges), so use the abstract's wording.
- Limitations: UK participants and news-style texts; tested on general facts, not calculators; effects measured on a single exposure; a search summary said very large intervals may be an exception (not verified).
- Confidence/decision: **use with qualifications**, to support showing numeric ranges with a plain explanation, rather than only verbal hedges such as "roughly."

**21. Greenspector, social media footprint, 2021 edition. https://blog.greenspector.com/en/social-media-2021/**
- Claim/figures (search summaries only): news-feed scrolling measured for 1 minute on a Samsung S7 (Android 8). Per minute, in gCO₂e: TikTok 2.63, Reddit 2.48, Pinterest 1.30, Snapchat 0.87, Facebook 0.79, LinkedIn 0.71, Twitter 0.60, Twitch 0.55, YouTube 0.46; an average of 1.15 g/min, or about 69 g per hour (our arithmetic), and "60 kg CO₂e per year" for an individual's social media use.
- Checked directly: **not verified.** The Greenspector page returned 404, and figures come from search-result summaries only. Same old-phone, one-minute method as source 17.
- Limitations: a 2016 phone, one minute per app, scrolling only; the grid factor and the split between device, network, and server not confirmed. Other summaries give higher figures (e.g., 2.92 g per minute for TikTok from a Greenly calculator, a secondary source), so the figures conflict.
- Confidence/decision: **do not use until the page is read;** it would be used with qualifications, like source 17.

**22. Baumgartner et al., "Speaking About Artificial Intelligence for Sustainability—How Employees' Perception of Credibility Shapes Their Initial Attitudes Toward AI Adoption," *Corporate Social Responsibility and Environmental Management* (Wiley). https://onlinelibrary.wiley.com/doi/full/10.1002/csr.70627**
- Claim/figures (search summary only): a study of 426 German employees found that ecological and social reasons for AI adoption were perceived as less credible.
- Checked directly: **not verified.** The page returned 403, and Europe PMC has no record.
- Confidence/decision: **reject until verified.** It would support the assumption about employee skepticism toward company sustainability messaging.

### Glossary definitions

> **Added during implementation (step 6, 2026-09-21), pending user review.** The user chose to find and verify sources for the two glossary terms that had none in this file.

**27. IPCC, 2021: Annex VII: Glossary [Matthews, J.B.R., et al. (eds.)]. In *Climate Change 2021: The Physical Science Basis*, Working Group I contribution to the Sixth Assessment Report, pp. 2215–2256. doi:10.1017/9781009157896.022. https://www.ipcc.ch/report/ar6/wg1/downloads/report/IPCC_AR6_WGI_AnnexVII.pdf**
- Claim/figures: "CO2 equivalent (CO2-eq) emission": "The amount of carbon dioxide (CO2) emission that would have an equivalent effect on a specified key measure of climate change, over a specified time horizon, as an emitted amount of another greenhouse gas (GHG) or a mixture of other GHGs." It adds that CO₂-equivalent emissions "should not be taken to imply that these emissions have an equivalent effect across all key measures of climate change."
- Checked directly: the PDF, downloaded and read via `pdftotext` (the fetch tool got HTTP 403). The citation line above is the annex's own "should be cited as" text.
- Limitations: none for a definition. EPA pages checked (Understanding Global Warming Potentials; Greenhouse Gas Equivalencies Calculator references) use CO₂e but give no standalone definition, so they were not used.
- Confidence/decision: **use** for the glossary definition of g CO₂e.

**28. Water Footprint Network, "Glossary." https://www.waterfootprint.org/water-footprint-2/glossary/**
- Claim/figures: blue water: "Fresh surface and groundwater, in other words, the water in freshwater lakes, rivers and aquifers." Blue water footprint: "Volume of surface and groundwater consumed as a result of the production of a good or service."
- Checked directly: the glossary page via fetch.
- Limitations: an NGO glossary, not peer-reviewed; the definitions are standard in water-footprint accounting. The original calculator already names the Water Footprint Network among its sources.
- Confidence/decision: **use** for the glossary definition of blue water.

## Selected features

List the five selected features. Briefly explain why each was selected and how the set serves all three reference profiles. Name a few serious alternatives and explain why they were rejected.

> **USER-APPROVED (selected features only) — 2026-09-21.** The user explicitly approved the five selected features below after reviewing the draft. This approval covers the feature selection. It does not resolve the open items listed under "Open items before approval," which remain open, and it does not mark the individual source assessments as verified. Those still need the user's own checks.

### Proposed five features

| # | Feature | Brief category | How it changes the calculation |
|---|---|---|---|
| 1 | **Generated-media input (video and images):** *Video:* seconds of video, three reference tiers (low ≈ 0.73, mid ≈ 4.1, high ≈ 77 Wh per video-second) with a range. *Images (added at the user's direction):* count of images in draft / standard / high-quality tiers, with a range of roughly 0.3 to 3.6 Wh per image (sources 23–25; tier values to be set in the specification). Water for both derived at the calculator's implied 3.6–4.1 L/kWh | Professional AI | Adds new AI row types to the daily and yearly totals |
| 2 | **Agent session:** size tiers by default, plus an advanced token mode (fresh-input, cache-read, output tokens; cache-read setting 1% / 10% / 25%; Bistline Table 2 factors) | Professional AI | Replaces the single fixed "agent session" size; adds project-level totals |
| 3 | **Device-based streaming hours:** hours per device (TV, laptop, tablet, phone), using derived per-device estimates plus a fixed network and data-centre share | Digital life | Adds non-AI digital use to the total, per device |
| 4 | **Video calls:** hours, with a camera on/off toggle and a range (Greenspector measured anchor, Mytton network floor; Obringer only as a disputed upper bound, or omitted) | Digital life | Adds video calls to the total, with camera-dependent values |
| 5 | **Whole-result low / central / high range** with a plain-language explanation of what drives it | Strongest remaining need | Changes the final calculation output from one number to a computed range built from the other features' ranges |

**Why these five:**
- Features 1–2 improve how professional AI use is represented (needs: Alex's video work, Jordan's long sessions and wish for assumptions and project totals).
- Features 3–4 connect AI use to digital life (Alex's multi-device streaming; Jordan's and Robin's video calls).
- Feature 5 addresses the strongest remaining need found: honest, visible uncertainty. Robin needs it most, Jordan asked for ranges, and Alex benefits from seeing how uncertain the video and water figures are. Source 20 supports showing numeric ranges (small trust cost, mostly for verbal hedges).
- The brief says styling or wording changes do not count, so feature 5 must be a real computation (combined range), not just captions.

**Profile coverage (proposed):**
- **Alex:** 1 (video and image generation, water), 3 (streaming across three devices), 5 (uncertainty around water and video).
- **Jordan:** 2 (agent sessions, assumptions, project totals), 4 (calls), 5 (ranges), 1 (ranges).
- **Robin:** 3 (streaming), 4 (video meetings), 5 (plain-language uncertainty and visible sources).

**Serious alternatives (proposed reasons; for the user to confirm or change):**
- *Social media hours* — Robin's and Alex's use, but the only measurements found are one consultancy's 2021 old-phone tests, unverified, with conflicting secondary figures.
- *Image generation as a separate feature* — researched (sources 23–25); the user chose to fold it into feature 1 instead of counting it as its own feature, since it shares the tier-and-range design, water derivation, and caveats with video.
- *Gaming PC energy* — serves Jordan (Mills et al. 2019 is the lead), but the paper has not been read and it duplicates the digital-life category already covered twice.
- *Parametric video model* (resolution and step inputs) — rejected by the user in favor of three tiers; validated on one model only and harder to explain to Robin.
- *Single-range streaming with no device breakdown* — rejected by the user; ignores the device differences central to Alex.

**Open items carried into the specification (agent's list; not exhaustive; the features were approved with these still open):**
- Sources not verified or only partly verified: LBNL water report (source 6, unread); Li et al. (5, summaries only); Obringer paper (16, abstract and derivation unread); Greenspector social (21); Baumgartner (22); Elsworth et al. and Epoch AI (underlie 12 and 14).
- Derived, not sourced: per-device streaming power (10, includes an assumed tablet value); video water at 3.6–4.1 L/kWh (depends on unverified WRI inputs); Wh per video-second and the cache-read sensitivity numbers (our arithmetic).
- Jordan's gaming was not researched. Image generation was researched (sources 23–25) but has no commercial-tool measurement, no system-overhead factor for GPU-only figures, and no image-specific water figure.
- The user should independently open and check the sources the project will cite, per the instructions above.
- Specification-stage questions raised during review: how to describe the video tiers (they mix model, resolution, and frame rate); the water treatment for streaming and calls (off-site-only factor, unsourced); the method for combining ranges in feature 5; the Obringer upper bound for video calls (show or omit); tier definitions for agent sessions and images.
- Feature 5's rationale rests on Robin's need for honest uncertainty. The supported part is source 20 (numeric ranges cost little trust); Robin's distrust of company motives specifically remains an unverified assumption (source 22 was rejected).

User approval: Review the completed research directly. Confirm that sources exist and support the claims the project will use, correct the document as needed, and explicitly approve the selected features before developing the specification. The agent cannot complete this approval on the user's behalf.

## Commands

### Start research

User: Open the project repository as your workspace, start a fresh chat, and type `start research`.

### Save transcript

Agent: After the user approves the selected features, remind them that the transcript is a deliverable and ask them to say `save transcript`. Wait for that direction.

When the user directs the agent to save the transcript, the agent saves the entire conversation in the `transcripts/` directory as `research-YYYY-MM-DD_HHMMSS.md`, marks user and agent responses clearly, and confirms the saved relative path.
