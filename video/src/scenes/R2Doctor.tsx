import React from 'react';
import {AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, interpolate} from 'remotion';
import {grotesk, mono} from '../fonts';
import {bright} from '../theme';

// R2 Act V — DOCTOR (180 frames). No text-only bridge: doctor.mp4 plays from
// frame 0. The "grades itself" message overlays the clip, then the lower-third
// details appear. Every frame has video — no slides.
export const R2Doctor: React.FC = () => {
  const frame = useCurrentFrame();
  const d = 180;

  const fade    = interpolate(frame, [0, 12, d - 16, d], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const bridge  = interpolate(frame, [8, 24], [0, 1],  {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const bridgeOut = interpolate(frame, [56, 74], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const cap     = interpolate(frame, [44, 60, d - 24, d - 10], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{backgroundColor: '#05080A', opacity: fade}}>
      <OffthreadVideo
        src={staticFile('doctor.mp4')}
        startFrom={270}
        muted
        style={{width: '100%', height: '100%', objectFit: 'cover'}}
      />

      <AbsoluteFill style={{background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 40%)', pointerEvents: 'none'}} />
      <AbsoluteFill style={{background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 25%)', pointerEvents: 'none'}} />

      {/* bridge overlay — sits in the lower third, BELOW the score bars so nothing overlaps */}
      <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', textAlign: 'center', paddingBottom: 178, opacity: bridge * bridgeOut}}>
        <div style={{fontFamily: mono, color: '#7FE9DA', fontSize: 26, letterSpacing: 7}}>AND IT GRADES ITSELF</div>
        <div style={{fontFamily: grotesk, color: '#fff', fontSize: 64, fontWeight: 700, letterSpacing: -1, marginTop: 10}}>
          Taste, as a <span style={{color: '#7388FF'}}>number you can gate on.</span>
        </div>
      </AbsoluteFill>

      {/* lower-third */}
      <div style={{position: 'absolute', left: 80, top: 78, opacity: cap}}>
        <div style={{fontFamily: mono, color: '#7FE9DA', fontSize: 26, fontWeight: 700, letterSpacing: 4}}>CINEMATIC-DOCTOR</div>
        <div style={{fontFamily: grotesk, color: '#fff', fontSize: 38, fontWeight: 600, marginTop: 6}}>
          auto-runs on every build · <span style={{color: '#7388FF'}}>below 80 fails CI</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
