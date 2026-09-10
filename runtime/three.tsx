'use client';

import { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import { useCinematicRuntime } from './react';
import type { CinematicRuntime, QualityTier } from './cinematic.mjs';
import { QUALITY, clamp } from './core.mjs';
import { fragmentShader } from './shaders.mjs';

type SceneDiagnostics = { frames: number; draws: number; triangles: number; textures: number; geometries: number; quality: QualityTier };
class SceneBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

/** A shared R3F host. Its permanent DOM poster also covers initial shader compilation. */
export function CinematicCanvas({ children, poster, className, continuous = false, shadows = false, onDiagnostics }: {
  children: ReactNode; poster: ReactNode; className?: string; continuous?: boolean; shadows?: boolean; onDiagnostics?: (info: SceneDiagnostics) => void;
}) {
  const runtime = useCinematicRuntime(), root = useRef<HTMLDivElement>(null);
  const [supported, setSupported] = useState(false), [ready, setReady] = useState(false), [lost, setLost] = useState(false);
  const [visible, setVisible] = useState(true), [quality, setQuality] = useState<QualityTier>('balanced');
  useEffect(() => {
    const test = document.createElement('canvas');
    const context = test.getContext('webgl2');
    setSupported(!!context); context?.getExtension('WEBGL_lose_context')?.loseContext();
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    if (root.current) observer.observe(root.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!runtime) return;
    let last = runtime.signals.quality; setQuality(last);
    return runtime.subscribe(s => { if (last !== s.quality) { last = s.quality; setQuality(last); } });
  }, [runtime]);
  useEffect(() => {
    if (!runtime || !continuous || !visible || lost || quality === 'static') return;
    return runtime.continuous(root.current);
  }, [runtime, continuous, visible, lost, quality]);
  return <div ref={root} className={className} data-cinematic-quality={quality} style={{ position: 'relative', minHeight: 300 }}>
    <div style={{ position: 'absolute', inset: 0 }}>{poster}</div>
    {supported && runtime && <SceneBoundary fallback={poster}>
      <div data-cinematic-render style={{ position: 'absolute', inset: 0, opacity: ready && !lost && quality !== 'static' ? 1 : 0 }} aria-hidden="true">
        <Canvas frameloop="demand" shadows={shadows && QUALITY[quality].shadowSize > 0} dpr={[.75, QUALITY[quality].dpr]} camera={{ position: [0,0,5], fov: 40 }}
          gl={{ antialias: false, alpha: true, powerPreference: 'default', toneMapping: THREE.ACESFilmicToneMapping, outputColorSpace: THREE.SRGBColorSpace }}>
          <SceneLifecycle runtime={runtime} visible={visible} lost={lost} setLost={setLost} onReady={() => setReady(true)} onDiagnostics={onDiagnostics}/>
          <Suspense fallback={null}>
            <Environment resolution={128} frames={1}>
              <Lightformer intensity={2.5} position={[0,4,0]} rotation={[-Math.PI/2,0,0]} scale={[6,3,1]} />
              <Lightformer intensity={1} color="#769dff" position={[-4,1,0]} rotation={[0,Math.PI/2,0]} scale={[4,3,1]} />
            </Environment>
            <ambientLight intensity={.25}/><directionalLight intensity={2} position={[3,4,5]}/>
            {children}
          </Suspense>
        </Canvas>
      </div>
    </SceneBoundary>}
  </div>;
}

function SceneLifecycle({ runtime, visible, lost, setLost, onReady, onDiagnostics }: {
  runtime: CinematicRuntime; visible: boolean; lost: boolean; setLost: (lost: boolean) => void; onReady: () => void; onDiagnostics?: (info: SceneDiagnostics) => void;
}) {
  const { gl, invalidate, scene, camera } = useThree(), frames = useRef(0), callbacks = useRef({onReady,onDiagnostics});
  callbacks.current = {onReady,onDiagnostics};
  useEffect(() => {
    let cancelled = false;
    const compile = async () => {
      try { await gl.compileAsync(scene,camera); if (!cancelled) { callbacks.current.onReady(); invalidate(); } }
      catch { if (!cancelled) setLost(true); }
    };
    void compile();
    const lostEvent = (event: Event) => { event.preventDefault(); setLost(true); };
    const restored = () => { setLost(false); void compile(); };
    gl.domElement.addEventListener('webglcontextlost',lostEvent); gl.domElement.addEventListener('webglcontextrestored',restored);
    return () => { cancelled = true; gl.domElement.removeEventListener('webglcontextlost',lostEvent); gl.domElement.removeEventListener('webglcontextrestored',restored); };
  }, [gl,scene,camera,invalidate,setLost]);
  useEffect(() => runtime.subscribe(s => {
    if (visible && !lost && s.visible && s.quality !== 'static') invalidate();
  }), [runtime,visible,lost,invalidate]);
  useFrame(() => {
    frames.current++;
    if (frames.current % 30 === 0) callbacks.current.onDiagnostics?.({ frames: frames.current, draws: gl.info.render.calls, triangles: gl.info.render.triangles, textures: gl.info.memory.textures, geometries: gl.info.memory.geometries, quality: runtime.signals.quality });
  });
  return null;
}

/** Scroll moves the camera directly. Pointer parallax is a bounded additive offset. */
export function ScrollCameraRig({ points, lookAt = [0,0,0], range = [0,1], pointerStrength = .18 }: {
  points: [number,number,number][]; lookAt?: [number,number,number]; range?: [number,number]; pointerStrength?: number;
}) {
  const runtime = useCinematicRuntime();
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))), [points]);
  const target = useMemo(() => new THREE.Vector3(...lookAt), [lookAt]);
  useFrame(({camera,gl}) => {
    if (!runtime || points.length < 2 || gl.xr.isPresenting) return;
    const s = runtime.signals;
    const progress = s.reducedMotion ? .3 : clamp((s.scroll.progress-range[0])/Math.max(.001,range[1]-range[0]));
    curve.getPointAt(progress,camera.position);
    if (s.pointer.active && !s.reducedMotion) { camera.position.x += s.pointer.normalizedX*pointerStrength; camera.position.y -= s.pointer.normalizedY*pointerStrength; }
    camera.lookAt(target);
  });
  return null;
}

