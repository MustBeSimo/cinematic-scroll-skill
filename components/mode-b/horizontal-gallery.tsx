"use client";

import { useRef, type CSSProperties } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* Tokens come from your global CSS (tokens/build/variables.css) — referenced via var(), never literals. */
type Card = { idx: string; title: string; body: string; href?: string };

export interface HorizontalGalleryProps {
  eyebrow?: string;
  title?: string;
  cards: Card[];
  /** Multiplier for pin scroll distance vs. track width. */
  scrub?: number;
  className?: string;
}

const trackStyle: CSSProperties = {
  display: "flex",
  gap: "var(--space-lg)",
  paddingInline: "clamp(var(--space-lg),6vw,8rem)",
  willChange: "transform",
};

export default function HorizontalGallery({
  eyebrow = "Selected Works",
  title = "Scroll down — the gallery moves sideways.",
  cards,
  scrub = 1,
  className,
}: HorizontalGalleryProps) {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // matchMedia: desktop pin-scrub only. Touch + reduced-motion get the native CSS overflow scroller (no JS).
      const mm = gsap.matchMedia();
      mm.add(
        "(min-width: 769px) and (prefers-reduced-motion: no-preference)",
        () => {
          const el = track.current;
          if (!el) return;
          const travel = () => el.scrollWidth - el.clientWidth;
          const tween = gsap.to(el, {
            x: () => -travel(),
            ease: "none", // linear scrub — easing lives in the role curves, not the scrubbed transform
            scrollTrigger: {
              trigger: root.current,
              start: "top top",
              end: () => "+=" + travel() * scrub,
              pin: true,
              scrub: true,
              invalidateOnRefresh: true,
            },
          });
          return () => tween.scrollTrigger?.kill();
        }
      );
      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <main>
      <section
        ref={root}
        className={className}
        aria-labelledby="hg-title"
        aria-roledescription="horizontal gallery"
        style={{ overflow: "hidden" }}
      >
        <header style={{ paddingInline: "clamp(var(--space-lg),6vw,8rem)", maxWidth: "62rem" }}>
          <p
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "var(--size-caption)",
              letterSpacing: ".22em",
              textTransform: "uppercase",
              color: "var(--fg-dim)",
            }}
          >
            {eyebrow}
          </p>
          <h2
            id="hg-title"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--fluid-h1)",
              lineHeight: "var(--lh-tight)",
              fontWeight: 600,
              maxWidth: "16ch",
            }}
          >
            {title}
          </h2>
        </header>

        {/* role=list keeps the X-track a readable sequence; each card is a focus stop. */}
        <div ref={track} role="list" aria-label="Gallery cards" style={trackStyle}>
          {cards.map((c, i) => (
            <a
              key={i}
              role="listitem"
              href={c.href ?? "#"}
              aria-label={`${c.idx} — ${c.title}`}
              style={{
                flex: "0 0 min(82vw,30rem)",
                minHeight: "62vh",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                gap: "var(--space-md)",
                padding: "var(--space-lg)",
                background: "var(--surface)",
                border: "1px solid var(--line)",
                borderRadius: 14,
                color: "inherit",
                textDecoration: "none",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: "var(--size-caption)",
                  letterSpacing: ".22em",
                  textTransform: "uppercase",
                  color: "var(--accent)",
                }}
              >
                {c.idx}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--size-body-lg)",
                  lineHeight: "var(--lh-tight)",
                  fontWeight: 600,
                }}
              >
                {c.title}
              </span>
              <span style={{ fontSize: "var(--size-caption)", color: "var(--fg-dim)", maxWidth: "34ch" }}>
                {c.body}
              </span>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}

/*
  Mobile / reduced-motion: matchMedia never registers the pin, so add this once globally
  to expose the track as a native horizontal scroller (transform:none; overflow-x:auto;
  scroll-snap-type:x mandatory; cards get scroll-snap-align:start). :focus-visible outline
  uses var(--accent). No 3D tilt anywhere — §1.9 honored by construction.
*/
