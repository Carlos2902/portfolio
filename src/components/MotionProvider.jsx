import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { MotionContext, PIN_QUERY, REDUCED_QUERY, lockScroll, setLenis, useMedia } from "../lib/motion";

export default function MotionProvider({ ready, children }) {
  const pinned = useMedia(PIN_QUERY);
  const reduced = useMedia(REDUCED_QUERY);

  // Smooth scrolling (skipped under reduced motion), driven by GSAP's ticker so ScrollTrigger stays in sync.
  useEffect(() => {
    if (reduced) return;
    const instance = new Lenis({ lerp: 0.1, wheelMultiplier: 1.05 });
    setLenis(instance);
    instance.on("scroll", ScrollTrigger.update);
    const tick = (time) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      instance.destroy();
      setLenis(null);
    };
  }, [reduced]);

  // Hold the page still until the preloader hands over.
  useEffect(() => {
    lockScroll(!ready);
    if (ready) window.scrollTo(0, 0);
  }, [ready, reduced]);

  // Every section builds its ScrollTriggers in its own layout effect; measure them all once they exist.
  useEffect(() => {
    if (!ready) return;
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
    // The preloader waits for fonts, so this only matters if its failsafe fired first.
    if (document.fonts && document.fonts.status !== "loaded") document.fonts.ready.then(() => ScrollTrigger.refresh());
  }, [ready, pinned]);

  return <MotionContext.Provider value={{ ready, pinned, reduced }}>{children}</MotionContext.Provider>;
}

