import React from 'react';
import {AbsoluteFill, useCurrentFrame, interpolate} from 'remotion';
import {mono} from '../fonts';
import {theme} from '../theme';
import {Caption} from '../components/Caption';

const CODE = [
  '<ChapterScene id="arrival" depth={0.75}',
  '  tilt={{ x: 4, y: 2 }} pin={220}>',
  '  <ParallaxField layers={6} />',
  '  <MaskWipeTitle>HOLLOW STAR</MaskWipeTitle>',
  '</ChapterScene>',
  '',
  'gsap.to(camera, { z: -80, scrollTrigger })',
  'morphBackground("#0a1416" → "#1a0a0d")',
  'SplitText(title).chars  // stagger 0.02',
  'lenis.on("scroll", ScrollTrigger.update)',
  'reduceMotion ? showStatic() : play()',
  'budget: transform + opacity only ✓',
];

// Scene 2 (90–135): code streams by fast — the agent art-directing.
export const BuildFlashScene: React.FC = () => {
  const frame = useCurrentFrame();
  const scroll = interpolate(frame, [0, 70], [0, 520], {extrapolateRight: 'clamp'});
  const scan = interpolate(frame, [0, 70], [-200, 1200]);
  return (
    <AbsoluteFill style={{background: theme.bgDeep, overflow: 'hidden'}}>
      <div style={{position: 'absolute', top: 70, left: 110, transform: `translateY(${-scroll}px)`}}>
        {CODE.map((line, i) => {
          const reveal = interpolate(frame, [i * 2, i * 2 + 8], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          return (
            <div
              key={i}
              style={{
                fontFamily: mono,
                fontSize: 40,
                lineHeight: 1.7,
                color: i >= 6 ? theme.teal : theme.sub,
                opacity: reveal * 0.92,
                whiteSpace: 'pre',
              }}
            >
              {line || ' '}
            </div>
          );
        })}
      </div>
      {/* teal scan sweep */}
      <div
        style={{
          position: 'absolute',
          top: scan,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, transparent, ${theme.teal}, transparent)`,
          opacity: 0.6,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 70,
          right: 96,
          fontFamily: mono,
          fontSize: 26,
          letterSpacing: 3,
          color: theme.crimson,
        }}
      >
        PHASE 3 — BUILD
      </div>
      <Caption text="Claude art-directs it" dur={70} accent={theme.crimson} />
    </AbsoluteFill>
  );
};
