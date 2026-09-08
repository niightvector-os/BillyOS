# FORGE — Idea to Creation Engine

**Status: AGENDA / VISION ONLY — not started, not scoped for implementation.**
This document exists to capture the product vision and rough architecture thinking
so it isn't lost, not to greenlight any build work. No code, UI, database, config,
or dependency in BillyOS should change because of this file.

## Philosophy

> "Don't just tell me how to do it. Help me make it."

FORGE is meant to become BillyOS's signature capability — the thing that makes it
more than an AI chatbot. A user brings an idea, concept, problem, or creative
vision, and BillyOS helps turn it into an actual finished creation, not just
advice about how to make one.

The pipeline, conceptually:

## Core UX principle

The user should never feel like they're opening 20 different AI tools. They
describe what they want in plain language; BillyOS figures out which
capabilities are needed and coordinates them behind the scenes. One input,
one workspace, one coherent result — not a toolbox to pick through.

## "Improve my idea" philosophy

FORGE shouldn't blindly execute a weak or unclear concept. It should be able to:
- Identify problems with the original idea
- Suggest stronger alternatives
- Explain *why* an adjustment would improve the result
- Only proceed to creation once the user approves the (possibly revised) direction

This is a real product differentiator, but also the riskiest part to get right —
pushback needs to feel like a sharp collaborator, not a lecturing gatekeeper.

## Potential creation workflows

- **Websites & web apps** — research the concept, sharpen the product idea, define
  UX/UI direction, generate code, test it, potentially deploy it.
- **Images & design** — develop a visual concept, generate artwork/illustrations/
  branding assets/thumbnails/posters/covers via supported image-generation APIs.
- **Music & songwriting** — develop the concept, refine creative direction, write/
  refine lyrics, structure the song, build generation prompts, potentially connect
  to a music-generation service (e.g. Suno or similar).
- **Creator projects** — combine writing, imagery, music, video, branding, research,
  and web creation when a project spans multiple media types.
- **Startup/product ideas** — idea → research → product definition → interface
  concepts → technical architecture → prototype → working product.
- **General creative ideas** — BillyOS decides the right combination of
  capabilities itself, rather than making the user pick from a tool list.

## Architecture considerations (for future design, not decided yet)

- **Orchestration layer** — something has to decide which capability/API a
  request needs and in what order; this is the actual hard problem, not any
  single generation call.
- **Task/workflow system** — multi-step jobs need state: what's done, what's
  next, what failed and needs retry.
- **Tool/API integrations** — each new capability (image gen, music gen, code
  gen/deploy, etc.) should plug in without requiring a rebuild of the
  orchestration core. Needs a clean internal interface/contract per tool type.
- **Permissions** — some workflows (deploying code, spending API credits on
  paid generation) need explicit user confirmation before acting, consistent
  with how the rest of BillyOS already treats "read vs. act" actions.
- **File handling** — generated assets (images, audio, code bundles) need
  storage, versioning, and a way for the user to download/manage them.
- **Generation status / progress UI** — long-running multi-step creation jobs
  need visible progress, not a silent spinner for minutes.
- **Error handling** — a failure partway through a multi-step pipeline (e.g.
  image gen succeeds, deploy fails) needs a sane recovery/retry story, not a
  dead end.
- **Extensibility** — adding a new specialized AI service later shouldn't mean
  touching the orchestration core; new capabilities should register into the
  system.

## Possible integrations (unvetted, for future research)

- Image generation: Gemini/Imagen (already used elsewhere in BillyOS), or others
- Music generation: Suno or similar
- Code generation/deploy: existing AI provider chain + a deploy target (Vercel API?)
- Video generation: unresearched

Each of these has its own pricing, rate limits, and Terms of Service — a real
constraint on what FORGE can actually promise, not just a technical detail.

## Risks worth naming now

- **Cost control** — orchestrating multiple paid generation APIs per request
  could get expensive fast; needs real budgeting/limits before launch, not after.
- **Quality control** — multi-step AI pipelines compound errors; a bad step 2
  can quietly ruin steps 3-5.
- **Copyright/IP risk** — AI-generated images, music, and code all carry real
  ownership and licensing questions depending on the provider's terms; this
  needs review per-integration, not assumed clean.
- **Scope creep** — this is the most ambitious thing on BillyOS's roadmap by
  far; a phased build with hard checkpoints matters more here than anywhere
  else in the project.
- **Abuse potential** — a system that generates/deploys things on a user's
  behalf needs real guardrails against misuse.
- **Third-party ToS compliance** — reselling/wrapping access to generation
  APIs (same category of concern already flagged for the AI chat providers)
  applies here too, likely more so given paid generation services.

## Rough phased roadmap (not committed, for future planning)

1. **Phase 0 — Scoping.** Pick one single workflow (likely image generation,
   since Gemini/Imagen access already exists) and design just that path
   end-to-end before touching orchestration.
2. **Phase 1 — Single-workflow MVP.** Ship that one workflow standalone, no
   orchestration layer yet — prove the "idea → create → deliver" loop works
   for one media type.
3. **Phase 2 — Orchestration core.** Build the actual task/workflow system
   once there are 2+ real workflows to coordinate, not before.
4. **Phase 3 — "Improve my idea" layer.** Add the critique/refine step once
   the base creation loop is solid.
5. **Phase 4 — Multi-modal creator projects.** Combine multiple capabilities
   in one request (e.g. a full creator project spanning writing + image + music).
6. **Phase 5 — Polish & scale.** Progress UI, error recovery, cost dashboards,
   permission flows — hardening for real usage.

This roadmap is intentionally rough and should be revisited once BillyOS's
core product (chat, research, video, maps, study mode) is actually launched —
per the current "launch ASAP, no big redesigns" priority, FORGE stays
firmly in the agenda/vision stage until then.
