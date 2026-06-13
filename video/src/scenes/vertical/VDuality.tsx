import React from 'react';
import {AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, interpolate, spring, useVideoConfig} from 'remotion';
import {grotesk, mono, serif} from '../../fonts';
import {bright} from '../../theme';

// ACT I — THE HOOK (0–6.7s), vertical. One scroll-choreography.json splits into
// a WEBSITE and a LAUNCH FILM — stacked vertically (one above the other), both
// showing the same noir scroll. Resolves to "One file. Both outputs."
export const VDuality: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const chip = spring({frame: frame - 4, fps, config: {damping: 200}});
  // panels split apart vertically
  const split = spring({frame: frame - 40, fps, config: {damping: 200}});
  const offset = interpolate(split, [0, 1], [0, 360]);
  const panelFade = interpolate(frame, [40, 64], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const chipFade = interpolate(frame, [40, 60], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  // resolve to type card
  const cardIn = interpolate(frame, [150, 168], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const headY = interpolate(frame, [150, 172], [28, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const sub = interpolate(frame, [168, 186], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{backgroundColor: bright.paper, justifyContent: 'center', alignItems: 'center'}}>
      {/* the two outputs, stacked vertically, showing the SAME scroll */}
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: panelFade}}>
        <div style={{display: 'flex', flexDirection: 'column', gap: 56, alignItems: 'center'}}>
          <Panel label="WEBSITE" shift={-offset} accent={bright.cognac} />
          <Panel label="LAUNCH FILM" shift={offset} accent={bright.oxblood} highlight />
        </div>
      </AbsoluteFill>

      {/* json chip */}
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: chip * chipFade, transform: `scale(${interpolate(chip, [0, 1], [0.9, 1])})`}}>
        <div style={{fontFamily: mono, fontSize: 48, color: bright.ink, background: bright.card, border: `1.5px solid ${bright.line}`, borderRadius: 18, padding: '28px 40px', boxShadow: '0 24px 60px rgba(60,40,20,0.18)', textAlign: 'center', maxWidth: 940, lineHeight: 1.4}}>
          <span style={{color: bright.cognac}}>{'{ }'}</span> scroll-choreography.json
        </div>
      </AbsoluteFill>

      {/* resolve card */}
      <AbsoluteFill style={{backgroundColor: bright.paper, opacity: cardIn, justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '0 70px'}}>
        <div style={{fontFamily: grotesk, color: bright.ink, fontSize: 118, fontWeight: 700, letterSpacing: -2, lineHeight: 1.02, transform: `translateY(${headY}px)`}}>
          One file.<br />Both outputs.
        </div>
        <div style={{fontFamily: serif, color: bright.cognac, fontSize: 56, fontStyle: 'italic', marginTop: 28, opacity: sub}}>
          This very video was compiled from it.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const CARD_W = 1000;
const CARD_H = Math.round((CARD_W * 9) / 16); // 562 — true 16:9

const Panel: React.FC<{label: string; shift: number; accent: string; highlight?: boolean}> = ({label, shift, accent, highlight}) => {
  // identical scroll in both — proves the duality. Same source, same timing.
  return (
    <div style={{transform: `translateY(${shift}px)`}}>
      <div style={{width: CARD_W, height: CARD_H, borderRadius: 16, overflow: 'hidden', border: `2px solid ${highlight ? accent : bright.line}`, boxShadow: '0 30px 70px rgba(40,26,12,0.3)', position: 'relative'}}>
        <OffthreadVideo src={staticFile('footage/noir.mp4')} startFrom={0} playbackRate={1.0} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        <div style={{position: 'absolute', top: 18, left: 20, fontFamily: mono, fontSize: 34, fontWeight: 700, letterSpacing: 3, color: '#fff', background: 'rgba(10,12,15,0.7)', padding: '10px 20px', borderRadius: 8}}>
          {label}
        </div>
      </div>
    </div>
  );
};
