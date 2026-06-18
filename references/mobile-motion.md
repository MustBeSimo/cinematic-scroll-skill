# Mobile Motion

> Cinematic on mobile = scroll-COUPLED motion: things move *while* the finger
> drags, done touch-safe and smooth. A flat, motionless mobile page is a failure
> mode for this skill.
> Compositor-only (`transform` + `opacity`). JS-driven. No pinning on touch, no
> 3D tilt on touch, no filter animations. Fully disabled under
> `prefers-reduced-motion: reduce`.

---

## 1. The principle

On desktop, cinematic scroll means pinned chapters and multi-layer depth. On
touch, pinning is off (it fights native scroll and induces motion sickness) — so
the cinematic quality comes from **scroll coupling**: the hero image of each
section eases against the scroll (a lerped parallax), and text/figures **reveal
as they enter** the viewport. The page breathes with the scroll instead of
sitting dead under it.

Keep it to two ingredients per section:

1. **One transform-only parallax mover** — usually the hero image. Moves
   vertically against scroll, eased.
2. **Scroll-linked entrance reveals** — text + figures fade and rise in once,
   staggered, as they enter view.

Both are compositor-only. Nothing else animates during scroll.

---

## 2. The Safari gotcha (read this first)

**Version-gate CSS `animation-timeline: view()` / `scroll()` on mobile — JS is the
safe default.** Native CSS scroll-driven animations now work on **Safari 26+** and
Chrome/Opera 115+. But on **older iOS Safari (≤18)** the feature *reports as
supported* yet doesn't drive:

```js
CSS.supports('animation-timeline: view()') // => true even on old iOS Safari
```

…there the timeline **does not actually advance** — the animation sits frozen at
its start keyframe while you scroll, so a bare `@supports` gate activates dead code.
Feature-detection alone lies on those versions.

**For the broadest support, drive mobile scroll coupling from JavaScript** (and
layer the CSS path on top only as a progressive enhancement for Safari 26+/Chrome):

- **Mode A (vanilla):** a `requestAnimationFrame` loop reading `window.scrollY`.
- **Mode B (React):** framer-motion's `useScroll` → `useTransform` → `useSpring`.

Both run on the main thread in JS and work correctly on iOS Safari.

---

## 3. Vanilla single-file recipe (Mode A)

Lerped parallax: cache each mover's center offset once (and on resize), run the
rAF loop **only while scrolling**, ease toward a scroll-derived target each
frame, apply `translate3d`. Entrance reveals via a one-shot IntersectionObserver
with stagger.

```js
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---- Lerped parallax (one mover per section) ---- */
if (!reduce) {
  const movers = [...document.querySelectorAll('[data-parallax]')].map(el => ({
    el,
    speed: parseFloat(el.dataset.parallax) || 0.15, // 0.1–0.2 is plenty
    center: 0,   // cached element center, in document coords
    cur: 0,      // current applied offset (lerped)
    target: 0,   // scroll-derived target offset
  }));

  const measure = () => {                       // cache offsets — NO per-frame reads
    const sy = window.scrollY;
    for (const m of movers) {
      const r = m.el.getBoundingClientRect();
      m.center = r.top + sy + r.height / 2;
    }
  };
  measure();
  addEventListener('resize', measure, { passive: true });

  const vh2 = innerHeight / 2;
  let running = false;

  const frame = () => {
    const sy = window.scrollY;
    let settling = false;
    for (const m of movers) {
      m.target = (sy + vh2 - m.center) * m.speed;   // distance from viewport center
      m.cur += (m.target - m.cur) * 0.12;           // lerp toward target
      m.el.style.transform = `translate3d(0, ${m.cur.toFixed(2)}px, 0)`;
      if (Math.abs(m.target - m.cur) > 0.1) settling = true;
    }
    if (settling) requestAnimationFrame(frame);     // keep going until settled
    else running = false;                           // stop — don't burn rAF
  };

  addEventListener('scroll', () => {                // rAF only while scrolling
    if (!running) { running = true; requestAnimationFrame(frame); }
  }, { passive: true });
}

/* ---- Entrance reveals (one-shot, staggered) ---- */
const reveals = document.querySelectorAll('[data-reveal]');
if (reduce) {
  reveals.forEach(el => el.classList.add('in')); // content visible immediately
} else {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.style.transitionDelay = `${(el.dataset.stagger || i % 5) * 0.06}s`;
      el.classList.add('in');
      io.unobserve(el);                            // one-shot
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -10% 0px' });
  reveals.forEach(el => io.observe(el));
}
```

```css
/* transform + opacity only */
[data-reveal] { opacity: 0; transform: translate3d(0, 24px, 0);
  transition: opacity .7s cubic-bezier(.16,1,.3,1), transform .7s cubic-bezier(.16,1,.3,1); }
[data-reveal].in { opacity: 1; transform: none; }

@media (prefers-reduced-motion: reduce) {
  [data-reveal] { opacity: 1; transform: none; transition: none; }
}
```

Note: `getBoundingClientRect` appears **only** in `measure()` (init + resize),
never inside `frame()`. Use `will-change: transform` on movers sparingly (max 3;
see `performance-budget.md` Section 2).

---

## 4. React / framer recipe (Mode B)

framer-motion is JS-based (it tracks scroll and animates via rAF), so it works
correctly on iOS Safari — unlike CSS scroll-timelines. Use `useScroll` scoped to
the section, map progress with `useTransform`, and damp it with `useSpring` for
the parallax. Use `whileInView` (once) for entrance.

```tsx
'use client';
import { useRef } from 'react';
import {
  motion, useScroll, useTransform, useSpring, useReducedMotion,
} from 'framer-motion';

function MobileChapter({ src, title }: { src: string; title: string }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  // progress 0→1 as the section travels through the viewport
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const yRaw = useTransform(scrollYProgress, [0, 1], ['-8%', '8%']);
  const y = useSpring(yRaw, { stiffness: 120, damping: 30, mass: 0.4 }); // damped

  return (
    <section ref={ref} style={{ overflow: 'hidden' }}>
      <motion.img
        src={src}
        style={{ y: reduce ? 0 : y, willChange: 'transform' }}
      />
      <motion.h2
        initial={reduce ? false : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        {title}
      </motion.h2>
    </section>
  );
}
```

`useSpring` is what makes the parallax feel buttery during flick/momentum
scroll. Keep one parallax mover (the image) per section; reveals carry the text.
No pinning, no 3D tilt on touch.

---

## 5. Reduced motion

Gate **everything**. Under `prefers-reduced-motion: reduce`:

- Skip the parallax loop / set framer values to `0` (the recipes above do this
  via the `reduce` flag and `useReducedMotion`).
- Show all reveal content immediately — never leave text stuck at `opacity: 0`.
- No `transition` on the reveal elements (instant).

Content must always be fully visible and readable without motion. This is the
one state where the mobile page is intentionally static — see
`performance-budget.md` Section 3, Tier 4.
