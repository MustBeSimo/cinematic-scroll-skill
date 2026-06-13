import React from 'react';
import {AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, interpolate, spring, useVideoConfig} from 'remotion';
import {grotesk, mono, serif} from '../fonts';
import {bright} from '../theme';

// ACT I — THE HOOK (0–6.7s). The buried thesis, now first: one
// scroll-choreography.json splits into a website AND this very launch film.
// The single most powerful differentiator, stated in the first five seconds.
export const ReelDuality: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const chip = spring({frame: frame - 4, fps, config: {damping: 200}});
  // panels converge under the chip, then settle side-by-side (offset → 0)
  const split = spring({frame: frame - 40, fps, config: {damping: 200}});
  const offset = interpolate(split, [0, 1], [380, 0]);
  const panelFade = interpolate(frame, [40, 64], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const chipFade = interpolate(frame, [40, 60], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  // resolve to type card
  const cardIn = interpolate(frame, [150, 168], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const headY = interpolate(frame, [150, 172], [24, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const sub = interpolate(frame, [168, 186], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{backgroundColor: bright.paper, justifyContent: 'center', alignItems: 'center'}}>
      {/* the two outputs, showing the SAME scroll */}
      <div style={{display: 'flex', gap: 40, opacity: panelFade, transform: `translateX(0px)`}}>
        <Panel label="WEBSITE" shift={offset} accent={bright.cognac} />
        <Panel label="LAUNCH FILM" shift={-offset} accent={bright.oxblood} highlight />
      </div>

      {/* json chip */}
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: chip * chipFade, transform: `scale(${interpolate(chip, [0, 1], [0.9, 1])})`}}>
        <div style={{fontFamily: mono, fontSize: 46, color: bright.ink, background: bright.card, border: `1.5px solid ${bright.line}`, borderRadius: 16, padding: '24px 40px', boxShadow: '0 24px 60px rgba(60,40,20,0.18)'}}>
          <span style={{color: bright.cognac}}>{'{ }'}</span> scroll-choreography.json
        </div>
      </AbsoluteFill>

      {/* resolve card */}
      <AbsoluteFill style={{backgroundColor: bright.paper, opacity: cardIn, justifyContent: 'center', alignItems: 'center', textAlign: 'center'}}>
        <div style={{fontFamily: grotesk, color: bright.ink, fontSize: 104, fontWeight: 700, letterSpacing: -2, transform: `translateY(${headY}px)`}}>
          One file. Both outputs.
        </div>
        <div style={{fontFamily: serif, color: bright.cognac, fontSize: 50, fontStyle: 'italic', marginTop: 12, opacity: sub}}>
          This very video was compiled from it.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Panel: React.FC<{label: string; shift: number; accent: string; highlight?: boolean}> = ({label, shift, accent, highlight}) => {
  const frame = useCurrentFrame();
  // identical scroll in both — proves the duality. Same source, same timing.
  return (
    <div style={{transform: `translateX(${shift}px)`}}>
      <div style={{width: 720, height: 460, borderRadius: 14, overflow: 'hidden', border: `2px solid ${highlight ? accent : bright.line}`, boxShadow: '0 30px 70px rgba(40,26,12,0.3)', position: 'relative'}}>
        <OffthreadVideo src={staticFile('footage/noir.mp4')} startFrom={0} playbackRate={1.0} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        <div style={{position: 'absolute', top: 14, left: 16, fontFamily: mono, fontSize: 24, fontWeight: 700, letterSpacing: 3, color: '#fff', background: 'rgba(10,12,15,0.7)', padding: '6px 14px', borderRadius: 6}}>
          {label}
        </div>
      </div>
    </div>
  );
};
