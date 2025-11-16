# Simone-Inspired Scroll Choreography Master Plan

This four-phase plan merges the strongest elements from our existing ClearSeas visualizer roadmap with the Simone reference observations. Each phase escalates narrative immersion while preserving performance, accessibility, and CMS-friendly content workflows.

## Phase 1 – Immersive Scroll Choreography Spine
- **Pinned hero + narrative scenes:** Implement GSAP ScrollTrigger (paired with Lenis smooth scrolling) to pin the hero and subsequent narrative sections, mirroring Simone's continuous vertical choreography.
- **Global timeline conductor:** Build a master timeline within `scripts/global-page-orchestrator.js` that coordinates hero cards, text reveals, and visualizer states based on scroll progress.
- **Parallax & depth:** Layer floating visualizer cards with parallax offsets and z-index sequencing to deliver Simone-style drift while maintaining legibility.
- **Accessibility & reduced motion:** Provide `prefers-reduced-motion` fallbacks that simplify the timeline to opacity/translate transitions without pinning.
- **Deliverable:** Functional prototype showing hero pinning, timeline scrubbing, and synchronized card/text choreography ready for refinement.

## Phase 2 – Visualizer Morph & Parameter Engine
- **Morphable hero geometry:** Extend the Polytopal Field visualizer (or introduce a dedicated morph helper) so the hero mask transitions from circle → rounded rectangle → full-bleed panel while staying in sync with scroll progress.
- **Parameter storytelling:** Map scroll ranges to parameter presets (density, stability, zoom) across Polytopal Field, Particle Networks, and Enhanced Quantum Background to express "stability gain/loss" and zoom cues.
- **Bleed-through blends:** Apply CSS mix-blend modes and canvas masking so morphing visuals bleed into surrounding negative space and typography, echoing Simone's organic overlays.
- **Deliverable:** Scroll-driven visualizer morph system with parameter transitions wired into the choreography spine.

## Phase 3 – Background Texture & Negative-Space Integration
- **Persistent grain layer:** Introduce a shader-driven grain/noise background that remains largely fixed, anchoring the scene while foreground elements move above it.
- **Subtle global reactions:** Tie background saturation, vignette, and grain intensity to aggregate parameter values so the environment responds to stability shifts without overpowering content.
- **Negative-space gradients:** Use gradient masks and vignette framing to let visualizers bleed beyond card boundaries while retaining contrast for typography and CTAs.
- **Deliverable:** Integrated background system that deepens spatial cohesion and supports the hero morph narrative.

## Phase 4 – Content Sequencing, Case Studies, & Performance Polish
- **Narrative copy choreography:** Sync headlines and supporting copy transitions with morph states, adopting Simone's calm, cinematic pacing for reveals.
- **Case-study stack with video loops:** After the hero morph completes, cascade into pinned case-study modules featuring looping previews and hover feedback.
- **Performance guardrails:** Profile timeline and shader performance; implement adaptive degradation (particle count throttling, static fallbacks) for low-power devices.
- **QA & accessibility checks:** Conduct motion preference audits, keyboard navigation tests, and contrast verification to ensure the experience remains inclusive.
- **Deliverable:** Production-ready scroll experience with optimized assets, responsive behaviors, and verified accessibility.

> **Next Steps:** Phase 1 execution begins immediately in the following iteration, establishing the choreography spine that subsequent phases will build upon.
