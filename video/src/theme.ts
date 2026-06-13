// Bright editorial palette — warm cream, ink, cognac. The Reel's framing
// (hook, prompt, labels, two-media, end) uses this for a fresh, premium,
// "advertisy" tone; the live-world footage supplies the colour.
export const bright = {
  paper: '#F3EBDB',
  paperDeep: '#EBE0CD',
  card: '#FCF7ED',
  ink: '#241B12',
  inkSoft: '#7C6A52',
  cognac: '#A4652F',
  brass: '#B6892F',
  oxblood: '#8A382E',
  sage: '#6F7A57',
  line: 'rgba(80,58,34,0.20)',
} as const;

// Noir / Petroleum palette — matches the social card + the noir live example.
export const theme = {
  bgDeep: '#04070a',
  bg: '#070b0d',
  teal: '#5ED6C6',
  tealDim: '#2c6f6a',
  fog: 'rgba(46,122,118,0.40)',
  crimson: '#E8484F',
  warm: '#F5F3EE',
  sub: '#9FB2B2',
  line: 'rgba(120,150,150,0.22)',
} as const;

// Per-world looks for the montage. The motion is the constant; these are the variable.
export const worlds = [
  {id: 'renaissance', label: '① Renaissance', title: 'CLASSIC TOUCH', bg: 'radial-gradient(120% 120% at 30% 20%, #3a2618 0%, #1c130b 70%)', accent: '#C9A227', ink: '#F3E7CE', serif: true},
  {id: 'brutalist', label: '② Brutalist', title: 'MAYA TORRES', bg: 'linear-gradient(180deg,#0b0b0c,#161618)', accent: '#2D6BFF', ink: '#F4F5F7', serif: false},
  {id: 'luxe', label: '④ Quiet luxury', title: 'MAISON SOLENNE', bg: 'linear-gradient(180deg,#efe7da,#e3d6c4)', accent: '#9C6B4A', ink: '#2a2018', serif: true},
  {id: 'pop', label: '⑤ Gen-Z pop', title: 'BLOOM', bg: 'linear-gradient(135deg,#ff5fa2 0%,#ff9f43 50%,#c6f432 100%)', accent: '#1a1a2e', ink: '#1a1a2e', serif: false},
  {id: 'wellness', label: '⑥ Wellness', title: 'NATURALLY ROOTED', bg: 'radial-gradient(120% 120% at 70% 20%, #f6ede6 0%, #e6d8cf 70%)', accent: '#7C9A6E', ink: '#39463a', serif: true},
] as const;
