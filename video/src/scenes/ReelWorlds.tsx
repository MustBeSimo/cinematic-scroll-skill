import React from 'react';
import {AbsoluteFill, Series} from 'remotion';
import {WorldShot} from './WorldShot';

// 12–35s. The proof: five clashing aesthetics, all from one engine, ordered
// dark → warm → cold → hot → calm so every cut is a hard tonal jump.
// startFrom lands just after each scroll begins; playbackRate keeps the
// parallax/pinned-reveal motion energetic. Dynamism is the whole point.
const SHOT = 138; // frames per world (~4.6s)

// Each clip IS the full top→bottom scroll (~4.4–5.9s), so startFrom=0 and the
// playbackRate fills the 4.6s window with the entire page rushing past.
const WORLDS = [
  {src: 'footage/noir.mp4',        startFrom: 0, index: '01', title: 'VANTASCOPE',     name: 'Sci-fi noir',          accent: '#E8484F', rate: 1.07},
  {src: 'footage/renaissance.mp4', startFrom: 0, index: '02', title: 'CLASSIC TOUCH',  name: 'Renaissance editorial', accent: '#B6892F', rate: 1.07},
  {src: 'footage/studio.mp4',      startFrom: 0, index: '03', title: 'MAYA TORRES',    name: 'Brutalist portfolio',   accent: '#2D6BFF', rate: 0.96},
  {src: 'footage/pop.mp4',         startFrom: 0, index: '04', title: 'BLOOM',          name: 'Gen-Z pop',             accent: '#FF2E93', rate: 0.96},
  {src: 'footage/luxe.mp4',        startFrom: 0, index: '05', title: 'MAISON SOLENNE', name: 'Quiet luxury',          accent: '#A4652F', rate: 1.28},
];

export const ReelWorlds: React.FC = () => (
  <Series>
    {WORLDS.map((w) => (
      <Series.Sequence key={w.src} durationInFrames={SHOT}>
        <WorldShot
          src={w.src}
          startFrom={w.startFrom}
          index={w.index}
          title={w.title}
          name={w.name}
          accent={w.accent}
          durationInFrames={SHOT}
          playbackRate={w.rate}
        />
      </Series.Sequence>
    ))}
  </Series>
);
