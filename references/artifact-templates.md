# Pipeline Artifact Templates

The fill-in templates the 5-phase pipeline emits (lifted out of SKILL.md to keep it a lean router). Each phase in `SKILL.md` points here; copy the matching template and fill every field.

---

## cinematic-audit.md

```markdown
# Cinematic Audit — [Project Name]

## Brand Motion Personality
[3-5 adjectives, e.g., "precise, clinical, data-driven, restrained"]

## Emotional Arc
- **Opening (0-20%):** [emotion, e.g., "awe at scale"]
- **Discovery (20-50%):** [emotion, e.g., "curiosity, information hunger"]
- **Turning Point (50%):** [emotion, e.g., "realization of complexity"]
- **Climax (50-80%):** [emotion, e.g., "confidence, trust"]
- **Resolution (80-100%):** [emotion, e.g., "clarity, call to action"]

## Audience Analysis
- Primary device: [desktop/mobile/tablet split]
- Technical sophistication: [low/medium/high]
- Expected attention span: [short <2min / medium 2-5min / long >5min]

## Device Context
- Primary viewport: [e.g., 1440px desktop, 390px mobile]
- Performance tier: [flagship/mid-range/budget/mixed]

## Accessibility Requirements
- WCAG target: [AA/AAA]
- Reduced-motion support: [required/preferred]

## Visual System
- **Primary:** [e.g., Clinical Noir — clinical precision, data-driven]
- **Accent (optional):** [e.g., Symmetric Monument for the authority moment]
- **Rationale:** [why this system matches the brand]

## Color Temperature Progression
[Chapter-by-chapter temperature plan: warm → cool → neutral → warm]

## Typography Strategy
- Display: [font family, sizing approach]
- Body: [font family, sizing approach]
- Source: [from film-archetypes.md Section X]
```

---

## art-direction.md

→ Phase 1.5. Full module: [`asset-direction.md`](asset-direction.md) · gate: [`wow-gate.md`](wow-gate.md).

```markdown
# Art Direction — [Project Name]

## World Premise (one sentence, concrete nouns)
[e.g. "A dark studio where wealth is molten chrome you fly down through."]

## Hero Concept  — passes the Wow Gate (Part A)
The visitor [VERB] a [SUBJECT] made of [MATERIAL], delivered by [MOTION / TIER].
- Subject: [a thing]
- Verb: [fly through · orbit · walk past · descend · pour · refract · assemble …]
- Delivered by: [scroll-driven WebGL Tier B/C/D · multi-depth choreography]
- Brand-specific because: [why swapping the brand breaks it]

## Motif System (3–5, reused every section)
1. [motif] — recurs in [sections]
2. …

## Material & Light Language
- Material: [chrome · glass · fog · paper · concrete …]
- Light: [single spotlight · dawn rim · volumetric god-rays …]
- Palette by role: --bg [..] · --accent [..] · --accent-2 [..]

## Asset Sourcing (per asset)
| Asset | Source (procedural / fal.ai image / fal.ai GLB / CSS / user) | Notes |
|---|---|---|
| Hero | | Tier + camera move if 3D |
| Section motifs | | |
| Textures / grain | | |
| Characters / illustration | | fal.ai — skill does not generate these |

## Signature Moment (the one shot people screenshot)
[name it + the scroll position it lands at]

## Wow Rubric self-score (need ≥ 8/12)
hero __ · motif __ · motion-as-narrative __ · depth __ · material __ · signature __ = __/12
```

---

## motion-storyboard.md

