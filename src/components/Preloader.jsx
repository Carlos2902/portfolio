import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useMotion } from "../lib/motion";
import outline from "../assets/logo-c-outline.png";
import fill from "../assets/logo-c-fill.png";

const MIN_DURATION = 0.9; // seconds; keeps the fill readable even when everything is cached
const FAILSAFE = 12000; // ms; never trap visitors behind the loader
// The fill rises over time (easing toward 85%) and only completes once the logo and fonts have loaded.
const creepAt = (seconds) => 85 * (1 - Math.exp(-seconds / 1.2));
// Explicitly load every face the page uses: document.fonts.ready alone can resolve before a face has
// even been requested, and a late font swap re-lays out every pinned section mid-scroll.
const FONTS = ['400 1em "General Sans"', '500 1em "General Sans"', '600 1em "General Sans"', 'italic 400 1em "Cormorant Garamond"'];
const loadFonts = () =>
  document.fonts ? Promise.all(FONTS.map((f) => document.fonts.load(f))).then(() => document.fonts.ready) : Promise.resolve();

// The logo drawn as an outline fills with white from the bottom while the 3D logo and fonts load,
// then a curtain lifts off the page.
const Preloader = ({ modelReady, onDone }) => {
  const { reduced } = useMotion();
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
    loadFonts()
      .catch(() => {})
      .then(() => alive && setFontsReady(true));
    const timer = setTimeout(() => setForced(true), FAILSAFE);
    const ticker = setInterval(() => setCreep(creepAt((performance.now() - startedAt.current) / 1000)), 120);
    return () => {
      alive = false;
      clearTimeout(timer);
      clearInterval(ticker);
    };
  }, []);

  const done = forced || (modelReady && fontsReady);
  const target = done ? 100 : creep;

  useEffect(() => {
    const elapsed = (performance.now() - startedAt.current) / 1000;
    const tween = gsap.to(counter.current, {
      value: target,
      duration: done ? Math.max(0.35, MIN_DURATION - elapsed) : 0.3,
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
        // Build the page's scroll animations while the loader still covers it (the heaviest frame),
        // then lift the curtain on the next frames so the exit stays smooth.
        onDone();
        requestAnimationFrame(() =>
          requestAnimationFrame(() =>
            gsap
              .timeline({ onComplete: () => setGone(true) })
              .to(logo.current, { scale: 1.06, autoAlpha: 0, duration: 0.35, ease: "power2.in" })
              .to(el, { yPercent: -100, duration: 0.8, ease: "expo.inOut", force3D: true }, "-=0.15")
          )
        );
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
