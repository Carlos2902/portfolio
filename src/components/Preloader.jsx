import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useProgress } from "@react-three/drei";
import { useMotion } from "../lib/motion";

const MIN_DURATION = 1.6; // seconds; keeps the count readable even when everything is cached
const FAILSAFE = 12000; // ms; never trap visitors behind the loader

// 0–100% counter while the 3D logo and fonts load, then a curtain lifts off the page.
const Preloader = ({ modelReady, onDone }) => {
  const { reduced } = useMotion();
  const { progress } = useProgress();
  const [count, setCount] = useState(0);
  const [fontsReady, setFontsReady] = useState(false);
  const [forced, setForced] = useState(false);
  const [gone, setGone] = useState(false);
  const root = useRef(null);
  const counter = useRef({ value: 0 });
  const startedAt = useRef(performance.now());
  const exiting = useRef(false);

  useEffect(() => {
    let alive = true;
    (document.fonts?.ready ?? Promise.resolve()).then(() => alive && setFontsReady(true));
    const timer = setTimeout(() => setForced(true), FAILSAFE);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, []);

  const done = forced || (modelReady && fontsReady);
  const target = done ? 100 : Math.min(progress, 100) * 0.9;

  useEffect(() => {
    const elapsed = (performance.now() - startedAt.current) / 1000;
    const tween = gsap.to(counter.current, {
      value: target,
      duration: done ? Math.max(0.6, MIN_DURATION - elapsed) : 0.8,
      ease: done ? "power2.inOut" : "power2.out",
      onUpdate: () => setCount(Math.round(counter.current.value)),
      onComplete: () => {
        if (!done || exiting.current) return;
        exiting.current = true;
        const el = root.current;
        if (reduced) {
          onDone();
          gsap.to(el, { autoAlpha: 0, duration: 0.3, onComplete: () => setGone(true) });
          return;
        }
        gsap
          .timeline({ onComplete: () => setGone(true) })
          .to(el.querySelectorAll("[data-preloader-fade]"), { yPercent: -120, autoAlpha: 0, duration: 0.6, ease: "power3.in", stagger: 0.05 })
          .add(onDone, "-=0.1")
          .to(el, { yPercent: -100, duration: 1.1, ease: "expo.inOut" }, "<");
      },
    });
    return () => tween.kill();
  }, [target, done, reduced, onDone]);

  if (gone) return null;

  return (
    <div
      ref={root}
      className="fixed inset-0 z-[100] flex flex-col justify-between bg-ink page-x py-8 text-paper"
      role="progressbar"
      aria-label="Loading"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={count}
    >
      <div className="flex items-center justify-between overflow-hidden">
        <p data-preloader-fade className="eyebrow">Carlos Lopez</p>
        <p data-preloader-fade className="eyebrow">Portfolio ©2026</p>
      </div>

      <div className="overflow-hidden">
        <div data-preloader-fade className="flex items-end justify-between gap-6">
          <p className="font-serif text-2xl italic text-white/60 sm:text-3xl">Loading the experience</p>
          <p className="font-semibold leading-[0.8] tabular-nums tracking-[-0.05em] text-[clamp(5rem,18vw,15rem)]">
            {count}
            <span className="align-top text-[0.3em] tracking-normal text-white/50">%</span>
          </p>
        </div>
        <div className="mt-6 h-px w-full bg-white/10">
          <div className="h-full origin-left bg-paper" style={{ transform: `scaleX(${count / 100})` }} />
        </div>
      </div>
    </div>
  );
};

export default Preloader;
