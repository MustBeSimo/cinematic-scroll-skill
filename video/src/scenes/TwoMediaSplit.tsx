import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {theme} from '../theme';
import {grotesk, mono, serif} from '../fonts';
import {Caption} from '../components/Caption';

// Split screen — THE PAGE (scroll playhead) vs THE FILM (clock playhead).
// Both panes render the SAME chapters from the SAME progress value: the point.
const EASE = Easing.bezier(0.16, 1, 0.3, 1);
const CHAPTERS = [
  {t: 'Quiet is the new luxury.', bg: '#0d0d0d', ink: '#f5f0e8', img: 'luxe.png'},
  {t: 'The Philosophy of Restraint', bg: '#f5f0e8', ink: '#1a1a1a', img: 'organic.png'},
  {t: 'The Collection', bg: '#c9a962', ink: '#1a1208', img: 'retro.png'},
];

const Pane: React.FC<{p: number; label: string; playhead: string; right?: boolean}> = ({p, label, playhead, right}) => {
  const idx = Math.min(CHAPTERS.length - 1, Math.floor(p * CHAPTERS.length));
  const local = (p * CHAPTERS.length) % 1;
  const ch = CHAPTERS[idx];
  const reveal = interpolate(local, [0.05, 0.45], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE});
  const drift = (0.5 - local) * 60;
  return (
    <div style={{flex: 1, position: 'relative', overflow: 'hidden', background: ch.bg, borderLeft: right ? `1px solid ${theme.line}` : 'none'}}>
      {/* world still + readability scrim — same image in both panes, parallax drift */}
      <div style={{position: 'absolute', right: '-6%', top: '6%', width: '62%', height: '88%', borderRadius: 6, overflow: 'hidden', opacity: 0.55 + 0.45 * reveal, transform: `translateY(${drift * 0.4}px)`}}>
        <Img src={staticFile(ch.img)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </div>
      <div style={{position: 'absolute', inset: 0, background: `linear-gradient(100deg, ${ch.bg} 34%, ${ch.bg}D9 52%, transparent 80%)`}} />
      {/* chapter content — identical math in both panes */}
      <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 70}}>
        <div style={{fontFamily: mono, fontSize: 15, letterSpacing: '0.3em', color: ch.ink, opacity: 0.55 * reveal}}>
          CHAPTER {String(idx + 1).padStart(2, '0')} / 03
        </div>
        <div style={{
          fontFamily: serif, fontWeight: 600, fontSize: 58, lineHeight: 1.05, color: ch.ink,
          marginTop: 18, maxWidth: '85%', opacity: reveal,
          transform: `translateY(${(1 - reveal) * 36 + drift * 0.2}px)`,
        }}>{ch.t}</div>
        <div style={{width: 120 * reveal, height: 3, background: ch.ink, opacity: 0.7, marginTop: 26}} />
      </div>
      {/* the playhead — the only thing that differs */}
      <div style={{position: 'absolute', top: 28, left: 34, right: 34, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <span style={{fontFamily: mono, fontSize: 17, letterSpacing: '0.26em', color: ch.ink, opacity: 0.8}}>{label}</span>
        <span style={{fontFamily: mono, fontSize: 17, color: ch.ink, opacity: 0.8}}>{playhead}</span>
      </div>
      {right ? (
        /* film: bottom timeline bar */
        <div style={{position: 'absolute', bottom: 30, left: 34, right: 34, height: 4, background: `${ch.ink}33`}}>
          <div style={{width: `${p * 100}%`, height: '100%', background: ch.ink, opacity: 0.85}} />
        </div>
      ) : (
        /* page: right scrollbar thumb */
        <div style={{position: 'absolute', top: 70, bottom: 70, right: 12, width: 5, background: `${ch.ink}26`, borderRadius: 3}}>
          <div style={{position: 'absolute', top: `${p * 78}%`, width: '100%', height: '22%', background: ch.ink, opacity: 0.8, borderRadius: 3}} />
        </div>
      )}
    </div>
  );
};

export const TwoMediaSplit: React.FC = () => {
  const f = useCurrentFrame();
  const {durationInFrames, fps} = useVideoConfig();
  const p = interpolate(f, [15, durationInFrames - 20], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const secs = (p * 12).toFixed(1).padStart(4, '0');
  const intro = interpolate(f, [0, 18], [0, 1], {extrapolateRight: 'clamp', easing: EASE});
  return (
    <AbsoluteFill style={{background: theme.bgDeep}}>
      <div style={{position: 'absolute', inset: '90px 80px 120px', display: 'flex', borderRadius: 14, overflow: 'hidden', border: `1px solid ${theme.line}`, opacity: intro, transform: `scale(${0.97 + intro * 0.03})`}}>
        <Pane p={p} label="THE PAGE" playhead={`scroll ${Math.round(p * 100)}%`} />
        <Pane p={p} label="THE FILM" playhead={`00:${secs}`} right />
      </div>
      <div style={{position: 'absolute', top: 34, width: '100%', textAlign: 'center', fontFamily: grotesk, fontSize: 25, color: theme.sub}}>
        Same beats. Same easings. <span style={{color: theme.teal}}>Two playheads.</span>
      </div>
      <Caption text="The reader's finger drives the page — the clock drives the film" dur={9999} />
    </AbsoluteFill>
  );
};