```markdown
# Motion Storyboard — [Project Name]

## Chapter Map

| # | ID | Pattern | Pin Duration | Transition | Title Reveal |
|---|---|---|---|---|---|
| 1 | hero | Pinned Hero | 250vh | Crane shot down | Mask reveal |
| 2 | problem | Sticky Narrative | 200vh | Fade through black | Word stagger |
| 3 | solution | Chaptered Release | 300vh | Whip pan right | Letter-spacing scrub |
| 4 | ... | ... | ... | ... | ... |

## Chapter Details

### Chapter 1: [ID] — [Pattern from scroll-patterns.md Section X]
**Pin duration:** [X]vh
**Pattern reference:** `references/scroll-patterns.md` Section [X]
**Depth layers:**
| Layer | Depth | Role | Content |
|---|---|---|---|
| 0 | 0.15 | Atmospheric far | [description] |
| 1 | 0.30 | Mid-far | [description] |
| ... | ... | ... | ... |
**Title reveal:** [technique from taste-guardrails.md Section 4.5]
**Transition to next:** [film technique from taste-guardrails.md Section 2]
**Mobile degradation:** [plan from performance-budget.md Section 3]
**Color temperature:** [warm/cool/neutral]

[Repeat for each chapter]

## Transition Map

| From | To | Type | Film Technique | Duration (scroll) |
|---|---|---|---|---|
| ch1 | ch2 | [type] | [e.g., Crane shot] | [X]vh |
| ... | ... | ... | ... | ... |

## Timing / Pacing Spec

- Default rhythm: 1.2s scroll per 100vh (`taste-guardrails.md` Section 3.1)
- Total experience scroll distance: [X]vh
- Estimated scroll time at normal speed: [X] seconds
- Title reveal duration per chapter: 30-40% of pin range (Section 3.5)
- Stagger offset: 5-8% per element, max 5 elements before overlap (Section 3.6)
- Snap dead zone: never within 10vh of pin start/end (Section 3.7)
- Motion density limit: max 3 simultaneous motion types per 50vh window (Section 3.8)

## Mobile Degradation Plan

[Per-chapter summary of mobile strategy, referencing performance-budget.md
Section 3 tier degradation]

## Anti-Convergence Checklist

- [ ] No adjacent chapters share the same pattern
- [ ] No adjacent chapters share the same transition type
- [ ] No adjacent chapters share the same title reveal style
- [ ] No depth multiplier is repeated between adjacent chapters
- [ ] Color temperature alternates between chapters
- [ ] All pins are 150-400vh
- [ ] All pins have 80vh breathing room between them
```

---

---

## technical-spec.md

```markdown
# Technical Spec — [Project Name]

## 3D / Shader Stack Tier

- **Tier:** [A (GSAP/CSS only) / B (Three + GLB) / C (Three + shaders) / D (+ WebXR)]
- **Narrative need (justifies the tier):** [named need, or "none — Tier A" ]
- **Pinned versions:** [e.g., three@0.160.0 exact; @react-three/fiber ^9.0.0; @react-three/drei ^10.0.0; @google/model-viewer 3.4.0] — match `templates/nextjs/package.json`
- **Per-chapter:** [which chapters are 3D and at which tier; the rest are Tier A]
- Source: `references/3d-stack.md` (selection + caps), `references/webxr.md` (Tier D)

## Package Selection

| Package | Version | Purpose |
|---|---|---|
| gsap | ^3.15 | Core animation engine (SplitText / MorphSVG / ScrollSmoother free since 3.13) |
| lenis | ^1.3.23 | Smooth scroll (alternative: GSAP ScrollSmoother) |
| choreo-3d | 1.0.0 | Pinning orchestration, ScrollLayer, ScrollChoreography |
| @gsap/react | ^2.1.2 | useGSAP hook for React integration |
| next | ^15.5 | Framework (Mode B only) |
| @react-three/fiber | ^9.0.0 | React renderer for three (Tier B/C/D only) |
| @react-three/drei | ^10.0.0 | R3F helpers (Tier B/C/D only) |
| three | 0.160.0 | Renderer — **exact pin** (Tier B/C/D only) |
| @google/model-viewer | 3.4.0 | AR quick-look web component — **exact pin** (Tier B/D only) |

## Component Architecture

[Diagram or list of components and their responsibilities]

## Animation Timeline Specs

### Chapter 1: [ID]
```javascript
// GSAP ScrollTrigger configuration
ScrollTrigger.create({
  trigger: '#ch1',
  start: 'top top',
  end: '+=250vh',
  pin: true,
  scrub: 0.5,
  snap: { /* ... */ },
});
```
**Scroll-scrub values:** [list]
**Easing functions:** [per-role assignment]
**Layer animation details:** [per-layer transform specs]

[Repeat for each chapter]

## Performance Budget Allocation

| Resource | Budget | Actual | Status |
|---|---|---|---|
| Compositor layers (desktop) | 10 max | [X] | OK/RISK |
| Compositor layers (mobile) | 4 max | [X] | OK/RISK |
| Images per chapter | 3 max | [X] | OK/RISK |
| Total image weight | 500KB/ch | [X] | OK/RISK |
| Font families | 2 max | [X] | OK/RISK |
| Animation JS | 100KB gz | [X] | OK/RISK |

## Asset Requirements

| Chapter | Asset | Type | Spec | Prompt/Source |
|---|---|---|---|---|
| 1 | hero-bg | image | 1920x1080 WebP | [prompt or URL] |
| ... | ... | ... | ... | ... |

## Mobile Degradation Implementation

[Per-chapter mobile strategy with specific code approach]

## Performance Risks & Mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| [e.g., 8 layers in ch3] | High | Reduce to 5, use opacity faking |
| ... | ... | ... |

## GSAP Defaults

```javascript
ScrollTrigger.defaults({
  markers: false,
  scrub: 0.5,
  invalidateOnRefresh: true,
  fastScrollEnd: true,
  preventOverlaps: true,
});
```
```

