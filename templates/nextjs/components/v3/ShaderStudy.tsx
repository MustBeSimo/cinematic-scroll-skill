'use client';
import { CinematicCanvas, DistortedMedia } from '@/lib/cinematic/three';
export default function ShaderStudy({ preset }: { preset: 'displacement'|'refraction'|'atmosphere'|'portal' }) {
  return <CinematicCanvas continuous={preset === 'atmosphere'} className="v3-scene" poster={<div className="v3-poster" role="img" aria-label="Blue and violet atmospheric field"/>}>
    <DistortedMedia preset={preset} width={6.2} height={4.4}/>
  </CinematicCanvas>;
}
