# Detection Pipeline — shared scroll-interaction detection

> Shared by **audit mode** (`audit-mode.md`, scores the findings) and **learn mode**
> (`learn-mode.md`, distills the findings). One detection vocabulary, two consumers.
> Observe only sites the user owns or is authorized to test — see the network note in
> `audit-mode.md` and `manifest.json` → `security.thirdPartyNetworkCalls`.

<!-- The 7 detection categories below were extracted verbatim from audit-mode.md so both
     modes share one source of truth. Do not duplicate this content back into either mode. -->

## Detection categories

### Step 1: Scroll Interaction Detection

Analyze the page for the following interaction types. Each detection method produces evidence that feeds into the scoring rubrics.

#### 1.1 Pinned/Fixed Sections
**Detection method:**
- Query all elements with `position: sticky` or `position: fixed`
- Check for `pin: true` in GSAP ScrollTrigger instances
- Measure element height vs. scroll distance: if element stays visible for >150vh of scroll, flag as pinned

**Evidence collected:**
- Pin count per page
- Pin duration in vh units (measured by scroll distance element remains fixed)
- Consecutive pin count (how many pins without 80vh+ breathing room)
- Pin spacing behavior (element releases smoothly or snaps)

#### 1.2 Parallax Layers
**Detection method:**
- Monitor `transform` changes on scroll via MutationObserver + scroll sampling
- Detect `translateY`/`translateX` changes that correlate with `scrollY` at non-1:1 ratios
- Check for `data-speed` attributes (Locomotive Scroll convention)
- Check CSS for `will-change: transform` on non-fixed elements

**Evidence collected:**
- Parallax layer count per viewport
- Depth multiplier values (scroll rate ratio)
- Whether parallax uses transform (good) or top/left (bad)
- Layer variety: do adjacent chapters use different depth ratios?

#### 1.3 Scroll-Driven Animations
**Detection method:**
- Detect `scroll` event listeners on `window`, `document`, elements
- Check for GSAP ScrollTrigger, ScrollSmoother, Lenis, Locomotive Scroll
- Detect IntersectionObserver usage with `threshold` arrays
- Look for CSS `animation-play-state` toggled by scroll
- Detect CSS scroll-driven animations (`animation-timeline: scroll()`)

**Evidence collected:**
- Library used (if any)
- Listener count and whether they use `passive: true`
- Whether handlers use `requestAnimationFrame` or direct DOM updates
- Presence of layout reads (`getBoundingClientRect`, `offsetHeight`) in scroll callbacks

#### 1.4 Smooth Scroll Libraries
**Detection method:**
- Check `window` for Lenis, ScrollSmoother, Locomotive, SmoothScroll objects
- Detect `overscroll-behavior` CSS property
- Measure scroll smoothness: sample scroll position at 60fps, calculate jitter

**Evidence collected:**
- Library name and version (if detectable)
- Lerp factor / smoothing value
- Scroll jitter percentage (deviation from linear progression)

#### 1.5 3D Transforms
**Detection method:**
- Query for `perspective`, `transform-style: preserve-3d` in CSS
- Detect `rotateX`, `rotateY`, `rotateZ` in computed styles
- Check for `preserve-3d` stacking contexts

**Evidence collected:**
- 3D transform count
- Which elements have 3D transforms
- Whether 3D is disabled on touch/reduced-motion (correct behavior)

#### 1.6 CSS Animations Tied to Scroll
**Detection method:**
- Detect `animation-timeline: scroll()`, `animation-timeline: view()`
- Check for `@scroll-timeline` at-rules
- Monitor `animation-play-state` changes correlated with scroll position

**Evidence collected:**
- Scroll-tied animation count
- Whether they use transform/opacity only

#### 1.7 Scroll Snap
**Detection method:**
- Detect `scroll-snap-type` CSS property
- Check for GSAP ScrollTrigger snap configurations
- Test snap behavior: does it fire within 10vh of pin boundaries?

**Evidence collected:**
- Snap type (mandatory / proximity / none)
- Snap points count
- Snap proximity to pin boundaries

### Detection Artifacts

All detection evidence is stored in a structured JSON artifact:

```json
{
  "url": "https://example.com",
  "timestamp": "2025-01-15T10:30:00Z",
  "device": "desktop",
  "detections": {
    "pins": [{"element": "section.hero", "duration": 280, "startVh": 0, "endVh": 280}],
    "parallaxLayers": [{"element": ".bg", "depth": 0.3, "usesTransform": true}],
    "scrollLibraries": [{"name": "gsap", "version": "3.12", "plugins": ["ScrollTrigger"]}],
    "eventListeners": {"scroll": 3, "passive": 2, "nonPassive": 1},
    "threeDTransforms": [{"element": ".card", "transform": "rotateY(15deg)"}],
    "willChangeCount": 4,
    "compositorLayerCount": 8
  }
}
```
