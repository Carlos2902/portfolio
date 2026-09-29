import { createContext, useContext, useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

// Handy for poking at scroll positions from the devtools console during development.
if (import.meta.env.DEV) window.__ScrollTrigger = ScrollTrigger;

// Full scroll choreography (pinning, scrubbed formations, horizontal travel) needs room and motion.
export const PIN_QUERY = "(min-width: 768px) and (min-height: 600px) and (prefers-reduced-motion: no-preference)";
export const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

export function useMedia(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

let lenis = null;

// Sections register where "arrived" is (e.g. the end of their formation) so nav links land on a finished layout.
const anchors = new Map();

export function registerAnchor(id, getY) {
  anchors.set(id, getY);
  return () => anchors.get(id) === getY && anchors.delete(id);
}

export function scrollToSection(id) {
  const getY = anchors.get(id);
  const el = document.getElementById(id);
  const y = getY ? getY() : el ? el.getBoundingClientRect().top + window.scrollY : 0;
  scrollToY(y);
}

export function scrollToY(y, duration = 1.4) {
  if (lenis) lenis.scrollTo(y, { duration });
  else window.scrollTo({ top: y, behavior: window.matchMedia(REDUCED_QUERY).matches ? "auto" : "smooth" });
}

export function lockScroll(locked) {
  if (lenis) locked ? lenis.stop() : lenis.start();
  document.documentElement.style.overflow = locked ? "hidden" : "";
}

export const MotionContext = createContext({ ready: false, pinned: false, reduced: false });
export const useMotion = () => useContext(MotionContext);

export function setLenis(instance) {
  lenis = instance;
}

// Split a heading into masked lines for a rise-in reveal.
export function splitLines(el) {
  return SplitText.create(el, { type: "lines", mask: "lines", linesClass: "split-line" });
}

// Simple on-enter reveal used when sections don't pin (phones, short screens).
export function fadeUpOnEnter(targets, trigger, stagger = 0.08) {
  return gsap.from(targets, {
    y: 36,
    autoAlpha: 0,
    duration: 0.9,
    ease: "power3.out",
    stagger,
    scrollTrigger: { trigger, start: "top 82%" },
  });
}
