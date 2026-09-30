import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { projects } from "../content";
import { fadeUpOnEnter, registerAnchor, scrollToY, splitLines, useMotion } from "../lib/motion";
import { ArrowButton, SectionLabel, TextLink } from "./ui";

const pad = (n) => String(n).padStart(2, "0");

// Stand-in artwork until the real project images arrive (see `image` in content.js).
const Placeholder = ({ from, to, label, note }) => (
  <div
    className="absolute inset-0 flex flex-col items-center justify-between p-6 text-white"
    style={{ background: `radial-gradient(120% 90% at 50% 110%, ${to} 0%, ${from} 70%)` }}
    data-placeholder
  >
    <svg className="absolute inset-0 h-full w-full opacity-[0.12]" aria-hidden="true">
      <defs>
        <pattern id={`grid-${label}-${note}`} width="36" height="36" patternUnits="userSpaceOnUse">
          <path d="M36 0H0v36" fill="none" stroke="white" strokeWidth="0.6" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#grid-${label}-${note})`} />
    </svg>
    <span className="relative mt-[8%] text-[clamp(1.6rem,2.6vw,2.4rem)] font-semibold tracking-[-0.03em]">{label}</span>
    <span className="relative self-start font-serif text-xl italic opacity-80">{note}</span>
  </div>
);