/** Shader media inside the shared Canvas. Pass an already-loaded, owned texture. */
export function DistortedMedia({ preset = 'displacement', texture, width = 4, height = 3, colorA = '#09112b', colorB = '#608dff' }: {
  preset?: 'displacement'|'refraction'|'atmosphere'|'portal'; texture?: THREE.Texture; width?: number; height?: number; colorA?: string; colorB?: string;
}) {
  const runtime = useCinematicRuntime();
  const material = useMemo(() => new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    vertexShader: 'out vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: fragmentShader(preset).replace('#version 300 es','').replace(/\}\s*$/, '\n#ifdef TONE_MAPPING\noutColor.rgb=toneMapping(outColor.rgb);\n#endif\noutColor=linearToOutputTexel(outColor);\n}'),
    uniforms: {
      uTime:{value:0},uProgress:{value:0},uVelocity:{value:0},uProximity:{value:0},uQuality:{value:2},uReducedMotion:{value:0},
      uHasTexture:{value:texture?1:0},uPointer:{value:new THREE.Vector2(.5,.5)},uResolution:{value:new THREE.Vector2(width,height)},
      uImageSize:{value:new THREE.Vector2((texture?.image as {width?:number})?.width||1,(texture?.image as {height?:number})?.height||1)},uTexture:{value:texture||null},
      uColorA:{value:new THREE.Color(colorA)},uColorB:{value:new THREE.Color(colorB)},uRadiusX:{value:new THREE.Vector4()},uRadiusY:{value:new THREE.Vector4()},
    },
  }), [preset,texture,width,height,colorA,colorB]);
  useEffect(() => () => material.dispose(), [material]);
  useFrame(({pointer}) => {
    if (!runtime) return;
    const s = runtime.signals, u = material.uniforms;
    u.uTime.value=s.reducedMotion?0:s.time;u.uProgress.value=s.scroll.progress;u.uVelocity.value=clamp(s.scroll.velocity/2000,-1,1);
    u.uReducedMotion.value=Number(s.reducedMotion);u.uProximity.value=Number(s.pointer.active);u.uPointer.value.set(pointer.x*.5+.5,pointer.y*.5+.5);
    u.uQuality.value={high:3,balanced:2,low:1,static:0}[s.quality];
  });
  return <mesh><planeGeometry args={[width,height]}/><primitive object={material} attach="material"/></mesh>;
}
