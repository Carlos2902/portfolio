import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { experience, MAX_POINTS } from "../content";
import { fadeUpOnEnter, registerAnchor, splitLines, useMotion } from "../lib/motion";
import { SectionLabel, TextLink } from "./ui";

const Entry = ({ job, i, pinned }) => (
  <li
    data-entry
    className={`relative ${
      pinned ? "w-[min(62vw,500px)] shrink-0 pr-12 lg:w-[min(36vw,580px)] lg:pr-16" : "pb-14 pl-8 last:pb-0 sm:pl-12"
    }`}
  >
    <span
      data-dot
      className={`absolute block h-[9px] w-[9px] rounded-full bg-paper ring-[6px] ring-ink ${
        pinned ? "left-0 top-[7px]" : "-left-[5px] top-3"
      }`}
    />
    <div className={pinned ? "pt-10" : ""}>
      <div className="reveal-mask">
        <p
          data-number
          className="outline-number font-semibold leading-[0.85] tracking-[-0.05em] text-[clamp(3.5rem,10svh,7.5rem)]"
          aria-hidden="true"
        >
          {String(i + 1).padStart(2, "0")}
        </p>
      </div>
      <div data-entry-body>
        <p className="mt-4 font-serif text-lg italic text-muted">{job.dates}</p>
        <h3 className="mt-1 text-[clamp(1.5rem,2.3vw,2.2rem)] font-semibold leading-[1.1] tracking-[-0.03em]">{job.role}</h3>
        <p className="mt-1.5 text-[0.95rem] text-white/80">
          {job.company} <span className="text-muted">· {job.location}</span>
        </p>
        <ul className="mt-5 max-w-[32rem] space-y-2.5 text-[0.92rem] leading-relaxed text-white/65">
          {job.points.map((point, j) => (
            <li
              key={j}
              className={`relative pl-5 ${pinned && j >= MAX_POINTS ? "hidden" : ""} ${
                pinned && j >= MAX_POINTS - 1 ? "[@media(max-height:800px)]:hidden" : ""
              }`}
            >
              <span className="absolute left-0 top-[0.8em] h-px w-2.5 bg-[color:var(--accent)]" aria-hidden="true" />
              {point}
            </li>
          ))}
        </ul>
        {job.link && (
          <TextLink href={job.link.href} className="mt-5 text-[0.88rem] font-medium text-accent">
            {job.link.label}
          </TextLink>
        )}
      </div>
    </div>
  </li>
);

const Experience = () => {
  const { ready, pinned, reduced } = useMotion();
  const section = useRef(null);
  const viewport = useRef(null);
  const track = useRef(null);

  useGSAP(
    () => {
      if (!ready || reduced) return;
      const q = gsap.utils.selector(section);

      if (!pinned) {
        fadeUpOnEnter(q("[data-anim='label'], [data-heading]"), section.current);
        q("[data-entry]").forEach((el) => fadeUpOnEnter(el, el));
        return;
      }

      const overflow = () => Math.max(0, track.current.scrollWidth - viewport.current.clientWidth);
      const unit = () => window.innerHeight * 0.8;
      const travel = overflow() / unit();

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
          refreshPriority: 3,
        },
      });

      tl.from(q("[data-anim='label']"), { autoAlpha: 0, x: -20, duration: 0.3 }, 0)
        .from(splitLines(q("[data-heading]")[0]).lines, { yPercent: 115, duration: 0.45, ease: "power4", stagger: 0.06 }, 0)
        .from(q("[data-line]"), { scaleX: 0, transformOrigin: "0% 50%", duration: 0.6, ease: "power2.inOut" }, 0.1)
        .from(q("[data-dot]"), { scale: 0, duration: 0.25, stagger: 0.1, ease: "back.out(3)" }, 0.25)
        .from(q("[data-number]"), { yPercent: 105, duration: 0.45, stagger: 0.1, ease: "power4" }, 0.3)
        .from(q("[data-entry-body]"), { y: 70, autoAlpha: 0, duration: 0.5, stagger: 0.1 }, 0.38)
        .addLabel("formed");

      if (travel > 0) {
        tl.to(track.current, { x: () => -overflow(), ease: "none", duration: travel }, "formed").fromTo(
          q("[data-line-fill]"),
          { scaleX: 0 },
          { scaleX: 1, transformOrigin: "0% 50%", ease: "none", duration: travel },
          "formed"
        );
      }
      tl.to({}, { duration: 0.15 });

      return registerAnchor("work", () => tl.scrollTrigger.labelToScroll("formed"));
    },
    { scope: section, dependencies: [ready, pinned, reduced], revertOnUpdate: true }
  );

  return (
    <section id="work" ref={section} data-theme="dark" className={`relative overflow-hidden ${pinned ? "h-[100svh]" : ""}`}>
      <div
        className={`page-x with-rail h-full gap-y-6 ${
          pinned ? "grid-rows-[auto_1fr] pb-10 pt-24 lg:grid-rows-1 lg:pt-28 [@media(max-height:800px)]:pt-20" : "py-24 lg:py-32"
        }`}
      >
        <div className="lg:pt-6">
          <SectionLabel num="02">Work</SectionLabel>
        </div>

        <div className="flex min-h-0 min-w-0 flex-col">
          <h2 data-heading className="section-heading">
            Where I’ve <em className="accent-serif">worked</em>
          </h2>

          <div
            ref={viewport}
            className={pinned ? "-mr-5 mt-10 min-h-0 flex-1 sm:-mr-8 lg:-mr-12 lg:mt-14 [@media(max-height:800px)]:mt-8" : "mt-14"}
          >
            <ol
              ref={track}
              className={`relative ${pinned ? "flex h-full w-max items-start pr-5 sm:pr-8 lg:pr-12" : "ml-1 border-l border-line"}`}
            >
              {pinned && (
                <>
                  <span data-line className="absolute left-0 right-0 top-[11px] h-px bg-white/15" aria-hidden="true" />
                  <span
                    data-line-fill
                    className="absolute left-0 right-0 top-[11px] h-px origin-left scale-x-0 bg-[color:var(--accent)]"
                    aria-hidden="true"
                  />
                </>
              )}
              {experience.map((job, i) => (
                <Entry key={`${job.company}-${job.dates}`} job={job} i={i} pinned={pinned} />
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Experience;
