import { Suspense, lazy, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { hero } from "../content";
import { splitLines, useMotion } from "../lib/motion";
import LiquidFlow from "./hero/LiquidFlow";
// three.js and the 3D scene load as a separate chunk, in parallel with the preloader.
const LogoScene = lazy(() => import("./hero/LogoScene"));

const Hero = ({ onModelReady }) => {
  const { ready, reduced } = useMotion();
  const section = useRef(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(section);
      if (reduced) return;
      if (!ready) {
        // Hidden until the preloader lifts, so nothing flashes underneath it.
        gsap.set(q("[data-hero-reveal], [data-hero-logo], [data-hero-cue]"), { autoAlpha: 0 });
        return;
      }

      // Staggered line reveal on load.
      const lines = q("[data-hero-reveal]").flatMap((el) => splitLines(el).lines);
      gsap
        .timeline({ delay: 0.45 }) // lines rise as the preloader curtain uncovers the hero
        .set(q("[data-hero-reveal]"), { autoAlpha: 1 })
        .fromTo(q("[data-hero-logo]"), { autoAlpha: 0, scale: 0.94, y: 20 }, { autoAlpha: 1, scale: 1, y: 0, duration: 1.1, ease: "expo.out" }, 0)
        .from(lines, { yPercent: 110, duration: 0.8, ease: "power4.out", stagger: 0.055 }, 0.08)
        .fromTo(q("[data-hero-cue]"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, 0.5);

      // Leaving the hero: push back and dim (like the Codrops frame). Dimming is an overlay's opacity,
      // not a CSS filter, so the WebGL layers underneath aren't re-rasterized every frame.
      gsap
        .timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: section.current, start: "top top", end: "bottom top", scrub: true },
        })
        .to(q("[data-hero-inner]"), { yPercent: 18, scale: 0.95, force3D: true })
        .to(q("[data-hero-dim]"), { opacity: 0.65 }, 0);
    },
    { scope: section, dependencies: [ready, reduced] }
  );

  return (
    <section id="top" ref={section} data-theme="dark" className="relative overflow-hidden">
      {!reduced && <LiquidFlow area={section} active={ready} />}
      <div className="hero-wash" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="hero-grain" />
      </div>

      <div
        data-hero-inner
        className="page-x relative grid min-h-[100svh] grid-cols-1 content-center items-center gap-6 pb-16 pt-24 lg:grid-cols-2 lg:gap-10 lg:py-24"
      >
        <div data-hero-logo className="h-[42svh] min-h-[260px] lg:h-[74svh]">
          <Suspense fallback={null}>
            <LogoScene onReady={onModelReady} reduced={reduced} />
          </Suspense>
        </div>

        <div className="relative isolate max-w-[42rem] text-center lg:text-left">
          {/* Soft dark halo so the copy stays legible when the liquid lights up behind it. */}
          <div
            className="pointer-events-none absolute -inset-x-16 -inset-y-20 -z-10 bg-[radial-gradient(closest-side,rgb(14_14_13/0.82),rgb(14_14_13/0.55)_55%,transparent)]"
            aria-hidden="true"
          />
          <h1
            data-hero-reveal
            className="font-semibold leading-[1.02] tracking-[-0.04em] text-[clamp(2.3rem,4.3vw,4.4rem)] [text-wrap:balance]"
          >
            {hero.statement}
          </h1>
          <p data-hero-reveal className="mx-auto mt-7 max-w-[30rem] text-[1.02rem] leading-relaxed text-white/60 lg:mx-0">
            {hero.body}
          </p>
        </div>
      </div>

      <div data-hero-dim className="pointer-events-none absolute inset-0 bg-ink opacity-0" aria-hidden="true" />

      <div
        data-hero-cue
        className="pointer-events-none absolute bottom-7 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 sm:flex"
        aria-hidden="true"
      >
        <span className="eyebrow">Scroll</span>
        <span className="h-10 w-px bg-gradient-to-b from-white/60 to-transparent" />
      </div>
    </section>
  );
};

export default Hero;