const ProjectCard = ({ project, pinned }) => (
  <li
    className={`project-card w-[min(80vw,400px)] shrink-0 md:w-[min(44vw,440px)] lg:w-[min(29vw,470px)] ${
      // Pinned: cards share the track's rows (subgrid), so every image gets the same height.
      pinned ? "row-span-2 grid grid-rows-subgrid" : "flex flex-col"
    }`}
  >
    <div className={`relative overflow-hidden rounded-2xl bg-[color:var(--chip)] ${pinned ? "h-full min-h-0" : "aspect-[4/3]"}`}>
      {project.image ? (
        <img src={project.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <Placeholder {...project.placeholder} />
      )}
    </div>
    <div className="pt-5">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-[1.6rem] font-semibold leading-tight tracking-[-0.03em]">{project.name}</h3>
        <span className="shrink-0 font-serif text-lg italic text-muted">{project.kind}</span>
      </div>
      <p className="mt-2 text-[0.92rem] leading-relaxed text-muted">{project.description}</p>
      <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[0.8rem] font-medium text-accent" aria-label="Technologies">
        {project.tech.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
      <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[0.88rem] font-medium">
        {project.links.map((l) => (
          <li key={l.href}>
            <TextLink href={l.href} hrefLang={l.hrefLang}>
              {l.label}
            </TextLink>
          </li>
        ))}
      </ul>
    </div>
  </li>
);

const Projects = () => {
  const { ready, pinned, reduced } = useMotion();
  const section = useRef(null);
  const viewport = useRef(null);
  const track = useRef(null);
  const goTo = useRef(null);
  const [index, setIndex] = useState(0);
  const count = projects.length;

  useGSAP(
    () => {
      const q = gsap.utils.selector(section);
      const cards = q(".project-card");
      // The counter and arrows step evenly through the carousel's travel: 01 at the start, last at the end.
      const stepOf = (progress) => Math.round(progress * (count - 1));
      const progressOf = (i) => (count > 1 ? i / (count - 1) : 0);
      let current = 0;
      const setCurrent = (i) => i !== current && setIndex((current = i));

      if (!pinned) {
        // Native swipe carousel; arrows scroll the track.
        const vp = viewport.current;
        const maxScroll = () => Math.max(1, vp.scrollWidth - vp.clientWidth);
        goTo.current = (i) => vp.scrollTo({ left: progressOf(i) * maxScroll(), behavior: reduced ? "auto" : "smooth" });
        const onScroll = () => setCurrent(stepOf(vp.scrollLeft / maxScroll()));
        vp.addEventListener("scroll", onScroll, { passive: true });
        if (ready && !reduced) fadeUpOnEnter([...q("[data-anim='label'], [data-heading]"), ...cards, ...q("[data-anim='controls']")], section.current);
        return () => vp.removeEventListener("scroll", onScroll);
      }

      if (!ready) return;

      // Pinned: the layout forms, then page scroll slides the cards sideways, all in one timeline.
      const overflow = () => Math.max(0, track.current.scrollWidth - viewport.current.clientWidth);
      const unit = () => window.innerHeight * 0.8; // scroll distance for one timeline second
      const travel = overflow() / unit();
      const mid = (cards.length - 1) / 2;

      const tl = gsap.timeline({
        defaults: { ease: "power3" },
        scrollTrigger: {
          trigger: section.current,
          start: "top top",
          end: () => `+=${tl.duration() * unit()}`,
          pin: true,
          scrub: 0.35,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          refreshPriority: 4,
          onUpdate: () => overflow() && setCurrent(stepOf(-gsap.getProperty(track.current, "x") / overflow())),
        },
      });

      tl.from(q("[data-anim='label']"), { autoAlpha: 0, x: -20, duration: 0.3 }, 0)
        .from(splitLines(q("[data-heading]")[0]).lines, { yPercent: 115, duration: 0.45, ease: "power4", stagger: 0.06 }, 0)
        .from(
          cards,
          {
            y: (i) => window.innerHeight * (0.85 + i * 0.12),
            rotation: (i) => (i < mid ? -1 : 1) * Math.abs(i - mid) * 4 || 2,
            transformOrigin: "50% 0%",
            duration: 0.75,
            stagger: 0.1,
          },
          0.08
        )
        .from(q("[data-anim='controls']"), { autoAlpha: 0, y: 24, duration: 0.3 }, 0.6)
        .addLabel("formed");

      if (travel > 0) tl.to(track.current, { x: () => -overflow(), ease: "none", duration: travel }, "formed");
      tl.to({}, { duration: 0.15 }); // brief hold before releasing the pin

      goTo.current = (i) => {
        const st = tl.scrollTrigger;
        const time = tl.labels.formed + progressOf(i) * travel;
        scrollToY(st.start + (time / tl.duration()) * (st.end - st.start), 1.1);
      };

      return registerAnchor("projects", () => tl.scrollTrigger.labelToScroll("formed"));
    },
    { scope: section, dependencies: [ready, pinned, reduced], revertOnUpdate: true }
  );

  return (
    <section id="projects" ref={section} data-theme="light" className={`relative overflow-hidden ${pinned ? "h-[100svh]" : ""}`}>
      <div
        className={`page-x with-rail h-full gap-y-6 ${
          pinned ? "grid-rows-[auto_1fr] pb-8 pt-24 lg:grid-rows-1 lg:pt-28 [@media(max-height:800px)]:pt-20" : "py-24 lg:py-32"
        }`}
      >
        <div className="lg:pt-6">
          <SectionLabel num="01">Selected work</SectionLabel>
        </div>

        <div className="flex min-h-0 min-w-0 flex-col">
          <h2 data-heading className="section-heading">
            Selected <em className="accent-serif">projects</em>
          </h2>

          <div
            ref={viewport}
            className={`-mr-5 mt-8 sm:-mr-8 lg:-mr-12 lg:mt-10 [@media(max-height:800px)]:mt-6 ${
              pinned ? "min-h-0 flex-1" : "swipe-track overflow-x-auto"
            }`}
            tabIndex={pinned ? undefined : 0}
            role="region"
            aria-label="Projects carousel"
          >
            <ul
              ref={track}
              className={`w-max gap-5 pr-5 sm:pr-8 lg:gap-7 lg:pr-12 ${
                pinned ? "grid h-full max-h-[760px] grid-flow-col grid-rows-[minmax(110px,1fr)_auto] gap-y-0" : "flex"
              }`}
            >
              {projects.map((p) => (
                <ProjectCard key={`${p.name}-${p.kind}`} project={p} pinned={pinned} />
              ))}
            </ul>
          </div>

          <div data-anim="controls" className="mt-6 flex items-center lg:mt-8 [@media(max-height:800px)]:mt-5">
            <div className="flex items-center gap-5">
              <div className="flex gap-2">
                <ArrowButton dir="prev" label="Previous project" disabled={index === 0} onClick={() => goTo.current?.(index - 1)} />
                <ArrowButton dir="next" label="Next project" disabled={index === count - 1} onClick={() => goTo.current?.(index + 1)} />
              </div>
              <p className="tabular-nums" aria-live="polite">
                <span className="font-medium">{pad(index + 1)}</span>
                <span className="font-serif italic text-muted"> / {pad(count)}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Projects;