---

---

## polish-report.md

```markdown
# Polish Report — [Project Name]

## Performance Audit

### Scroll Jank Measurement
- Test device: [e.g., MacBook Pro M3]
- Recording duration: 10 seconds
- Frames dropped: [X] / [total] ([X]%)
- Status: [PASS / FAIL] (target: < 5%)

### Lighthouse Scores
| Metric | Score | Target | Status |
|---|---|---|---|
| Performance | [X] | > 90 | OK/FAIL |
| Accessibility | [X] | > 95 | OK/FAIL |
| Best Practices | [X] | > 90 | OK/FAIL |
| SEO | [X] | > 90 | OK/FAIL |

### Layer Count
- Desktop: [X] layers (budget: 10) — OK/FAIL
- Mobile: [X] layers (budget: 4) — OK/FAIL

## Accessibility Checklist

- [ ] All images have alt text
- [ ] Focus states on all interactive elements
- [ ] Keyboard navigation works
- [ ] aria-label on visual nav controls
- [ ] Color contrast ≥ 4.5:1 for body text
- [ ] Reduced-motion: content visible and usable
- [ ] Screen reader compatible

## Mobile Test Results

| Device | OS | Browser | Result |
|---|---|---|---|
| iPhone 15 Pro | iOS 17 | Safari | PASS/FAIL |
| iPhone 12 | iOS 17 | Safari | PASS/FAIL |
| iPhone SE | iOS 17 | Safari | PASS/FAIL |
| Samsung S24 | Android 14 | Chrome | PASS/FAIL |
| Pixel 6 | Android 14 | Chrome | PASS/FAIL |

## Banned Patterns Check

- [ ] No filter animation during scroll
- [ ] No layout property animation (width/height/top/left)
- [ ] No setState in scroll handlers
- [ ] No >7 layers per chapter
- [ ] No same easing for every animation
- [ ] No same transition type between adjacent chapters

## Emotional Arc Verification

| Scroll Position | Expected Emotion | Actual | Match |
|---|---|---|---|
| 0-20% | [from audit] | [observed] | Y/N |
| 20-50% | [from audit] | [observed] | Y/N |
| 50% | [from audit] | [observed] | Y/N |
| 50-80% | [from audit] | [observed] | Y/N |
| 80-100% | [from audit] | [observed] | Y/N |

## Final Fixes Applied

[List any fixes applied during the polish phase]

## Ship Recommendation

[GO / NO-GO with reasoning]
```

---

