import type { Metadata } from 'next';
import EffectsLab from '@/components/v3/EffectsLab';
import './lab.css';
import './rhythm.css';
export const metadata: Metadata = { title: 'Cinematic Scroll — React Effects Lab', description: 'Free text, proximity and shader components for cinematic websites.' };
export default function Page(){return <EffectsLab/>;}
