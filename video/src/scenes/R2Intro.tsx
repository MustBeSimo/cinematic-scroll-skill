import React from 'react';
import {AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, interpolate, spring, useVideoConfig} from 'remotion';
import {grotesk, mono, serif} from '../fonts';
import {bright} from '../theme';

// R2 Act I — DUALITY (200 frames). Video visible from frame 0 — no lead-in chip.
// Both panels play different footage so it never reads as one clip repeated.
export const R2Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const panels = spring({frame, fps, config: {damping: 200}});
  const offset  = interpolate(panels, [0, 1], [320, 0]);
  const label   = interpolate(frame, [30, 50], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const headline = interpolate(frame, [120, 142], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const headY    = interpolate(frame, [120, 144], [22, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const sub      = interpolate(frame, [148, 168], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{backgroundColor: bright.paper, justifyContent: 'center', alignItems: 'center'}}>
      {/* Two panels — different footage from frame 0 */}
      <div style={{display: 'flex', gap: 40}}>
        <Panel label="WEBSITE"     kind="browser" shift={offset}  footage="footage/pop.mp4"  accent={bright.cognac} frame={frame} />
        <Panel label="LAUNCH FILM" kind="player"  shift={-offset} footage="footage/studio.mp4" accent={bright.oxblood} highlight frame={frame} />
      </div>

      {/* labels */}
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', pointerEvents: 'none'}}>
        <div style={{fontFamily: mono, fontSize: 22, letterSpacing: 6, color: bright.cognac, opacity: label, marginBottom: 420}}>
          ONE <span style={{color: bright.ink}}>{'{ }'}</span> scroll-choreography.json
        </div>
      </AbsoluteFill>

      {/* resolve headline */}
      <AbsoluteFill style={{backgroundColor: bright.paper, opacity: headline, justifyContent: 'center', alignItems: 'center', textAlign: 'center'}}>
        <div style={{fontFamily: grotesk, color: bright.ink, fontSize: 100, fontWeight: 700, letterSpacing: -2, transform: `translateY(${headY}px)`}}>
          One file. Both outputs.
        </div>
        <div style={{fontFamily: serif, color: bright.cognac, fontSize: 48, fontStyle: 'italic', marginTop: 12, opacity: sub}}>
          This very video was compiled from it.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Panel: React.FC<{label: string; kind: 'browser' | 'player'; shift: number; footage: string; accent: string; highlight?: boolean; frame: number}> =
  ({label, kind, shift, footage, accent, highlight, frame}) => {
  const chrome = 44;
  return (
    <div style={{transform: `translateX(${shift}px)`}}>
      <div style={{width: 720, borderRadius: 14, overflow: 'hidden', border: `2px solid ${highlight ? accent : bright.line}`, boxShadow: '0 30px 70px rgba(40,26,12,0.3)', background: '#0d0f12'}}>
        {kind === 'browser' && (
          <div style={{height: chrome, display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', background: '#1a1d22'}}>
            <span style={{width: 11, height: 11, borderRadius: 11, background: '#ff5f57'}} />
            <span style={{width: 11, height: 11, borderRadius: 11, background: '#febc2e'}} />
            <span style={{width: 11, height: 11, borderRadius: 11, background: '#28c840'}} />
            <span style={{flex: 1, marginLeft: 12, height: 22, borderRadius: 11, background: '#0d0f12', fontFamily: mono, fontSize: 14, color: '#8b97a2', display: 'flex', alignItems: 'center', paddingLeft: 14}}>bloom.app</span>
          </div>
        )}
        <div style={{height: 412, overflow: 'hidden', position: 'relative'}}>
          <OffthreadVideo
            src={staticFile(footage)}
            startFrom={0}
            playbackRate={1.3}
            muted
            style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(1.28) translateY(${interpolate(frame, [0, 200], [52, -52], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}px)`}}
          />
          <div style={{position: 'absolute', top: 14, left: 16, fontFamily: mono, fontSize: 22, fontWeight: 700, letterSpacing: 3, color: '#fff', background: 'rgba(10,12,15,0.7)', padding: '6px 14px', borderRadius: 6}}>{label}</div>
        </div>
        {kind === 'player' && (
          <div style={{height: chrome, display: 'flex', alignItems: 'center', gap: 14, padding: '0 18px', background: '#1a1d22'}}>
            <span style={{fontSize: 16, color: '#fff'}}>▶</span>
            <span style={{flex: 1, height: 5, borderRadius: 5, background: '#3a3f47', position: 'relative'}}>
              <span style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${interpolate(frame, [0, 200], [4, 82], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}%`, background: accent, borderRadius: 5}} />
            </span>
            <span style={{fontFamily: mono, fontSize: 14, color: '#8b97a2'}}>0:42 / 0:60</span>
          </div>
        )}
      </div>
    </div>
  );
};
