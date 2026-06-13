import React from 'react';
import {AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, interpolate, Sequence, spring, useVideoConfig} from 'remotion';
import {grotesk, mono, serif} from '../fonts';
import {bright} from '../theme';

// 0–5s cold open, bright editorial. Four colourful real sites flash through a
// clean framed window, then a warm cream card resolves with the thesis. Fresh,
// premium, energetic — the worlds supply the colour, the frame stays editorial.
const FLASH = [
  {src: 'footage/renaissance.mp4', from: 20},
  {src: 'footage/pop.mp4', from: 30},
  {src: 'footage/studio.mp4', from: 25},
  {src: 'footage/luxe.mp4', from: 40},
];

export const ReelHook: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const flashLen = 19;

  // Cream title card resolves over the flashes.
  const cardIn = spring({frame: frame - 78, fps, config: {damping: 200}});
  const eyebrow = interpolate(frame, [86, 100], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const head = interpolate(frame, [96, 116], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const headY = interpolate(frame, [96, 116], [26, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const rule = interpolate(frame, [110, 130], [0, 220], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{backgroundColor: bright.paper}}>
      {/* framed window cycling the live sites */}
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <div style={{width: 1560, height: 760, borderRadius: 20, overflow: 'hidden', boxShadow: '0 40px 90px rgba(60,40,20,0.22)', border: `1px solid ${bright.line}`, position: 'relative'}}>
          {FLASH.map((f, i) => (
            <Sequence key={f.src} from={i * flashLen} durationInFrames={flashLen + 4}>
              <FlashClip src={f.src} from={f.from} />
            </Sequence>
          ))}
        </div>
      </AbsoluteFill>

      {/* cream card resolve */}
      <AbsoluteFill style={{backgroundColor: bright.paper, opacity: cardIn, justifyContent: 'center', alignItems: 'center', textAlign: 'center'}}>
        <div style={{fontFamily: mono, color: bright.cognac, fontSize: 24, letterSpacing: 8, opacity: eyebrow}}>
          ONE ENGINE
        </div>
        <div style={{fontFamily: serif, color: bright.ink, fontSize: 150, fontWeight: 600, fontStyle: 'italic', letterSpacing: -2, opacity: head, transform: `translateY(${headY}px)`, marginTop: 4, lineHeight: 1}}>
          every aesthetic
        </div>
        <div style={{height: 3, width: rule, background: bright.cognac, marginTop: 26}} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const FlashClip: React.FC<{src: string; from: number}> = ({src, from}) => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [0, 3, 16, 21], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{opacity: op}}>
      <OffthreadVideo src={staticFile(src)} startFrom={from} playbackRate={1.5} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    </AbsoluteFill>
  );
};
