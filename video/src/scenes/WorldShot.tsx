import React from 'react';
import {AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, interpolate} from 'remotion';
import {grotesk, mono} from '../fonts';
import {bright} from '../theme';

// One world in the montage: real, DYNAMIC scroll footage of the live page
// (the scroll is the motion — no Ken-Burns zoom), under a clean cream editorial
// label card. The footage is the variable; motion is the constant.
export const WorldShot: React.FC<{
  src: string;          // public-relative path, e.g. 'footage/noir.mp4'
  startFrom: number;    // composition frames to skip into the clip (30fps)
  index: string;        // "01"
  name: string;         // "Sci-fi noir"
  title: string;        // "VANTASCOPE"
  accent: string;
  durationInFrames: number;
  playbackRate?: number;
}> = ({src, startFrom, index, name, title, accent, durationInFrames, playbackRate = 1.5}) => {
  const frame = useCurrentFrame();
  const d = durationInFrames;

  // Crossfade through cream (fresh, not black). The page's own scroll carries
  // the motion within the cut.
  const fade = interpolate(frame, [0, 8, d - 10, d], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  // Label card slides up, holds, slides out.
  const cardY = interpolate(frame, [8, 24], [70, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const cardFade = interpolate(frame, [8, 24, d - 22, d - 8], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{backgroundColor: bright.paper, opacity: fade}}>
      <AbsoluteFill style={{transform: 'scale(1.02)'}}>
        <OffthreadVideo
          src={staticFile(src)}
          startFrom={startFrom}
          playbackRate={playbackRate}
          muted
          style={{width: '100%', height: '100%', objectFit: 'cover'}}
        />
      </AbsoluteFill>

      {/* clean cream editorial label card, bottom-left */}
      <div
        style={{
          position: 'absolute', left: 72, bottom: 72,
          background: bright.card,
          borderLeft: `4px solid ${accent}`,
          borderRadius: 4,
          padding: '20px 30px 20px 26px',
          opacity: cardFade,
          transform: `translateY(${cardY}px)`,
          boxShadow: '0 24px 60px rgba(20,12,6,0.45)',
        }}
      >
        <div style={{display: 'flex', alignItems: 'baseline', gap: 16}}>
          <span style={{fontFamily: mono, color: accent, fontSize: 22, letterSpacing: 2}}>{index}</span>
          <span style={{fontFamily: grotesk, color: bright.ink, fontSize: 46, fontWeight: 700, letterSpacing: -1}}>{title}</span>
        </div>
        <div style={{fontFamily: mono, color: bright.inkSoft, fontSize: 21, letterSpacing: 5, marginTop: 6, textTransform: 'uppercase'}}>
          {name}
        </div>
      </div>
    </AbsoluteFill>
  );
};
