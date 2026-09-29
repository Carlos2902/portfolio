import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useProgress } from "@react-three/drei";
import { useMotion } from "../lib/motion";
import outline from "../assets/logo-c-outline.png";
import fill from "../assets/logo-c-fill.png";

const MIN_DURATION = 1.6; // seconds; keeps the fill readable even when everything is cached
const FAILSAFE = 12000; // ms; never trap visitors behind the loader
// Loaders report per file, not per byte, so the fill also creeps up over time (easing toward 85%)
// and only completes once everything has actually loaded.
const creepAt = (seconds) => 85 * (1 - Math.exp(-seconds / 2.4));

// The logo drawn as an outline fills with white from the bottom while the 3D logo and fonts load,
// then a curtain lifts off the page.
const Preloader = ({ modelReady, onDone }) => {
  const { reduced } = useMotion();
  const { progress } = useProgress();
  const [level, setLevel] = useState(0);
  const [fontsReady, setFontsReady] = useState(false);
  const [forced, setForced] = useState(false);
  const [creep, setCreep] = useState(0);
  const [gone, setGone] = useState(false);
  const root = useRef(null);
  const logo = useRef(null);
  const counter = useRef({ value: 0 });
  const startedAt = useRef(performance.now());
  const exiting = useRef(false);

  useEffect(() => {
    let alive = true;
    (document.fonts?.ready ?? Promise.resolve()).then(() => alive && setFontsReady(true));
    const timer = setTimeout(() => setForced(true), FAILSAFE);
    const ticker = setInterval(() => setCreep(creepAt((performance.now() - startedAt.current) / 1000)), 250);
    return () => {
      alive = false;
      clearTimeout(timer);
      clearInterval(ticker);
    };
  }, []);

  const done = forced || (modelReady && fontsReady);
  const target = done ? 100 : Math.max(creep, Math.min(progress, 100) * 0.9);

  useEffect(() => {
    const elapsed = (performance.now() - startedAt.current) / 1000;
    const tween = gsap.to(counter.current, {
      value: target,
      duration: done ? Math.max(0.6, MIN_DURATION - elapsed) : 0.8,
      ease: done ? "power2.inOut" : "power2.out",
      onUpdate: () => setLevel(counter.current.value),
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
          .to(logo.current, { scale: 1.08, autoAlpha: 0, duration: 0.7, ease: "power3.in", delay: 0.15 })
          .add(onDone, "-=0.15")
          .to(el, { yPercent: -100, duration: 1.1, ease: "expo.inOut" }, "<");
      },
    });
    return () => tween.kill();
  }, [target, done, reduced, onDone]);

  if (gone) return null;

  return (
    <div
      ref={root}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink"
      role="progressbar"
      aria-label="Loading"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(level)}
    >
      <div ref={logo} className="relative h-[clamp(140px,26vh,220px)] aspect-[355/456]">
        <img src={outline} alt="" className="absolute inset-0 h-full w-full" />
        <img
          src={fill}
          alt=""
          className="absolute inset-0 h-full w-full"
          style={{ clipPath: `inset(${100 - level}% 0 0 0)` }}
        />
      </div>
    </div>
  );
};

export default Preloader;
