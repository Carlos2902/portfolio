import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { hero } from "../content";
import { splitLines, useMotion } from "../lib/motion";
import LightRays from "./hero/LightRays";
import LogoScene from "./hero/LogoScene";

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
        .timeline({ delay: 0.35 })
        .set(q("[data-hero-reveal]"), { autoAlpha: 1 })
        .fromTo(q("[data-hero-logo]"), { autoAlpha: 0, scale: 0.9, y: 30 }, { autoAlpha: 1, scale: 1, y: 0, duration: 1.8, ease: "expo.out" }, 0)
        .from(lines, { yPercent: 110, duration: 1.2, ease: "power4.out", stagger: 0.09 }, 0.15)
        .fromTo(q("[data-hero-cue]"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8 }, 0.9);

      // Leaving the hero: push back and dim (like the Codrops frame).
      gsap
        .timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: section.current, start: "top top", end: "bottom top", scrub: true },
        })
        .to(q("[data-hero-inner]"), { yPercent: 18, scale: 0.95, filter: "brightness(35%)" });
    },
    { scope: section, dependencies: [ready, reduced] }
  );

  return (
    <section id="top" ref={section} data-theme="dark" className="relative overflow-hidden">
      <LightRays />

      <div
        data-hero-inner
        className="page-x relative grid min-h-[100svh] grid-cols-1 content-center items-center gap-6 pb-16 pt-24 lg:grid-cols-2 lg:gap-10 lg:py-24"
      >
        <div data-hero-logo className="h-[42svh] min-h-[260px] lg:h-[74svh]">
          <LogoScene onReady={onModelReady} reduced={reduced} />
        </div>

        <div className="max-w-[40rem] text-center lg:text-left">
          <h1
            data-hero-reveal
            className="font-semibold leading-[0.92] tracking-[-0.045em] text-[clamp(3.25rem,8.4vw,8rem)]"
          >
            {hero.headline} <em className="accent-serif">{hero.name}</em>
          </h1>
          <p
            data-hero-reveal
            className="mx-auto mt-6 max-w-[32rem] font-serif text-[clamp(1.35rem,2.3vw,2rem)] italic leading-[1.2] text-white/85 lg:mx-0"
          >
            {hero.subtitle}
          </p>
          <p data-hero-reveal className="mx-auto mt-6 max-w-[28rem] text-[0.98rem] leading-relaxed text-white/55 lg:mx-0">
            {hero.body}
          </p>
        </div>
      </div>

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
