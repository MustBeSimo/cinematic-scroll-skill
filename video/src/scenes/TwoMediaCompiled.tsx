import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {gsap} from 'gsap';
import {theme} from '../theme';
import {grotesk, mono, serif} from '../fonts';
import {buildChoreographyTimeline, CHOREOGRAPHY_DURATION} from '../generated/choreography';

/* THE DOGFOOD SCENE — not hand-animated. The DOM below is a real-looking
   Quiet Luxury page; every [data-layer] is driven frame-by-frame by the
   timeline emitted from `compile-choreography.mjs --target video` — the same
   JSON that compiles to the scroll page. (PIPELINE.md pattern #2, live.) */

const EASE = Easing.bezier(0.16, 1, 0.3, 1);
const L: React.CSSProperties = {position: 'absolute'};

export const TwoMediaCompiled: React.FC = () => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const tlRef = useRef<ReturnType<typeof buildChoreographyTimeline> | null>(null);

  useLayoutEffect(() => {
    if (!tlRef.current) tlRef.current = buildChoreographyTimeline(gsap);
    const t = interpolate(frame, [20, durationInFrames - 10], [0, CHOREOGRAPHY_DURATION],
      {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    tlRef.current.seek(t, false);
  }, [frame, durationInFrames]);
  useLayoutEffect(() => () => tlRef.current?.kill(), []);

  const intro = interpolate(frame, [0, 20], [0, 1], {extrapolateRight: 'clamp', easing: EASE});
  return (
    <AbsoluteFill style={{background: theme.bgDeep}}>
      <div style={{
        position: 'absolute', inset: '120px 140px 130px', borderRadius: 14, overflow: 'hidden',
        border: `1px solid ${theme.teal}55`, opacity: intro, transform: `scale(${0.97 + intro * 0.03})`,
      }}>
        {/* ── CH 1 · hero-manifesto (dark) ── */}
        <section data-chapter="hero-manifesto" style={{...L, inset: 0, background: '#0d0d0d', visibility: 'hidden', opacity: 0}}>
          <div data-layer="hero-bg-gradient" style={{...L, inset: 0, background: 'radial-gradient(90% 80% at 75% 25%, #2a2118 0%, #0d0d0d 65%)'}} />
          <div data-layer="hero-texture-dust" style={{...L, inset: 0, opacity: 0.06, backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '26px 26px'}} />
          <div data-layer="hero-product-hero" style={{...L, right: '7%', top: '12%', width: '38%', height: '72%', borderRadius: 8, overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,.5)'}}>
            <Img src={staticFile('luxe.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          </div>
          <div data-layer="hero-title-manifesto" style={{...L, left: 64, bottom: 200, fontFamily: mono, fontSize: 16, letterSpacing: '0.3em', color: '#c9a962'}}>
            CHAPTER 01 · THE MANIFESTO
          </div>
          <div data-layer="hero-cta-scroll" style={{...L, left: 64, bottom: 64, fontFamily: mono, fontSize: 15, letterSpacing: '0.2em', color: '#f5f0e8', border: '1px solid #f5f0e844', padding: '12px 22px', borderRadius: 999}}>
            ENTER ↓
          </div>
          <h1 data-title style={{...L, left: 64, bottom: 96, fontFamily: serif, fontWeight: 600, fontSize: 72, lineHeight: 1.04, color: '#f5f0e8', maxWidth: '52%'}}>
            Quiet is the new luxury.
          </h1>
        </section>
        {/* ── CH 2 · editorial-philosophy (cream) ── */}
        <section data-chapter="editorial-philosophy" style={{...L, inset: 0, background: '#f5f0e8', visibility: 'hidden', opacity: 0}}>
          <div data-layer="ed-chapter-marker" style={{...L, right: 40, top: -30, fontFamily: serif, fontSize: 380, fontWeight: 600, color: '#1a1a1a', opacity: 0.05, lineHeight: 1}}>02</div>
          <div data-layer="ed-full-bleed-chapter" style={{...L, inset: 0, background: 'linear-gradient(160deg, transparent 40%, #e8dfd1 100%)'}} />
          <div data-layer="ed-inline-image-1" style={{...L, right: '9%', top: '18%', width: '30%', height: '56%', borderRadius: 6, overflow: 'hidden', boxShadow: '0 24px 60px rgba(60,40,20,.25)'}}>
            <Img src={staticFile('organic.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          </div>
          <div data-layer="ed-pull-quote" style={{...L, left: 64, top: '30%', fontFamily: serif, fontStyle: 'italic', fontSize: 34, lineHeight: 1.45, color: '#5a4f40', maxWidth: '42%'}}>
            “Creative that does not enter the conversation is decoration.”
          </div>
          <h1 data-title style={{...L, left: 64, bottom: 96, fontFamily: serif, fontWeight: 600, fontSize: 64, lineHeight: 1.04, color: '#1a1a1a', maxWidth: '60%'}}>
            The Philosophy of Restraint
          </h1>
        </section>
        {/* ── CH 3 · finale-collection (gold) ── */}
        <section data-chapter="finale-collection" style={{...L, inset: 0, background: '#c9a962', visibility: 'hidden', opacity: 0}}>
          <div data-layer="finale-bg-morph" style={{...L, inset: 0, background: 'radial-gradient(100% 90% at 30% 20%, #d9bc7e 0%, #b08f4a 80%)'}} />
          <div data-layer="finale-ambient-texture" style={{...L, inset: 0, opacity: 0.08, backgroundImage: 'radial-gradient(#1a1208 1px, transparent 1px)', backgroundSize: '22px 22px'}} />
          <div data-layer="finale-product-trio" style={{...L, left: '8%', right: '8%', top: '16%', height: '48%', display: 'flex', gap: 28}}>
            {['luxe.png', 'organic.png', 'retro.png'].map((src) => (
              <div key={src} style={{flex: 1, borderRadius: 6, overflow: 'hidden', boxShadow: '0 22px 50px rgba(40,25,5,.35)'}}>
                <Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
              </div>
            ))}
          </div>
          <div data-layer="finale-product-labels" style={{...L, left: '8%', right: '8%', top: '67%', display: 'flex', gap: 28, fontFamily: mono, fontSize: 15, letterSpacing: '0.22em', color: '#1a1208'}}>
            <span style={{flex: 1}}>Nº 01 — VESSEL</span><span style={{flex: 1}}>Nº 02 — BOTANICAL</span><span style={{flex: 1}}>Nº 03 — ARCHIVE</span>
          </div>
          <div data-layer="finale-nav-dots" style={{...L, right: 56, top: '45%', display: 'flex', flexDirection: 'column', gap: 12}}>
            {[0, 1, 2].map((i) => <span key={i} style={{width: 9, height: 9, borderRadius: 99, background: '#1a1208', opacity: i === 2 ? 0.9 : 0.35}} />)}
          </div>
          <h1 data-title style={{...L, left: 64, bottom: 80, fontFamily: serif, fontWeight: 600, fontSize: 72, color: '#1a1208'}}>
            The Collection
          </h1>
        </section>
      </div>
      {/* the receipt */}
      <div style={{position: 'absolute', top: 40, width: '100%', textAlign: 'center'}}>
        <span style={{fontFamily: mono, fontSize: 19, letterSpacing: '0.24em', color: theme.teal}}>
          ▶ THIS SCENE IS COMPILED, NOT ANIMATED
        </span>
      </div>
      <div style={{position: 'absolute', bottom: 44, width: '100%', textAlign: 'center', fontFamily: grotesk, fontSize: 24, color: theme.sub}}>
        Driven frame-by-frame by <span style={{fontFamily: mono, color: theme.warm}}>scroll-choreography.json</span> — the same file that drives the website
      </div>
    </AbsoluteFill>
  );
};
