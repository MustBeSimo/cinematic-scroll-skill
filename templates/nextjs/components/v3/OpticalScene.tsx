'use client';
import {useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {Bloom,EffectComposer,Vignette} from '@react-three/postprocessing';
import * as THREE from 'three';
import {CinematicCanvas,ScrollCameraRig} from '@/lib/cinematic/three';
import {useCinematicQuality,useCinematicRuntime} from '@/lib/cinematic/react';
import {QUALITY,seededRandom} from '@/lib/cinematic/core.mjs';
import OpticalPoster from './OpticalPoster';
const cameraPath:[number,number,number][]=[[0,.6,6.8],[1.6,.9,5.8],[-1,.3,5.2],[0,.6,6.8]];
function Instrument({aperture}:{aperture:number}){
  const root=useRef<THREE.Group>(null),runtime=useCinematicRuntime(),tier=useCinematicQuality(),budget=QUALITY[tier];
  const particles=useMemo(()=>{const random=seededRandom(302),data=new Float32Array(360*3);for(let i=0;i<360;i++){data[i*3]=(random()-.5)*8;data[i*3+1]=(random()-.5)*6;data[i*3+2]=(random()-.5)*6;}return data;},[]);
  useFrame(()=>{if(root.current&&runtime){const s=runtime.signals;root.current.rotation.y=s.reducedMotion?0:s.scroll.progress*Math.PI*.75;root.current.rotation.z=-.18;}});
  return <>
    <ScrollCameraRig points={cameraPath} pointerStrength={.12}/>
    <group ref={root}>
      {[1.45,1.2,.96].map((radius,i)=><mesh key={radius} castShadow position={[0,0,(i-1)*(.25+aperture*.35)]} rotation={[i*.15,0,i*.1]}>
        <torusGeometry args={[radius,.055+i*.012,12,80]}/><meshStandardMaterial color={i===1?'#8a7cff':'#b6c9ed'} metalness={.85} roughness={.24}/>
      </mesh>)}
      <mesh castShadow scale={[1,1,.28]}><sphereGeometry args={[.85,40,24]}/><meshPhysicalMaterial color="#9faeff" metalness={.1} roughness={.13} transmission={tier==='high'?.65:tier==='balanced'?.3:0} transparent={false} thickness={.4} ior={1.4} clearcoat={1}/></mesh>
      <mesh position={[0,0,-.4]} rotation={[0,Math.PI/4,0]} scale={.3+aperture*.3}><octahedronGeometry/><meshStandardMaterial color="#8c9cff" emissive="#4760c8" emissiveIntensity={1.3} metalness={.5} roughness={.2}/></mesh>
    </group>
    <points frustumCulled={false}><bufferGeometry drawRange={{start:0,count:Math.floor(360*budget.particles)}}><bufferAttribute attach="attributes-position" args={[particles,3]}/></bufferGeometry><pointsMaterial color="#9db6ff" size={.015} transparent opacity={.45} depthWrite={false}/></points>
    <directionalLight position={[3,4,3]} intensity={2} castShadow={budget.shadowSize>0} shadow-mapSize={[budget.shadowSize||1,budget.shadowSize||1]} shadow-bias={-.0001}/>
    <mesh position={[0,-1.8,0]} rotation={[-Math.PI/2,0,0]} receiveShadow><planeGeometry args={[20,20]}/><shadowMaterial color="#041028" transparent opacity={.25}/></mesh>
    {budget.post!=='none'&&<EffectComposer multisampling={tier==='high'?4:2}><Bloom intensity={tier==='high'?.4:.2} luminanceThreshold={1.1} mipmapBlur/>{tier==='high'?<Vignette offset={.3} darkness={.4}/>:<></>}</EffectComposer>}
  </>;
}
export default function OpticalScene({aperture}:{aperture:number}){return <CinematicCanvas className="optical-scene" shadows poster={<OpticalPoster/>}><Instrument aperture={aperture}/></CinematicCanvas>;}
