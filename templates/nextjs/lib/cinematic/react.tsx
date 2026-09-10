'use client';

import { cloneElement, isValidElement, createContext, useContext, useEffect, useRef, useState, type ReactNode, type RefObject, type Ref, type CSSProperties } from 'react';
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createCinematicRuntime, type CinematicRuntime, type CinematicSignals, type ProximityValue, type RuntimeOptions, type QualityTier } from './cinematic.mjs';
import { mountProximity, mountText, type TextVariant } from './effects.mjs';

gsap.registerPlugin(SplitText, ScrollTrigger);
const Context = createContext<CinematicRuntime | null | undefined>(undefined);

/** Compatibility boundary; an existing provider is reused, never nested. */
export function CinematicScope({children}:{children:ReactNode}) {
  return useContext(Context)===undefined ? <CinematicProvider>{children}</CinematicProvider> : children;
}

export function CinematicProvider({ children, options }: { children: ReactNode; options?: RuntimeOptions }) {
  const [runtime, setRuntime] = useState<CinematicRuntime | null>(null);
  const settings = useRef(options);
  useEffect(() => {
    // Reuse GSAP's clock, attaching only while the runtime has work to do.
    // Explicit external-clock callers retain ownership of tick() and onWake.
    let attached = false;
    let instance: CinematicRuntime | undefined;
    const frame = () => { if (!instance?.tick(performance.now())) { gsap.ticker.remove(frame); attached = false; } };
    const wake = () => { if (instance && !attached) { attached = true; gsap.ticker.add(frame); } };
    instance = createCinematicRuntime(document, settings.current?.clock === 'external'
      ? settings.current : { ...settings.current, clock: 'external', onWake: wake });
    setRuntime(instance);
    instance.wake();
    return () => { gsap.ticker.remove(frame); instance?.dispose(); };
  }, []);
  return <Context.Provider value={runtime}>{children}</Context.Provider>;
}

export function useCinematicRuntime() { return useContext(Context); }

/** React commits only when the tier changes, never for every frame. */
export function useCinematicQuality() {
  const runtime=useContext(Context),[tier,setTier]=useState<QualityTier>('balanced');
  useEffect(()=>{
    if(!runtime)return;
    let previous=runtime.signals.quality;setTier(previous);
    return runtime.subscribe(s=>{if(previous!==s.quality){previous=s.quality;setTier(previous);}});
  },[runtime]);
  return tier;
}

/** Imperative signals avoid React commits on every scroll/pointer frame. */
export function useCinematicSignals(onFrame?: (signals: CinematicSignals) => boolean | void) {
  const runtime = useContext(Context), latest = useRef<CinematicSignals | null>(null), callback = useRef(onFrame);
  callback.current = onFrame;
  useEffect(() => {
    if (!runtime) return;
    latest.current = runtime.signals;
    return runtime.subscribe(s => { latest.current = s; return callback.current?.(s); });
  }, [runtime]);
  return latest;
}

export function useProximity(ref: RefObject<HTMLElement | null>, options: { radius?: number } = {}) {
  const runtime = useContext(Context), value = useRef<ProximityValue>({ amount: 0, x: 0, y: 0, distance: Infinity });
  useEffect(() => {
    if (!runtime || !ref.current) return;
    const target = runtime.track(ref.current, { radius: options.radius });
    const unsubscribe = runtime.subscribe(() => { value.current = target.current; });
    return () => { unsubscribe(); target.dispose(); };
  }, [runtime, ref, options.radius]);
  return value;
}

export function MagneticSurface({ children, className, variant = 'magnetic', radius = 120, strength = 12 }: {
  children: ReactNode; className?: string; variant?: 'magnetic' | 'depth'; radius?: number; strength?: number;
}) {
  const ref = useRef<HTMLElement>(null), runtime = useContext(Context);
  useEffect(() => {
    if (!runtime || !ref.current) return;
    return mountProximity(ref.current, runtime, { variant, radius, strength });
  }, [runtime, variant, radius, strength]);
  // Keep native controls stationary: only their contents move, never the hit box.
  if (isValidElement<{children?:ReactNode;className?:string;style?:CSSProperties;ref?:Ref<HTMLElement>}>(children)
    && (children.type === 'a' || children.type === 'button')) {
    const child = children;
    return cloneElement(child, {
      ref: (node: HTMLElement | null) => {
        ref.current=node;
        const previous=child.props.ref;
        if(typeof previous==='function')previous(node);else if(previous)previous.current=node;
      },
      className:[child.props.className,className].filter(Boolean).join(' '),
      children:<span data-proximity-visual style={{display:'inline-block'}}>{child.props.children}</span>,
    });
  }
  return <span ref={ref as RefObject<HTMLSpanElement>} className={className} style={{ display: 'inline-block' }}>
    <span data-proximity-visual style={{ display: 'inline-block' }}>{children}</span>
  </span>;
}

export function TextChoreography({ children, as: Tag = 'h2', variant = 'line-mask', className, duration = .85 }: {
  children: string; as?: 'h1' | 'h2' | 'h3' | 'p' | 'span'; variant?: TextVariant; className?: string; duration?: number;
}) {
  const ref = useRef<HTMLElement>(null), runtime = useContext(Context);
  useEffect(() => {
    const element = ref.current;
    if (!runtime || !element) return;
    if (!['line-mask','word-cascade','character-wave'].includes(variant)) return mountText(element, runtime, { variant, duration });
    let split: ReturnType<typeof SplitText.create> | undefined;
    let enabled: boolean | undefined;
    const update = () => {
      const next = !runtime.signals.reducedMotion && runtime.signals.quality !== 'static';
      if (next === enabled) return;
      enabled = next;
      split?.revert(); split = undefined;
      if (!next) return;
      split = SplitText.create(element, {
        type: variant === 'character-wave' ? 'words,chars' : 'lines,words',
        mask: variant === 'line-mask' ? 'lines' : undefined,
        autoSplit: true,
        onSplit(self) {
          const targets = variant === 'character-wave' ? self.chars : variant === 'line-mask' ? self.lines : self.words;
          return gsap.from(targets, {
            yPercent: 105, opacity: 0, rotation: variant === 'character-wave' ? 8 : 0,
            duration, stagger: { amount: .3 }, ease: 'power3.out',
            scrollTrigger: { trigger: element, start: 'top 90%', once: true },
            onComplete: () => runtime.refresh(),
          });
        },
      });
    };
    update();
    const unsubscribe = runtime.subscribe(update);
    return () => { unsubscribe(); split?.revert(); };
  }, [runtime, children, variant, duration]);
  return <Tag ref={ref as RefObject<never>} className={className}>{children}</Tag>;
}
