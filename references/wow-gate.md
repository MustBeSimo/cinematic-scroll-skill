# The Wow Gate — reject generic *before* you build

> A blocking, pre-build gate. `cinematic-doctor` scores the **executed static contract**
> (taste / perf / a11y / mobile / tokens / 3D) *after* the build and stops slop from
> shipping. The Wow Gate scores the **concept** *before* the build and stops a generic idea
> from being built well. **Both must pass.** The doctor guarantees "not slop"; this gate
> guarantees "actually memorable." Run it at the end of Asset Direction (Phase 1.5), on the
> `art-direction.md` artifact.

A skilled operator already clears this gate by instinct. Writing it down is what makes the
*wow* reproducible by anyone, every time — which is the whole point of a skill.

---

## Part A — The Hero Concept Gate (hard pass/fail)

The hero concept from `art-direction.md` must satisfy **ALL FOUR**. If any fails,
**regenerate the concept — do not proceed to the storyboard.**

1. **Subject + verb.** It names a *thing* (subject) and a *verb the visitor does to it*
   (fly through · orbit · walk past · descend into · pour · refract · assemble · excavate).
   *"A dark hero with a headline and a 3D image"* has no verb → **fail**.

2. **Real motion delivers the verb.** The verb is carried by scroll-driven 3D/WebGL or
   genuine multi-depth choreography — **not** a static image with an opacity fade. If the
   "verb" is just "looks cool while sitting still," → **fail**.

3. **Brand-specific.** Swap the brand and the hero should *break*. If the same hero would
   fit any SaaS / any fintech / any agency, it's wallpaper → **fail**. (Test: read the
   concept with three unrelated brand names. Still fits all three? Fail.)

4. **Earns its tier.** If it claims 3D, name the exact thing the camera does through real
   geometry ([3d-stack.md](3d-stack.md)). "Could be 3D" is not "should be 3D" — but a
   *flat* hero on a brief that asked for *wow* usually fails #2.

> One-line verdict to write in `art-direction.md`:
> **"The visitor `<verb>` a `<subject>` made of `<material>`, delivered by `<motion/tier>`."**
> If you can't complete that sentence with concrete nouns, you don't have a hero yet.

---

## Part B — The Wow Rubric (score 0–2 each; need ≥ 8 / 12)

Self-score the `art-direction.md` before building. Below 8 → the concept isn't ready; the
build will be competent, not memorable. Fix the concept, not the code.

| # | Dimension | 0 | 1 | 2 |
|---|---|---|---|---|
| 1 | **Distinct hero** | Generic landing hero | Recognizable but safe | A concept you've not seen — passes Part A |
| 2 | **Motif coherence** | Random per-section art | Some reuse | A motif system carried by every section |
| 3 | **Motion as narrative** | Fades/decoration | A few real reveals | Scroll reveals scale / reframes / lands — it *tells* |
| 4 | **Depth** | Flat | 2–3 layers | Real multi-plane or true 3D |
| 5 | **Material & light language** | Default UI | Consistent palette | A named material world, lit deliberately |
| 6 | **Signature moment** | None | A nice transition | One designed peak people will screenshot |

**≥ 8** to proceed. A 6 with a brilliant hero (Part A passed, dim. 1 = 2) is often worth
pushing to 8 by upgrading motifs + one signature moment — cheaper than rebuilding later.

---

## Part C — Guarantee the signature moment survived

The single most common way *wow* dies is in execution: the designed peak gets value-tuned
into mush. After build, in the polish phase:

1. Open the **page-proof frames** at the scroll position of the signature moment.
2. Grade that frame like a poster: is the peak *unmistakable*, or did it get washed out /
   half-revealed / out-of-frame?
3. If it's not obviously the best frame in the set, it failed — tune and re-prove. (This is
   exactly how Aether's clouds and the AUREUS hero went from flat to striking: the doctor
   passed on pass 1; the *peak* took a polish loop.)

---

## How it plugs into the pipeline

```
Phase 1   Cinematic Audit        → cinematic-audit.md       (mood + arc)
Phase 1.5 Asset Direction        → art-direction.md         (the world + assets)
          └─ WOW GATE ───────────  Part A (hard) + Part B (≥8/12)   ← you are here
Phase 2   Motion Storyboard      → motion-storyboard.md     (chapters carry motifs)
Phase 3   Technical Spec         → technical-spec.md
Phase 4   Build                  → code
Phase 5   Polish                 → polish-report.md
          ├─ cinematic-doctor ≥ 80   (executed contract)
          └─ WOW GATE Part C         (signature moment survived)
```

**Adaptive gating (consistent with SKILL.md):** when the user wants the process, surface the
gate verdict for approval. When they asked for a result, run it internally and *act on it* —
a failed Part A means regenerate the concept before writing code; it is not advisory. Never
build a generic hero just because the prompt was thin: propose the distinct concept and go.
